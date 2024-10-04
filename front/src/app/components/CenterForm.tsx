// components/CenteredForm.tsx
"use client";

import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import styles from '../../styles/Tombola.module.css';

interface CenteredFormProps {
  entries: { address: string; reward: number }[];
}

const CenterForm: React.FC<CenteredFormProps> = ({ entries }) => {
  return (
    <Box className={styles.centeredFormBox}>
      <Typography variant="h6" gutterBottom>
        My Tombola stats
      </Typography>

      {/* Table for Address and Reward */}
      <TableContainer component={Paper} style={{ marginTop: "20px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Address</TableCell>
              <TableCell>Reward</TableCell>
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
  );
};

export default CenterForm;
