"use client";

import { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

// Icons
import GroupsIcon from "@mui/icons-material/Groups";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

import { apiRequest } from "@/config/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await apiRequest("/dashboard/analytics");
setData(res?.data || null);
    } catch (err) {
      console.error("Failed to fetch dashboard analytics", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Typography align="center" sx={{ mt: 6 }}>
        Loading dashboard...
      </Typography>
    );
  }

  if (!data) {
    return (
      <Typography align="center" sx={{ mt: 6 }}>
        Failed to load dashboard
      </Typography>
    );
  }

  const { chits, members, payments, recentActivities } = data;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1">
        <main className="p-6">

          {/* ================= STATS CARDS ================= */}
          <Grid container spacing={2} justifyContent="center">

            {/* Total Chits */}
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={cardContentStyle}>
                  <AccountBalanceIcon sx={{ fontSize: 36, color: "#0ea5e9" }} />
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Chits
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {chits.totalChits}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Members */}
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={cardContentStyle}>
                  <GroupsIcon sx={{ fontSize: 36, color: "#8b5cf6" }} />
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Members
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {members.totalMembers}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Chits */}
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={cardContentStyle}>
                  <CheckCircleIcon sx={{ fontSize: 36, color: "green" }} />
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">
                      Active Chits
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {chits.activeChits}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Amount Collected */}
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={cardContentStyle}>
                  <MonetizationOnIcon sx={{ fontSize: 36, color: "#16a34a" }} />
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">
                      Amount Collected
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{payments.totalPaid}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Remaining Amount */}
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={cardStyle}>
                <CardContent sx={cardContentStyle}>
                  <PendingActionsIcon sx={{ fontSize: 36, color: "#d97706" }} />
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">
                      Remaining Amount
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{payments.remainingTotalChitAmount}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

          </Grid>

          {/* ================= RECENT ACTIVITIES ================= */}
          <Paper elevation={2} className="mt-10 p-4">
            <Typography variant="h6" fontWeight="600" className="mb-4">
              Recent Activities
            </Typography>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recentActivities.map((a, index) => (
                  <TableRow key={index}>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>{a.action}</TableCell>
                    <TableCell>
                      {a.title || (a.amount ? `₹${a.amount}` : "-")}
                    </TableCell>
                    <TableCell>
                      {new Date(a.date).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

        </main>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const cardStyle = {
  width: 260,
  height: 110,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
};
