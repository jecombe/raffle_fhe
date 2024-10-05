import { useState } from "react";
import { Box, Button, Grid, TextField, Typography, CircularProgress } from "@mui/material";
import { BrowserProvider, ethers, parseUnits } from "ethers";
import abi from "../../../abi/TicketFactory.json";
import styles from "../../styles/Tombola.module.css";

interface Entry {
  address: string;
  reward: number;
}

interface TombolaStartProps {
  entries: Entry[];
  onTombolaStarted: () => void;
}

const TombolaStart: React.FC<TombolaStartProps> = ({ entries, onTombolaStarted }) => {
  const [formData, setFormData] = useState({
    ticketPrice: "",
    duration: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
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
        process.env.NEXT_PUBLIC_FACTORY_TICKET!,
        abi,
        signer
      );

      const ticketPrice = parseUnits(formData.ticketPrice, 18);
      const duration = formData.duration;

      if (entries.length === 0) {
        throw new Error("No entries available to start the tombola.");
      }

      const tx = await contract.start(ticketPrice, duration, entries.length);
      await tx.wait();

      setFormData({ ticketPrice: "", duration: "" });
      onTombolaStarted();
    } catch (error) {
      console.error("Error starting tombola:", error);
      setError("Failed to start tombola.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className={styles.rightBox}>
      <Typography variant="h6" align="center">
        Start Tombola
      </Typography>
      {entries.length > 0 ? (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="ticketPrice"
              label="Ticket Price (ETH)"
              type="number"
              value={formData.ticketPrice}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="duration"
              label="Duration (seconds)"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Typography color="error">{error}</Typography>
            </Grid>
          )}
          <Grid item xs={12} className={styles.centerButton}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : "Start Tombola"}
            </Button>
          </Grid>
        </Grid>
      ) : (
        <Typography variant="body1" align="center" color="textSecondary">
          Please create tickets before starting the tombola.
        </Typography>
      )}
    </Box>
  );
};

export default TombolaStart;
