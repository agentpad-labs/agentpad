// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IAgentRegistry {
    function balanceOf(address account) external view returns (uint256);
}

interface IPancakeRouter02 {
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
}

interface IAgentPadToken {
    function approve(address spender, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

interface IAgentFeeVaultLike {
    function credit(address who, uint256 amount) external payable;
}
