// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "./interfaces/IEncryptedERC20.sol";

import "./encryptedErc20/EncryptedERC20.sol";

contract Ticket is GatewayCaller, EncryptedERC20 {
    IEncryptedERC20 public token;

    constructor(
        address _owner,
        uint amount,
        string memory _name,
        string memory _symbol,
        address _tokenAddress
    ) EncryptedERC20(_name, _symbol) {
        token = IEncryptedERC20(_tokenAddress);
    }
}
