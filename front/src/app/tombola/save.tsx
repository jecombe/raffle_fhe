"use client";

import { useState, useEffect } from "react";
import { BrowserProvider, ethers } from "ethers";
import { useFhevm } from "../Contexts/useFhevm";
import styles from "../../styles/Mint.module.css";
import abiToken from "../../../abi/EncryptedERC20.json";

const Mint: React.FC = () => {
  const [number, setNumber] = useState<number | null>(null);
  const [data, setData] = useState<string>("???");
  const [mintLoading, setMintLoading] = useState<boolean>(false);
  const [decryptLoading, setDecryptLoading] = useState<boolean>(false);
  const [account, setAccount] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const { instance, createInstance } = useFhevm();
  const contractAddress = "0x5b0437E348498297823821e86Ab144feB320450e";

  useEffect(() => {
    if (instance) {
      console.log("FHEVM instance initialized:", instance);
    } else {
      console.log("Instance is still null, initializing...");
      createInstance();
    }
  }, [instance, createInstance]);

  const checkNetwork = async () => {
    if (typeof window.ethereum !== "undefined") {
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      setNetwork(currentChainId);
      return currentChainId === "0x2328"; // Check if on Zama Devnet
    }
    return false;
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      await checkNetwork();
    } else {
      console.error("MetaMask is not connected");
    }
  };

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const inputNumber = formData.get("numberInput");
    if (inputNumber) {
      setNumber(Number(inputNumber));
      setMintLoading(true);
      try {
        if (typeof window.ethereum !== "undefined") {
          const provider = new BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contract = new ethers.Contract(contractAddress, abiToken, signer);
          const tx = await contract.mint(Number(inputNumber));
          await tx.wait();
          console.log("Minting successful:", tx);
        } else {
          console.error("MetaMask is not connected");
        }
      } catch (error) {
        console.error("Error minting token:", error);
      } finally {
        setMintLoading(false);
      }
    }
  };

  const handleDecrypt = async () => {
    if (!instance) {
      console.error("FHEVM instance not initialized");
      return;
    }

    setDecryptLoading(true);
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const { publicKey, privateKey } = instance.generateKeypair();
        const eip712 = instance.createEIP712(publicKey, contractAddress);
        const params = [signer.address, JSON.stringify(eip712)];
        const signature = await window.ethereum.request({
          method: "eth_signTypedData_v4",
          params,
        });
        const contract = new ethers.Contract(contractAddress, abiToken, signer);
        const encryptedBalance = await contract.balanceOf(signer.address);
        console.log(encryptedBalance);
        const userBalance = await instance.reencrypt(
          encryptedBalance,
          privateKey,
          publicKey,
          signature,
          contractAddress,
          signer.address
        );
        setData(userBalance.toString());
      } else {
        console.error("MetaMask is not connected");
      }
    } catch (error) {
      console.error("Error decrypting balance:", error);
    } finally {
      setDecryptLoading(false);
    }
  };

  return (
    <div className={styles.gridContainer}>
      <div className={styles.leftGrid}>
        <h2>Mint</h2>
        {account ? (
          <form onSubmit={handleMint} className={styles.form}>
            <label htmlFor="numberInput">Enter mint number token</label>
            <input type="number" id="numberInput" name="numberInput" required />
            <button
              type="submit"
              className={styles.formButton}
              disabled={mintLoading}
            >
              {mintLoading ? "Minting..." : "Mint"}
            </button>
          </form>
        ) : (
          <button onClick={connectMetaMask} className={styles.formButton}>
            Connect MetaMask
          </button>
        )}
      </div>

      <div className={styles.rightGrid}>
        <h2>Decrypt balance</h2>
        <div className={styles.numberDisplay}>
          {number !== null ? number : "No number yet"}
        </div>
        {account ? (
          <>
            <button
              onClick={handleDecrypt}
              className={styles.decryptButton}
              disabled={decryptLoading}
            >
              {decryptLoading ? "Decrypting..." : "Decrypt"}
            </button>
            <div className={styles.dataDisplay}>{data}</div>
          </>
        ) : (
          <button onClick={connectMetaMask} className={styles.decryptButton}>
            Connect MetaMask
          </button>
        )}
      </div>
    </div>
  );
};

export default Mint;
