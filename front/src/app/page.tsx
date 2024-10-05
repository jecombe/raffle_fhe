"use client";
import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Container, Typography, Box } from "@mui/material"; 
import styles from "./page.module.css";

const Page: React.FC = () => {
  const [error, setError] = useState("");


  return (
    <div className={styles.container}>
      <Typography
        variant="h2"
        component="h1"
        gutterBottom
        className={styles.title}
      >
        Decentralized Raffle
      </Typography>

      <Typography variant="h6" paragraph className={styles.description}>
        Welcome to our decentralized raffle, the first of its kind powered by advanced encryption technology called FHE (Fully Homomorphic Encryption). Using FHE, we ensure a fully random and secure number generation directly on the blockchain.
      </Typography>

      <Typography variant="h6" paragraph className={styles.description}>
        How does it work? Each participant receives a random ticket number, encrypted and generated directly on the blockchain. This ensures that no one, not even the raffle creators, can interfere with the outcome. The winning numbers are revealed in a fully transparent manner, but remain encrypted until the end of the draw.
      </Typography>

      <Typography variant="h6" paragraph className={styles.description}>
        By participating in this raffle, you are supporting decentralized blockchain technology while ensuring fairness and security, free from human intervention.
      </Typography>

      <Box mt={4}>
        <button className={styles.connectButton}>
          Connect MetaMask
        </button>
      </Box>
    </div>
  );
};

export default Page;
