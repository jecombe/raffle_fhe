import { useState } from "react";
import { BrowserProvider, ethers, parseEther, parseUnits } from "ethers";
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import styles from '../../styles/Tombola.module.css'; // Importer le CSS module
import abi from "../../../abi/TicketFactory.json"
interface CreateTicketProps {
  onTicketCreated: (address: string, reward: number) => void;
}

const TicketForm: React.FC<CreateTicketProps> = ({ onTicketCreated }) => {
  const [formData, setFormData] = useState({
    symbol:"",
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

      const contractAddress = "0xfbB4636CFc0A2A0eA14c13994c0240FEc891C6Dd";
    
      const contract = new ethers.Contract(contractAddress, abi, signer);


      const amount = parseUnits("1000", 18);

      const tx = await contract.createTickets(
        parseUnits(formData.amount, 18),
        "0x5b0437E348498297823821e86Ab144feB320450e",
        "TicketTest",
        "TETEST"
      );
    
      await tx.wait();

      const newReward = Number(formData.amount) * Number(formData.price);
      onTicketCreated(formData.address, newReward);

      setFormData({ amount: "", price: "", address: "", symbol: "" });
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
        <Button variant="contained" color="primary" type="submit" disabled={isLoading}>
          {isLoading ? <CircularProgress size={24} /> : "Create"}
        </Button>
        {error && <Typography color="error">{error}</Typography>}
      </form>
    </Box>
  );
};

export default TicketForm;
