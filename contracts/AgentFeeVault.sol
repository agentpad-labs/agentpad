// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title AgentFeeVault
/// @notice Holds creator trading fees in BNB, keyed by the wallet that launched the token.
/// Anyone may credit an account (curves do it during sweep); only the credited account can
/// withdraw, and there is no owner, no pause and no route for a third party to move funds.
contract AgentFeeVault {
    mapping(address => uint256) public balanceOf;

    event Credited(address indexed who, uint256 amount, address from);
    event Claimed(address indexed who, uint256 amount);

    error NothingToClaim();
    error TransferFailed();

    function credit(address who, uint256 amount) external payable {
        require(msg.value == amount, "value");
        balanceOf[who] += amount;
        emit Credited(who, amount, msg.sender);
    }

    function claim() external {
        uint256 amount = balanceOf[msg.sender];
        if (amount == 0) revert NothingToClaim();
        balanceOf[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Claimed(msg.sender, amount);
    }

    function claimTo(address payable to) external {
        uint256 amount = balanceOf[msg.sender];
        if (amount == 0) revert NothingToClaim();
        balanceOf[msg.sender] = 0;
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Claimed(msg.sender, amount);
    }
}
