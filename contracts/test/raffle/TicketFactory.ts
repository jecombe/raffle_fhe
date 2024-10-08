import { expect } from "chai";
import { ethers } from "hardhat";

import { awaitAllDecryptionResults } from "../asyncDecrypt";
import { deployEncryptedERC20Fixture } from "../encryptedERC20/EncryptedERC20.fixture";
import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployFactoryFixture } from "./TicketFactory.fixture";

describe("TicketFactory", function () {
  let owner;
  let participant1, participant2;

  before(async function () {
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    [owner, participant1, participant2] = await ethers.getSigners();
    this.owner = owner;
    this.participant1 = participant1;
    this.participant2 = participant2;

    const contract = await deployFactoryFixture();
    this.contractAddress = await contract.getAddress();
    this.factory = contract;
    this.instances = await createInstances(this.signers);

    const amount = 10;
    const contractErc = await deployEncryptedERC20Fixture();
    this.contractTokenAddress = await contractErc.getAddress();
    this.erc20 = contractErc;
    const name = "Test Ticket";
    const symbol = "TTKT";

    const tx = await this.factory.createTickets(amount, this.contractTokenAddress, name, symbol);
    await tx.wait();

    const deployedTickets = await this.factory.deployedTickets(0);

    this.ticketContract = await ethers.getContractAt("Ticket", deployedTickets);
    this.ticketAddress = deployedTickets;
  });

  it("should be create a ticket", async function () {
    const amount = 10;
    const tokenAddress = "0x5b0437E348498297823821e86Ab144feB320450e";
    const name = "Test Ticket";
    const symbol = "TTKT";

    const tx = await this.factory.createTickets(amount, tokenAddress, name, symbol);
    await tx.wait();
    const deployedTickets = await this.factory.deployedTickets(0);

    console.log(deployedTickets);
  });

  it("should set ticket parameters with start", async function () {
    const ticketPrice = ethers.parseEther("0.01");
    const duration = 3600; // 1 hour
    const limitedTickets = 100;

    await this.ticketContract.start(ticketPrice, duration, limitedTickets);

    expect(await this.ticketContract.ticketPrice()).to.equal(ticketPrice);
    expect(await this.ticketContract.endTime()).to.be.greaterThan(0);
    expect(await this.ticketContract.limitedTicket()).to.equal(limitedTickets);
  });

  it("should allow buying a ticket", async function () {
    const ticketPrice = ethers.parseEther("0.01");
    const duration = 3600; // 1 heure
    const limitedTickets = 100;

    await this.ticketContract.start(ticketPrice, duration, limitedTickets);

    const transaction = await this.erc20.mint(10000);
    await transaction.wait();

    const input = this.instances.alice.createEncryptedInput(this.ticketAddress, this.signers.alice.address);
    input.addAddress(this.signers.alice.address).add64(1);
    const encryptedTransferAmount = input.encrypt();

    const txToken = await this.erc20["approve(address,bytes32,bytes)"](
      this.ticketAddress,
      encryptedTransferAmount.handles[1],
      encryptedTransferAmount.inputProof,
    );
    await txToken.wait();

    const txTicket = await this.ticketContract["buyTicket(bytes32,bytes32,bytes)"](
      encryptedTransferAmount.handles[0],
      encryptedTransferAmount.handles[1],
      encryptedTransferAmount.inputProof,
    );
    await txTicket.wait();

    const participantsLength = await this.ticketContract.participantsLength();

    expect(participantsLength).to.equal(1);
  });

  it("should fail if the tombola has not started", async function () {
    const input = this.instances.alice.createEncryptedInput(this.ticketAddress, this.signers.alice.address);
    input.addAddress(this.signers.alice.address).add64(1);
    const encryptedTransferAmount = input.encrypt();

    const endTime = await this.ticketContract.endTime();
    expect(endTime).to.equal(0);

    await expect(
      this.ticketContract["buyTicket(bytes32,bytes32,bytes)"](
        encryptedTransferAmount.handles[0],
        encryptedTransferAmount.handles[1],
        encryptedTransferAmount.inputProof,
      ),
    ).to.be.revertedWith("the raffle is not starting");
  });

  it("should fail if raffle has ended", async function () {
    const ticketPrice = ethers.parseEther("0.01");
    const duration = 1; // 1s

    await this.ticketContract.start(ticketPrice, duration, 100);

    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine");

    const input = this.instances.alice.createEncryptedInput(this.ticketAddress, this.signers.alice.address);
    input.addAddress(this.signers.alice.address).add64(1);
    const encryptedTransferAmount = input.encrypt();

    await expect(
      this.ticketContract["buyTicket(bytes32,bytes32,bytes)"](
        encryptedTransferAmount.handles[0],
        encryptedTransferAmount.handles[1],
        encryptedTransferAmount.inputProof,
      ),
    ).to.be.revertedWith("Raffle has ended");
  });

  describe("pickWinner", function () {
    it("should pick a winner, decrypt winner and number win", async function () {
      await this.ticketContract.start(1, 20, 2);

      const transaction = await this.erc20.mint(10000);
      await transaction.wait();

      console.log("user1: ", this.signers.alice.address, "user2:", this.signers.bob.address);

      const input = this.instances.alice.createEncryptedInput(this.ticketAddress, this.signers.alice.address);
      input.addAddress(this.signers.alice.address).add64(1);
      const encryptedTransferAmount = input.encrypt();

      const txToken = await this.erc20["approve(address,bytes32,bytes)"](
        this.ticketAddress,
        encryptedTransferAmount.handles[1],
        encryptedTransferAmount.inputProof,
      );
      await txToken.wait();

      const txTicket = await this.ticketContract["buyTicket(bytes32,bytes32,bytes)"](
        encryptedTransferAmount.handles[0],
        encryptedTransferAmount.handles[1],
        encryptedTransferAmount.inputProof,
      );
      await txTicket.wait();

      const inputBob = this.instances.bob.createEncryptedInput(this.ticketAddress, this.signers.bob.address);
      inputBob.addAddress(this.signers.bob.address).add64(1);
      const encryptedTransferAmountBob = inputBob.encrypt();

      const txTokenBob = await this.erc20["approve(address,bytes32,bytes)"](
        this.ticketAddress,
        encryptedTransferAmountBob.handles[1],
        encryptedTransferAmountBob.inputProof,
      );
      await txTokenBob.wait();

      const txTicketBob = await this.ticketContract["buyTicket(bytes32,bytes32,bytes)"](
        encryptedTransferAmountBob.handles[0],
        encryptedTransferAmountBob.handles[1],
        encryptedTransferAmountBob.inputProof,
      );
      await txTicketBob.wait();

      await new Promise((resolve) => setTimeout(resolve, 20 * 1000));

      const tx = await this.ticketContract.pickWinner();
      await tx.wait();

      await awaitAllDecryptionResults();

      const winnerNumber = await this.ticketContract.numberWinDecrypt();
      const winner = await this.ticketContract.winnerDecrypt();

      expect(winner).to.satisfy((addr: string) => ethers.isAddress(addr), "winnerDecrypt is not a valid address");

      expect(winnerNumber).to.satisfy(
        (num: any) => Number.isInteger(Number(num)),
        "numberWinDecrypt is not a valid integer",
      );
    })


    it("should revert because no praticipant", async function () {
      await this.ticketContract.start(1, 20, 2);

      const transaction = await this.erc20.mint(10000);
      await transaction.wait();

      console.log("user1: ", this.signers.alice.address, "user2:", this.signers.bob.address);

      const input = this.instances.alice.createEncryptedInput(this.ticketAddress, this.signers.alice.address);
      input.addAddress(this.signers.alice.address).add64(1);


      await new Promise((resolve) => setTimeout(resolve, 20 * 1000));

      await expect(this.ticketContract.pickWinner()).to.be.revertedWith("No participants");

    })
  });
});
