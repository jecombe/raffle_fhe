// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";
import "fhevm/gateway/GatewayCaller.sol";
import "./interfaces/IEncryptedERC20.sol";

import "./encryptedErc20/EncryptedERC20.sol";

contract Ticket is GatewayCaller, EncryptedERC20 {
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

    IEncryptedERC20 public token;
    uint256 public endTime = 0;

    Taxes private eTaxes;
    Owners public owners;

    eaddress private eWinner;
    address public winnerDecrypt;

    euint64 public eNumberWin;
    uint64 public numberWinDecrypt;

    uint256 public ticketPrice = 0 ether;
    uint public limitedTicket = 0;
    uint64 public participantsLength = 0;

    //Encrypted Errors management variable
    euint8 internal NO_ERROR;
    euint8 internal ERROR;
    euint64 internal ZERO;

    euint64 closestDifference;
    euint64 eAmountWinner;

    bool isFinish = false;

    //Mapping
    mapping(address => LastError) public _lastErrors;
    mapping(uint64 => Participant) participants;

    //Events
    event TicketPurchased(address indexed participant);
    event WinnerPicked(uint);
    event ErrorChanged(address indexed user);

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
        eAmountWinner = TFHE.asEuint64(0);

        NO_ERROR = TFHE.asEuint8(0);
        ERROR = TFHE.asEuint8(1);
        ZERO = TFHE.asEuint64(0);

        transferOwnership(address(this));
        mint(uint64(amount));

        TFHE.allow(ZERO, address(this));
        TFHE.allow(eNumberWin, address(this));
        TFHE.allow(eWinner, address(this));
        TFHE.allow(NO_ERROR, address(this));
        TFHE.allow(ERROR, address(this));
        TFHE.allow(eTaxes.eTaxFactory, address(this));
        TFHE.allow(eTaxes.eTaxCreatorTicket, address(this));
        TFHE.allow(eTaxes.eAmountCreatorTicket, address(this));
        TFHE.allow(eTaxes.eAmountFeesFactory, address(this));
        TFHE.allow(closestDifference, address(this));
    }

    modifier onlyWinner() {
        require(msg.sender == owners.factoryAddr, "Caller is not the winner");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == owners.factoryAddr, "Caller is not the factory");
        _;
    }

    modifier onlyCreatorTickets() {
        require(msg.sender == owners.creatorTicket, "Caller is not the creator of tickets");
        _;
    }

    function requestAddress() public {
        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(eWinner);
        Gateway.requestDecryption(cts, this.addressWinCallback.selector, 0, block.timestamp + 100, false);
    }

    function requestNumberWin() internal {
        uint256[] memory cts = new uint256[](1);
        cts[0] = Gateway.toUint256(eNumberWin);
        Gateway.requestDecryption(cts, this.numberWinCallback.selector, 0, block.timestamp + 100, false);
    }

    function numberWinCallback(uint256 /*requestID*/, uint64 decryptedInput) public onlyGateway returns (uint64) {
        numberWinDecrypt = decryptedInput;
        return decryptedInput;
    }

    function addressWinCallback(uint256 /*requestID*/, address decryptedInput) public onlyGateway returns (address) {
        winnerDecrypt = decryptedInput;
        return decryptedInput;
    }

    function start(uint256 _ticketPrice, uint256 _duration, uint256 _limitedTicked) public {
        ticketPrice = _ticketPrice;
        endTime = block.timestamp + _duration;
        limitedTicket = _limitedTicked;
    }

    function buyTicket(einput _eUser, einput _eAmount, bytes calldata inputProof) external {
        require(endTime > 0, "the raffle is not starting");

        require(block.timestamp <= endTime, "Raffle has ended");

        euint64 eAmount = TFHE.asEuint64(_eAmount, inputProof);
        TFHE.allow(eAmount, address(this));

        eaddress eUser = TFHE.asEaddress(_eUser, inputProof);
        TFHE.allow(eUser, address(this));

        euint64 randomNumber = TFHE.randEuint64();

        TFHE.allow(randomNumber, address(this));
        TFHE.allow(randomNumber, msg.sender);

        participants[participantsLength] = Participant(eUser, randomNumber);

        require(
            token.transferFrom(msg.sender, address(this), _eAmount, inputProof),
            "echec transferFrom deposit erc20 to smart contract"
        );

        participantsLength += 1;

        emit TicketPurchased(msg.sender);
    }

    function claimTokensWinner() external onlyWinner {
        require(isFinish, "Tombola is over");

        require(winnerDecrypt == msg.sender, "Not authorized");

        ebool eIsNotZero = TFHE.gt(eAmountWinner, ZERO);

        require(transfer(msg.sender, TFHE.select(eIsNotZero, eAmountWinner, ZERO)), "Token transfer failed");
    }

    function claimTokensCreator() external onlyCreatorTickets {
        require(isFinish, "Tombola is over");

        require(owners.creatorTicket == msg.sender, "Not authorized");

        ebool eIsNotZero = TFHE.gt(eTaxes.eAmountCreatorTicket, ZERO);

        require(
            transfer(msg.sender, TFHE.select(eIsNotZero, eTaxes.eAmountCreatorTicket, ZERO)),
            "Token transfer failed"
        );
    }

    function claimTokensFactory() external onlyFactory {
        require(isFinish, "Tombola is over");

        require(owners.factoryAddr == msg.sender, "Not authorized");

        ebool eIsNotZero = TFHE.gt(eTaxes.eAmountFeesFactory, ZERO);

        require(
            transfer(msg.sender, TFHE.select(eIsNotZero, eTaxes.eAmountFeesFactory, ZERO)),
            "Token transfer failed"
        );
    }

    function distributeProfits() internal {
        euint64 totalAmount = token.balanceOf(address(this));
        TFHE.allow(totalAmount, address(this));

        //TFHE.allowTransient(totalAmount, address(this));

        euint64 tempCreator = TFHE.div(TFHE.mul(totalAmount, eTaxes.eTaxFactory), 100);
        eTaxes.eAmountCreatorTicket = TFHE.select(TFHE.gt(tempCreator, ZERO), tempCreator, ZERO);

        euint64 tempFactory = TFHE.div(TFHE.mul(totalAmount, eTaxes.eTaxFactory), 100);
        eTaxes.eAmountFeesFactory = TFHE.select(TFHE.gt(tempFactory, ZERO), tempFactory, ZERO);

        euint64 tempWinner = TFHE.div(TFHE.mul(totalAmount, eTaxes.eTaxFactory), 100);

        eAmountWinner = TFHE.select(
            TFHE.gt(tempWinner, ZERO),
            TFHE.sub(totalAmount, TFHE.add(eTaxes.eAmountCreatorTicket, eTaxes.eAmountFeesFactory)),
            ZERO
        );
    }

    function pickWinner() external {
        require(!isFinish, "Tombola is over");
        require(block.timestamp >= endTime, "Tombola is still ongoing");
        require(participantsLength > 0, "No participants");

        euint64 randomNumber = TFHE.randEuint64();

        for (uint32 i = 0; i < participantsLength; i++) {
            euint64 difference = TFHE.select(
                TFHE.gt(participants[i].eNumberRandom, randomNumber),
                TFHE.sub(randomNumber, participants[i].eNumberRandom),
                TFHE.sub(participants[i].eNumberRandom, randomNumber)
            );
            ebool isSmaller = TFHE.gt(difference, closestDifference);

           eWinner = TFHE.select(isSmaller, participants[i].eAddress, eWinner);
        }
        requestAddress();
        requestNumberWin();
        distributeProfits();
        isFinish = true;

        emit WinnerPicked(block.timestamp);
    }
}
