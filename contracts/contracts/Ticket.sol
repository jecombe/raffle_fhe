// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "./interfaces/IEncryptedERC20.sol";

import "./encryptedErc20/EncryptedERC20.sol";

contract Ticket is GatewayCaller, EncryptedERC20 {
    IEncryptedERC20 public token;
    uint256 public endTime = 0;

    //STRUCT
    struct Participant {
        eaddress eAddress;
        euint64 eNumberRandom;
    }
    struct Taxes {
        euint64 eTaxFactory;
        euint64 eTaxCreatorTicket;
        euint64 eAmountFeesFactory;
        euint64 eAmountCreatorTicket;
    }

    struct Owners {
        address creatorTicket;
        address factoryAddr;
    }

    struct LastError {
        euint8 error;
        uint timestamp;
    }

    Taxes private eTaxes;
    Owners public owners;

    eaddress private eWinner;
    address public winnerDecrypt;

    euint64 public eNumberWin;
    uint64 public numberWinDecrypt;

    uint256 public ticketPrice = 0 ether;
    uint public limitedTicket = 0;

    //Encrypted Errors management variable
    euint8 internal NO_ERROR;
    euint8 internal ERROR;
    euint64 internal ZERO;

    euint64 closestDifference;

    //Mapping
    mapping(address => LastError) public _lastErrors;

    constructor(
        address _owner,
        uint amount,
        string memory _name,
        string memory _symbol,
        address _tokenAddress
    ) EncryptedERC20(_name, _symbol) {
        token = IEncryptedERC20(_tokenAddress);
        owners.creatorTicket = _owner;
        owners.factoryAddr = msg.sender;

        eTaxes.eTaxCreatorTicket = TFHE.asEuint64(1);
        eTaxes.eTaxFactory = TFHE.asEuint64(1);
        eTaxes.eAmountCreatorTicket = TFHE.asEuint64(0);
        eTaxes.eAmountFeesFactory = TFHE.asEuint64(0);
        closestDifference = TFHE.asEuint64(type(uint64).max);

        eWinner = TFHE.asEaddress(address(0));
        eNumberWin = TFHE.asEuint64(0);

        NO_ERROR = TFHE.asEuint8(0);
        ERROR = TFHE.asEuint8(1);
        ZERO = TFHE.asEuint64(0);

        transferOwnership(address(this));
        mint(uint64(amount));
    }

    function start(uint256 _ticketPrice, uint256 _duration, uint256 _limitedTicked) public {
        ticketPrice = _ticketPrice;
        endTime = block.timestamp + _duration;
        limitedTicket = _limitedTicked;
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
