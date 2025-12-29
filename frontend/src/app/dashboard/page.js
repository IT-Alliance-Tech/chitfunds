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
  Snackbar,
  Alert,
} from "@mui/material";

// Icons
import GroupsIcon from "@mui/icons-material/Groups";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { apiRequest } from "@/config/api";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/login";
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===================== NOTIFICATION STATE ====================== */
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await apiRequest("/dashboard/analytics");
      setData(res?.data || null);
    } catch (err) {
      showNotification(
        err.message || "Failed to load dashboard analytics",
        "error"
      );
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
        <Grid
          container
          spacing={2}
          padding="1rem"
          justifyContent={{
            xs: "center",
            md: "flex-start",
          }}
        >
          <StatCard
            icon={<AccountBalanceIcon sx={iconStyle("#0ea5e9")} />}
            label="Total Chits"
            value={data.totalChits}
          />
          <StatCard
            icon={<CheckCircleIcon sx={iconStyle("green")} />}
            label="Active Chits"
            value={data.activeChits}
          />
          <StatCard
            icon={<PendingActionsIcon sx={iconStyle("#ef4444")} />}
            label="Closed Chits"
            value={data.closedChits}
          />
          <StatCard
            icon={<AccountBalanceIcon sx={iconStyle("#0284c7")} />}
            label="Total Chit Amount"
            value={`₹${data.totalChitAmount}`}
          />
          <StatCard
            icon={<GroupsIcon sx={iconStyle("#8b5cf6")} />}
            label="Total Members"
            value={data.totalMembers}
          />
          <StatCard
            icon={<GroupsIcon sx={iconStyle("green")} />}
            label="Active Members"
            value={data.activeMembers}
          />
          <StatCard
            icon={<GroupsIcon sx={iconStyle("#dc2626")} />}
            label="Inactive Members"
            value={data.inactiveMembers}
          />
          <StatCard
            icon={<MonetizationOnIcon sx={iconStyle("#16a34a")} />}
            label="Total Paid"
            value={`₹${data.totalPaid}`}
          />
          <StatCard
            icon={<MonetizationOnIcon sx={iconStyle("#22c55e")} />}
            label="Collected This Month"
            value={`₹${data.collectedThisMonth}`}
          />
          <StatCard
            icon={<PendingActionsIcon sx={iconStyle("#d97706")} />}
            label="Remaining Amount"
            value={`₹${data.remainingTotalChitAmount}`}
          />
          <StatCard
            icon={<CalendarMonthIcon sx={iconStyle("#7c3aed")} />}
            label="Remaining Months"
            value={data.remainingMonths}
          />
        </Grid>

        {/* ================= RECENT ACTIVITIES ================= */}
        <Paper
          elevation={1}
          sx={{
            mt: 3,
            px: { xs: 2, md: 4 },
            py: 3,
            width: "100%",
          }}
        >
          <Typography variant="h6" fontWeight={700} mb={3}>
            Recent Activities
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* 1. RECENT PAYMENTS */}
            <Box>
              <Typography fontWeight={600} mb={2}>
                Recent Payments
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "text.secondary",
                        },
                      }}
                    >
                      <TableCell>Member Name</TableCell>
                      <TableCell>Chit Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.recentPayments || []).map((p, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {p.memberId?.name || "Unknown"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {p.chitId?.chitName || "Unknown"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {p.chitId?.location || "-"}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          ₹{p.paidAmount?.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              p.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {(p.status || "paid").toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {formatDate(p.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data.recentPayments ||
                      data.recentPayments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No recent payments
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Box>

            {/* 2. RECENT MEMBERS */}
            <Box>
              <Typography fontWeight={600} mb={2}>
                Recent Members
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "text.secondary",
                        },
                      }}
                    >
                      <TableCell>Name</TableCell>
                      <TableCell>Chit</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Chit Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date of Joining</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.recentMembers || []).map((m, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {m.name}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {m.chitName}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {m.location}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {m.chitAmount !== "-" ? `₹${m.chitAmount}` : "-"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              m.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {m.status}
                          </span>
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {formatDate(m.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data.recentMembers ||
                      data.recentMembers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No recent members
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Box>

            {/* 3. RECENT CHITS */}
            <Box>
              <Typography fontWeight={600} mb={2}>
                Recent Chits
              </Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "text.secondary",
                        },
                      }}
                    >
                      <TableCell>Chit Name</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Members Limit</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.recentChits || []).map((c, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {c.chitName}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {c.location}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          ₹{c.amount?.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {c.membersLimit}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700`}
                          >
                            {c.status}
                          </span>
                        </TableCell>
                        <TableCell sx={{ fontSize: "13px" }}>
                          {formatDate(c.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data.recentChits || data.recentChits.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No recent chits
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* NOTIFICATION SNACKBAR */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

/* ================= STAT CARD ================= */
function StatCard({ icon, label, value }) {
  return (
    <Grid item xs={12} sm={6} md={3}>
      <Card sx={cardStyle}>
        <CardContent sx={cardContentStyle}>
          <Box sx={iconWrapper}>{icon}</Box>

          <Box sx={textWrapper}>
            <Typography variant="h6" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}

/* ================= STYLES ================= */

const cardStyle = {
  width: 230,
  height: 120,
  minHeight: 120,
  maxHeight: 120,
  borderRadius: 2,
  display: "flex",
  alignItems: "center",
  // justifyContent: "center",
};

const cardContentStyle = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: "12px 16px", // controlled padding
  "&:last-child": {
    paddingBottom: "12px",
  },
};

const iconWrapper = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start", // LEFT on all screens
  width: 45,
};

const textWrapper = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const iconStyle = (color) => ({
  color,
  fontSize: {
    xs: 40,
    md: 45,
  },
});
