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
  Box,
} from "@mui/material";

// Icons
import GroupsIcon from "@mui/icons-material/Groups";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

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
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        Loading dashboard...
      </Typography>
    );
  }

  if (!data) {
    return (
      <Typography align="center" sx={{ mt: 4 }}>
        Failed to load dashboard
      </Typography>
    );
  }

  return (
    <Box className="min-h-screen bg-gray-100">
      <Box component="main" sx={{ px: { xs: 1.5, sm: 3 }, py: 2 }}>

        {/* ================= STATS GRID ================= */}
        <Grid container spacing={1.5}>
          <StatCard icon={<AccountBalanceIcon sx={iconStyle("#0ea5e9")} />} label="Total Chits" value={data.totalChits} />
          <StatCard icon={<CheckCircleIcon sx={iconStyle("green")} />} label="Active Chits" value={data.activeChits} />
          <StatCard icon={<PendingActionsIcon sx={iconStyle("#ef4444")} />} label="Closed Chits" value={data.closedChits} />
          <StatCard icon={<AccountBalanceIcon sx={iconStyle("#0284c7")} />} label="Total Chit Amount" value={`₹${data.totalChitAmount}`} />
          <StatCard icon={<GroupsIcon sx={iconStyle("#8b5cf6")} />} label="Total Members" value={data.totalMembers} />
          <StatCard icon={<GroupsIcon sx={iconStyle("green")} />} label="Active Members" value={data.activeMembers} />
          <StatCard icon={<GroupsIcon sx={iconStyle("#dc2626")} />} label="Inactive Members" value={data.inactiveMembers} />
          <StatCard icon={<MonetizationOnIcon sx={iconStyle("#16a34a")} />} label="Total Paid" value={`₹${data.totalPaid}`} />
          <StatCard icon={<MonetizationOnIcon sx={iconStyle("#22c55e")} />} label="Collected This Month" value={`₹${data.collectedThisMonth}`} />
          <StatCard icon={<PendingActionsIcon sx={iconStyle("#d97706")} />} label="Remaining Amount" value={`₹${data.remainingTotalChitAmount}`} />
          <StatCard icon={<CalendarMonthIcon sx={iconStyle("#7c3aed")} />} label="Remaining Months" value={data.remainingMonths} />
        </Grid>

        {/* ================= RECENT ACTIVITIES ================= */}
        <Paper elevation={1} sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" fontWeight={700} mb={1}>
            Recent Activities
          </Typography>

          {/* TABLE SCROLL */}
          <Box sx={{ maxHeight: 280, overflowX: "auto", overflowY: "auto" }}>
            <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data.recentActivities.map((a, index) => (
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
          </Box>
        </Paper>

      </Box>
    </Box>
  );
}

/* ================= STAT CARD ================= */

function StatCard({ icon, label, value }) {
  return (
    <Grid item xs={6} sm={4} md={3} lg={3}>
      <Card sx={cardStyle}>
        <CardContent sx={cardContentStyle}>
          {icon}
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {value}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}

/* ================= STYLES ================= */

const cardStyle = {
  width: "100%",
  height: 110,
  display: "flex",
  alignItems: "center",
};

const cardContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
};

const iconStyle = (color) => ({
  fontSize: 32,
  color,
});
