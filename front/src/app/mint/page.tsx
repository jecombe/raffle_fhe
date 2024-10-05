"use client";

import { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import { useFhevm } from "../Contexts/useFhevm";
import abiToken from "../../../abi/EncryptedERC20.json";
import {
  Container,
  Grid,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const Mint: React.FC = () => {
  const { instance, createInstance } = useFhevm();
  const [balances, setBalances] = useState<{ [address: string]: string }>({});
  const [loading, setLoading] = useState<{ [address: string]: boolean }>({});
  const [mintLoading, setMintLoading] = useState<{ [address: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!instance) {
      /* createInstance()
        .then(() => setIsLoading(false))
        .catch((e) => {
          setError("Failed to initialize the Fhevm instance.");
          setIsLoading(false);
          console.error(e);
        });*/
    } else {
      setIsLoading(false);
    }
  }, [instance, createInstance]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
  // List of tokens with their contract addresses
  const tokens = [
    { symbol: "WZAMA", address: "0x5b0437E348498297823821e86Ab144feB320450e" },
  ];


  const handleMint = async (inputNumber: number, tokenAddress: string) => {
    setMintLoading((prev) => ({ ...prev, [tokenAddress]: true }));
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(tokenAddress, abiToken, signer);
        const tx = await contract.mint(inputNumber);
        await tx.wait();
        console.log(`Minting successful for token ${tokenAddress}:`, tx);
      } else {
        console.error("MetaMask is not connected");
      }
    } catch (error) {
      console.error(`Error minting token ${tokenAddress}:`, error);
    } finally {
      setMintLoading((prev) => ({ ...prev, [tokenAddress]: false }));
    }
  };

  const handleDecrypt = async (tokenAddress: string) => {
    if (!instance) {
      console.error("FHEVM instance not initialized");
      return;
    }

    setLoading((prev) => ({ ...prev, [tokenAddress]: true }));
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const { publicKey, privateKey } = instance.generateKeypair();
        const eip712 = instance.createEIP712(publicKey, tokenAddress);
        const params = [signer.address, JSON.stringify(eip712)];
        const signature = await window.ethereum.request({
          method: "eth_signTypedData_v4",
          params,
        });
        const contract = new ethers.Contract(tokenAddress, abiToken, signer);
        const encryptedBalance = await contract.balanceOf(signer.address);
        const userBalance = await instance.reencrypt(
          encryptedBalance,
          privateKey,
          publicKey,
          signature,
          tokenAddress,
          signer.address
        );

        // Store decrypted balance for this token
        setBalances((prev) => ({
          ...prev,
          [tokenAddress]: userBalance.toString(),
        }));
      } else {
        console.error("MetaMask is not connected");
      }
    } catch (error) {
      console.error(`Error decrypting balance for token ${tokenAddress}:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [tokenAddress]: false }));
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Asset & Mint Information
      </Typography>

      <Grid container spacing={4}>
        {/* Dynamic Asset Information Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="h6">Asset</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6">Balance</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6">Mint</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.address}>
                    <TableCell>{token.symbol}</TableCell>
                    <TableCell>
                      {balances[token.address] ? (
                        <> {balances[token.address]} </>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleDecrypt(token.address)}
                          disabled={loading[token.address]}
                        >
                          {loading[token.address] ? (
                            <CircularProgress size={24} />
                          ) : (
                            "Decrypt"
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget as HTMLFormElement);
                          const mintNumber = formData.get("mintNumber") as string;
                          handleMint(Number(mintNumber), token.address);
                        }}
                      >
                        <TextField
                          label="Amount"
                          type="number"
                          name="mintNumber"
                          variant="outlined"
                          size="small"
                          margin="dense"
                          required
                        />
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={mintLoading[token.address]}
                          size="small"
                          sx={{ ml: 2 }}
                        >
                          {mintLoading[token.address] ? <CircularProgress size={24} /> : "Mint"}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Mint;
