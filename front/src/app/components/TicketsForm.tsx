import { useState } from "react";
import { BrowserProvider, ethers, parseEther, parseUnits } from "ethers";
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import styles from "../../styles/Tombola.module.css";
import abi from "../../../abi/TicketFactory.json";

interface CreateTicketProps {
  onTicketCreated: (address: string, reward: number) => void;
}

const TicketForm: React.FC<CreateTicketProps> = ({ onTicketCreated }) => {
  const [formData, setFormData] = useState({
    symbol: "",
    amount: "",
    price: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        `${process.env.NEXT_PUBLIC_FACTORY_TICKET}`,
        abi,
        signer
      );

      contract.on(
        "TicketCreated",
        async (ticketAddress: string, owner: string) => {
          console.log(ticketAddress);
        }
      );
      const amount = parseUnits("1000", 18);

      const tx = await contract.createTickets(
        parseUnits(formData.amount, 18),
        `${process.env.NEXT_PUBLIC_TOKEN}`,
        "TicketTest",
        "TETEST"
      );

      await tx.wait();
      const deployedTicketsCount = await contract.getDeployedTicketsCount();

      console.log(`Total deployed tickets: ${deployedTicketsCount}`);

      const ticket = await contract.deployedTickets(
        deployedTicketsCount - BigInt(1)
      );
      onTicketCreated(ticket, parseFloat(formData.price)); // Use relevant data
    } catch (error) {
      console.error("Error creating tickets:", error);
      setError("Failed to create tickets.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className={styles.formBox}>
      <form onSubmit={handleSubmit}>
        <TextField
          name="amount"
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          required
          className={styles.formField}
        />
        <TextField
          name="price"
          label="Price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          required
          className={styles.formField}
        />
        <TextField
          name="address"
          label="Address"
          value={formData.address}
          onChange={handleChange}
          required
          className={styles.formField}
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Create"}
        </Button>
        {error && <Typography color="error">{error}</Typography>}
      </form>
    </Box>
  );
};

export default TicketForm;
