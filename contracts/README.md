# Tombola Project

## Description

This project is a study case aimed at practicing blockchain development on Zama. It is a decentralized raffle where
users can purchase tickets to participate and have a chance to win rewards.

## Before testing contracts

you need to create a .env file. You can inspirate with file .env.exemple

## Installation

1. **Clone the repository:**

   ```bash
   git clone <REPO_URL>
   cd <REPO_NAME>
   ```

2. **install dep:**

 ```bash
 npm i
 ```

## Deploy on Zama network

```bash
npx hardhat deploy --network zama
```

## Run test

```bash
npx hardhat test --network hardhat
```
The tests are located in the test folder. The raffle folder contains the tests for the raffle smart contract.