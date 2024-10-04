import { ethers } from "hardhat";

import type { TicketFactory } from "../../types";
import { getSigners } from "../signers";

export async function deployFactoryFixture(): Promise<TicketFactory> {
  const signers = await getSigners();

  const contractFactory = await ethers.getContractFactory("TicketFactory");
  const contract = await contractFactory.connect(signers.alice).deploy();
  await contract.waitForDeployment();

  return contract;
}
