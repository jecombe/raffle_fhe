// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "./interfaces/IEncryptedERC20.sol";

import "./encryptedErc20/EncryptedERC20.sol";

contract Ticket is GatewayCaller, EncryptedERC20 {
    
    IEncryptedERC20 public token;

    uint256 public endTime = 0;

    constructor(
        address _owner,
        uint amount,
        string memory _name,
        string memory _symbol,
        address _tokenAddress
    ) EncryptedERC20(_name, _symbol) {
        token = IEncryptedERC20(_tokenAddress);
    }

    function buyTicket(einput _eUser, einput _eAmount, bytes calldata inputProof) external {
        require(endTime > 0, "the tombola is not starting ");

        require(block.timestamp <= endTime, "Tombola has ended");

        euint64 eAmount = TFHE.asEuint64(_eAmount, inputProof);
        TFHE.allow(eAmount, address(this));

        eaddress eUser = TFHE.asEaddress(_eUser, inputProof);
        TFHE.allow(eUser, address(this));

        euint64 randomNumber = TFHE.randEuint64();
    }
}
