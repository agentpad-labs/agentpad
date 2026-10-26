// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AgentPadToken} from "./AgentPadToken.sol";
import {AgentPadCurve} from "./AgentPadCurve.sol";
import {IAgentRegistry} from "./interfaces/Interfaces.sol";

/// @title AgentPadFactory
/// @notice Creates a token plus its bonding curve in one transaction.
/// Only wallets holding a Binance Agent ID may launch, and each agent wallet may launch
/// at most MAX_LAUNCHES_PER_WINDOW times per QUOTA_WINDOW.
contract AgentPadFactory {
    uint256 public constant LAUNCH_FEE = 0.002 ether;
    uint256 public constant MAX_LAUNCHES_PER_WINDOW = 2;
    uint256 public constant QUOTA_WINDOW = 30 days;

    address public immutable registry;
    address public immutable treasury;
    address public immutable prizePool;
    address public immutable vault;
    address public immutable router;
    address public immutable locker;

    struct Launch {
        address token;
        address curve;
        address creator;
        string name;
        string symbol;
        string metadataURI;
        uint64 createdAt;
    }

    Launch[] public launches;
    mapping(address => uint256[]) public launchesByCreator;
    mapping(address => uint256) public launchCount;
    mapping(address => uint256) public windowStartedAt;

    event LaunchCreated(
        uint256 indexed id,
        address indexed token,
        address indexed curve,
        address creator,
        string name,
        string symbol
    );

    error NoAgentId();
    error QuotaExceeded();
    error FeeTooLow();
    error EmptyName();

    constructor(
        address registry_,
        address treasury_,
        address prizePool_,
        address vault_,
        address router_,
        address locker_
    ) {
        registry = registry_;
        treasury = treasury_;
        prizePool = prizePool_;
        vault = vault_;
        router = router_;
        locker = locker_;
    }

    function launchCountOf(address creator) external view returns (uint256) {
        return launchesByCreator[creator].length;
    }

    /// @notice Has this wallet spent its quota for the current window?
    function quotaUsed(address creator) public view returns (uint256) {
        if (block.timestamp >= windowStartedAt[creator] + QUOTA_WINDOW) return 0;
        return launchCount[creator];
    }

    /// @notice Create a launch. msg.value must cover LAUNCH_FEE exactly.
    function createLaunch(
        string calldata name_,
        string calldata symbol_,
        string calldata metadataURI
    ) external payable returns (uint256 id, address token, address curve) {
        if (bytes(name_).length == 0) revert EmptyName();
        if (IAgentRegistry(registry).balanceOf(msg.sender) == 0) revert NoAgentId();
        if (quotaUsed(msg.sender) >= MAX_LAUNCHES_PER_WINDOW) revert QuotaExceeded();
        if (msg.value < LAUNCH_FEE) revert FeeTooLow();

        if (block.timestamp >= windowStartedAt[msg.sender] + QUOTA_WINDOW) {
            windowStartedAt[msg.sender] = block.timestamp;
            launchCount[msg.sender] = 0;
        }
        launchCount[msg.sender] += 1;

        AgentPadToken t = new AgentPadToken(name_, symbol_, 1_000_000_000e18, address(this));
        AgentPadCurve c = new AgentPadCurve(
            address(t),
            msg.sender,
            registry,
            treasury,
            prizePool,
            vault,
            router,
            locker
        );

        // hand the whole supply to the curve
        t.transfer(address(c), t.balanceOf(address(this)));

        id = launches.length;
        launches.push(
            Launch({
                token: address(t),
                curve: address(c),
                creator: msg.sender,
                name: name_,
                symbol: symbol_,
                metadataURI: metadataURI,
                createdAt: uint64(block.timestamp)
            })
        );
        launchesByCreator[msg.sender].push(id);

        if (msg.value > LAUNCH_FEE) {
            (bool refund, ) = payable(msg.sender).call{value: msg.value - LAUNCH_FEE}("");
            require(refund, "refund");
        }
        if (LAUNCH_FEE > 0) {
            (bool ok, ) = payable(treasury).call{value: LAUNCH_FEE}("");
            require(ok, "fee");
        }

        token = address(t);
        curve = address(c);
        emit LaunchCreated(id, token, curve, msg.sender, name_, symbol_);
    }

    function launchesLength() external view returns (uint256) {
        return launches.length;
    }
}
