// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IAgentRegistry, IPancakeRouter02, IAgentPadToken, IAgentFeeVaultLike} from "./interfaces/Interfaces.sol";

/// @title AgentPadCurve
/// @notice One bonding curve per launch. Holds the launch token's entire supply until
/// graduation. Priced with virtual reserves (k = virtualToken * virtualBnb), so no
/// liquidity has to exist up front and nobody can snipe a pool that is not there yet.
///
/// Trade fee is 1% of every buy and sell:
///   0.70% creator · 0.25% protocol · 0.05% prize pool
/// Fees accrue in BNB and are pushed out by sweep(), never pulled by an admin.
///
/// The first AGENT_WINDOW seconds after launch accept buys only from wallets holding a
/// Binance Agent ID. After that the curve is open to any wallet.
///
/// Once GRADUATION_BNB of real BNB has been collected the curve closes, all remaining
/// tokens plus the collected BNB are handed to the PancakeSwap router, and the LP tokens
/// go to an LPLocker that has no withdraw path.
contract AgentPadCurve {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18;
    uint256 public constant VIRTUAL_BNB = 1.5 ether;
    uint256 public constant GRADUATION_BNB = 8 ether;
    uint256 public constant AGENT_WINDOW = 30 minutes;

    uint256 public constant FEE_BPS = 100; // 1.00%
    uint256 public constant CREATOR_BPS = 70; // of the fee
    uint256 public constant PROTOCOL_BPS = 25; // of the fee
    uint256 public constant PRIZE_BPS = 5; // of the fee

    address public immutable token;
    address public immutable creator;
    address public immutable registry;
    address public immutable treasury;
    address public immutable prizePool;
    address public immutable vault;
    address public immutable router;
    address public immutable locker;
    uint64 public immutable opensAt;

    uint256 public virtualTokenReserve;
    uint256 public virtualBnbReserve;
    uint256 public realBnbReserve;

    uint256 public creatorOwed;
    uint256 public protocolOwed;
    uint256 public prizeOwed;

    bool public graduated;
    uint256 public totalBuys;
    uint256 public totalSells;

    event Bought(address indexed buyer, uint256 bnbIn, uint256 tokensOut, uint256 fee);
    event Sold(address indexed seller, uint256 tokensIn, uint256 bnbOut, uint256 fee);
    event Swept(uint256 creator, uint256 protocol, uint256 prize);
    event Graduated(uint256 bnbIntoPool, uint256 tokensIntoPool, address locker);

    error TradingClosed();
    error AgentOnly();
    error ZeroValue();
    error TooMuchOut();
    error NotEnoughBnb();

    constructor(
        address token_,
        address creator_,
        address registry_,
        address treasury_,
        address prizePool_,
        address vault_,
        address router_,
        address locker_
    ) {
        token = token_;
        creator = creator_;
        registry = registry_;
        treasury = treasury_;
        prizePool = prizePool_;
        vault = vault_;
        router = router_;
        locker = locker_;
        opensAt = uint64(block.timestamp);
        virtualTokenReserve = TOTAL_SUPPLY;
        virtualBnbReserve = VIRTUAL_BNB;
    }

    /// @notice True while only Agent ID holders may buy.
    function agentOnlyPhase() public view returns (bool) {
        return block.timestamp < uint256(opensAt) + AGENT_WINDOW;
    }

    /// @notice Current spot price in wei of BNB per 1e18 tokens.
    function price() public view returns (uint256) {
        return (virtualBnbReserve * 1e18) / virtualTokenReserve;
    }

    /// @notice Tokens still sitting in the curve (what a graduate would pair).
    function tokensLeft() public view returns (uint256) {
        return IAgentPadToken(token).balanceOf(address(this));
    }

    function quoteBuy(uint256 bnbIn) public view returns (uint256 tokensOut, uint256 fee) {
        if (bnbIn == 0) return (0, 0);
        fee = (bnbIn * FEE_BPS) / 10_000;
        uint256 net = bnbIn - fee;
        uint256 k = virtualTokenReserve * virtualBnbReserve;
        uint256 newBnb = virtualBnbReserve + net;
        uint256 newToken = k / newBnb;
        tokensOut = virtualTokenReserve - newToken;
    }

    function quoteSell(uint256 tokensIn) public view returns (uint256 bnbOut, uint256 fee) {
        if (tokensIn == 0) return (0, 0);
        uint256 k = virtualTokenReserve * virtualBnbReserve;
        uint256 newToken = virtualTokenReserve + tokensIn;
        uint256 newBnb = k / newToken;
        uint256 gross = virtualBnbReserve - newBnb;
        fee = (gross * FEE_BPS) / 10_000;
        bnbOut = gross - fee;
    }

    function buy() external payable {
        if (graduated) revert TradingClosed();
        if (msg.value == 0) revert ZeroValue();
        if (agentOnlyPhase() && IAgentRegistry(registry).balanceOf(msg.sender) == 0) revert AgentOnly();

        (uint256 tokensOut, uint256 fee) = quoteBuy(msg.value);
        if (tokensOut >= virtualTokenReserve) revert TooMuchOut();

        uint256 net = msg.value - fee;
        virtualTokenReserve -= tokensOut;
        virtualBnbReserve += net;
        realBnbReserve += net;

        _accrue(fee);
        totalBuys++;

        require(IAgentPadToken(token).transfer(msg.sender, tokensOut), "transfer");
        emit Bought(msg.sender, msg.value, tokensOut, fee);

        _maybeGraduate();
    }

    function sell(uint256 tokensIn) external {
        if (graduated) revert TradingClosed();
        if (tokensIn == 0) revert ZeroValue();

        (uint256 bnbOut, uint256 fee) = quoteSell(tokensIn);
        if (bnbOut + fee > realBnbReserve) revert NotEnoughBnb();

        uint256 gross = bnbOut + fee;
        virtualTokenReserve += tokensIn;
        virtualBnbReserve -= gross;
        realBnbReserve -= gross;

        _accrue(fee);
        totalSells++;

        require(IAgentPadToken(token).transferFrom(msg.sender, address(this), tokensIn), "pull");
        (bool ok, ) = payable(msg.sender).call{value: bnbOut}("");
        require(ok, "bnb out");
        emit Sold(msg.sender, tokensIn, bnbOut, fee);
    }

    /// @notice Push accrued fees to their recipients. Anyone can call; nothing is kept.
    function sweep() public {
        uint256 c = creatorOwed;
        uint256 p = protocolOwed;
        uint256 z = prizeOwed;
        if (c + p + z == 0) return;
        creatorOwed = 0;
        protocolOwed = 0;
        prizeOwed = 0;

        if (c > 0) IAgentFeeVaultLike(vault).credit{value: c}(creator, c);
        if (p > 0) {
            (bool okP, ) = payable(treasury).call{value: p}("");
            require(okP, "protocol");
        }
        if (z > 0) {
            (bool okZ, ) = payable(prizePool).call{value: z}("");
            require(okZ, "prize");
        }
        emit Swept(c, p, z);
    }

    /// @notice Hand the curve over to PancakeSwap. Callable by anyone once the threshold is met.
    function graduate() public {
        if (graduated) revert TradingClosed();
        if (realBnbReserve < GRADUATION_BNB) revert NotEnoughBnb();

        sweep();

        uint256 bnbForLP = realBnbReserve;
        uint256 tokensForLP = tokensLeft();
        realBnbReserve = 0;
        graduated = true;

        if (bnbForLP > 0 && tokensForLP > 0) {
            IAgentPadToken(token).approve(router, tokensForLP);
            IPancakeRouter02(router).addLiquidityETH{value: bnbForLP}(
                token,
                tokensForLP,
                0,
                0,
                locker,
                block.timestamp + 20 minutes
            );
        }
        emit Graduated(bnbForLP, tokensForLP, locker);
    }

    function _accrue(uint256 fee) internal {
        uint256 c = (fee * CREATOR_BPS) / 100;
        uint256 p = (fee * PROTOCOL_BPS) / 100;
        creatorOwed += c;
        protocolOwed += p;
        prizeOwed += fee - c - p;
    }

    function _maybeGraduate() internal {
        if (realBnbReserve >= GRADUATION_BNB) graduate();
    }
}
