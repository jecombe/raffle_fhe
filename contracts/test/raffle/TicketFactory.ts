import { expect } from "chai";
import { ethers } from "hardhat";

import { createInstances } from "../instance";
import { getSigners, initSigners } from "../signers";
import { deployFactoryFixture } from "./TicketFactory.fixture";

describe("TicketFactory", function () {
  before(async function () {
    await initSigners();
    this.signers = await getSigners();
  });

  beforeEach(async function () {
    const contract = await deployFactoryFixture();
    this.contractAddress = await contract.getAddress();
    this.factory = contract;
    this.instances = await createInstances(this.signers);

    const amount = 10;
    const tokenAddress = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
    const name = "Test Ticket";
    const symbol = "TTKT";
    const tx = await this.factory.createTickets(amount, tokenAddress, name, symbol);
    await tx.wait();

    const deployedTickets = await this.factory.deployedTickets(0);
    this.ticketContract = await ethers.getContractAt("Ticket", deployedTickets);
  });

  it("should be create a ticket", async function () {
    const amount = 10;
    const tokenAddress = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
    const name = "Test Ticket";
    const symbol = "TTKT";

    const tx = await this.factory.createTickets(amount, tokenAddress, name, symbol);
    await tx.wait();
    const deployedTickets = await this.factory.deployedTickets(0);

    console.log(deployedTickets);
  });

  it("should set ticket parameters with start", async function () {
    const ticketPrice = ethers.parseEther("0.1");
    const duration = 3600; // 1 hour
    const limitedTickets = 100;

    await this.ticketContract.start(ticketPrice, duration, limitedTickets);

    expect(await this.ticketContract.ticketPrice()).to.equal(ticketPrice);
    expect(await this.ticketContract.endTime()).to.be.greaterThan(0);
    expect(await this.ticketContract.limitedTicket()).to.equal(limitedTickets);
  });
});
