"use client";
import { useState } from "react";
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import styles from "../../styles/Tombola.module.css";
import Link from "next/link";
import CenterForm from "../components/CenterForm";
import TicketForm from "../components/TicketsForm";
import TombolaStart from "../components/TicketStart";

const Tombola: React.FC = () => {
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    amount: "",
    price: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<{ address: string; reward: number }[]>(
    []
  );
  const [tombolaStarted, setTombolaStarted] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);

  return (
    <Container maxWidth="md" className={styles.container}>
      <Box className={styles.notification}>
        <Typography variant="body1" color="inherit">
          Please ensure you have WZAMA available. You can acquire it from the
          <Link href="/mint" className={styles.link}>
            {" "}
            mint page
          </Link>
          .
        </Typography>
      </Box>

      <CenterForm entries={entries} />

      <Grid container spacing={3} style={{ marginTop: "20px" }}>
        <Grid item xs={6}>
          <TicketForm
            onTicketCreated={(address, reward) => {
              const newEntry = { address, reward };
              setEntries([...entries, newEntry]);
              setTicketCreated(true);
            }}
          />
        </Grid>

        <Grid item xs={6}>
          <TombolaStart
            entries={entries}
            onTombolaStarted={() => setTombolaStarted(true)}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} style={{ marginTop: "20px" }}>
        <Grid item xs={6}>
          <Box className={styles.rightBox}>
            <Typography variant="h6">Buy Tickets</Typography>

            <TableContainer component={Paper} style={{ marginTop: "20px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell>Price Ticket</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.address}</TableCell>
                      <TableCell>{formData.price}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            console.log(
                              `Buying ticket for ${entry.address} at price ${formData.price}`
                            )
                          }
                        >
                          Buy Ticket
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>

        <Grid item xs={6}>
          <Box className={styles.rightBox}>
            <Typography variant="h6" align="center">
              Pick a Winner
            </Typography>

            <TableContainer component={Paper} style={{ marginTop: "20px" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell>Winner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.address}</TableCell>
                      <TableCell>{entry.reward}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Tombola;
