// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IERC20Balance {
    function balanceOf(address account) external view returns (uint256);
}

/// @title LPLocker
/// @notice Holds graduation LP tokens forever. There is no owner, no withdraw function and
/// no upgrade path: the only thing this contract can do is report what it holds. That is the
/// whole point — a launchpad where the creator can pull the pool is a rug machine.
contract LPLocker {
    event Locked(address indexed lpToken, uint256 amount, address indexed pair, uint256 launchId);

    address public immutable factory;

    constructor(address factory_) {
        factory = factory_;
    }

    function lockedBalance(address lpToken) external view returns (uint256) {
        return IERC20Balance(lpToken).balanceOf(address(this));
    }

    // no withdraw. intentionally.
}
