// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @dev Stand-in for Binance Agent ID registry (real one is a public BSC contract).
contract MockAgentRegistry {
    mapping(address => uint256) public balanceOf;

    function set(address who, uint256 amount) external {
        balanceOf[who] = amount;
    }
}

/// @dev Minimal PancakeSwap-like router: pulls the tokens, takes the ETH, mints "LP" to `to`.
contract MockRouter {
    mapping(address => mapping(address => uint256)) public allowanceOf;
    mapping(address => uint256) public lpBalance; // lpToken(papered as address(this)) -> amount
    uint256 public lpCounter;

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256,
        uint256,
        address to,
        uint256
    ) external payable returns (uint256, uint256, uint256) {
        // pull tokens: expects approve() first
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amountTokenDesired)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "pull");

        uint256 liq = amountTokenDesired + msg.value;
        lpBalance[to] += liq;
        lpCounter += liq;
        return (amountTokenDesired, msg.value, liq);
    }

    function balanceOf(address who) external view returns (uint256) {
        return lpBalance[who];
    }
}
