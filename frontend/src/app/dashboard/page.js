"use client";

import React, { useEffect, useState } from "react";
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
  IconButton,
  CircularProgress,
} from "@mui/material";

// Icons
import GroupsIcon from "@mui/icons-material/Groups";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DownloadIcon from "@mui/icons-material/Download";

import { apiRequest, BASE_URL } from "@/config/api";

import { useMediaQuery } from "@mui/material";

/* ================= HELPERS ================= */
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getStatusColor = (status) => {
  const s = status?.toLowerCase();
  if (["active", "paid", "upcoming"].includes(s))
    return { bg: "#dcfce7", text: "#166534" }; // Green
  if (["inactive", "overdue", "closed", "completed"].includes(s))
    return { bg: "#fee2e2", text: "#991b1b" }; // Red
  if (["partial", "pending"].includes(s))
    return { bg: "#fef3c7", text: "#92400e" }; // Orange/Amber
  return { bg: "#f1f5f9", text: "#475569" }; // Default Gray
};

/* ================= MAIN DASHBOARD COMPONENT ================= */
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width:640px)");

  // Notification State
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await apiRequest("/dashboard/analytics");
        setData(res?.data || null);
      } catch (err) {
        showNotification(err.message || "Failed to load dashboard", "error");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const [downloading, setDownloading] = useState(null);

  const handleDownloadReport = async (type) => {
    setDownloading(type);
    try {
      let endpoint = "";
      let filename = "";

      switch (type) {
        case "Total Chits":
          endpoint = "/reports/chits";
          filename = "chits-report.xlsx";
          break;
        case "Total Members":
          endpoint = "/reports/members";
          filename = "members-report.xlsx";
          break;
        case "Total Paid":
          endpoint = "/reports/payments";
          filename = "payments-history-report.xlsx";
          break;
        case "Collected This Month":
          endpoint = "/reports/monthly-collections";
          filename = "monthly-collections-report.xlsx";
          break;
        default:
          return;
      }

      // We use fetch directly for blob handling because apiRequest might be set to JSON
      const token = localStorage.getItem("token");
      const baseUrl = BASE_URL;

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification(`${type} report downloaded successfully`);
    } catch (err) {
      console.error("Download error:", err);
      showNotification(`Failed to download ${type} report`, "error");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}>Loading...</Box>;
  if (!data)
    return <Box sx={{ p: 4, textAlign: "center" }}>Failed to load data.</Box>;

  /* ================= STYLE OVERRIDES ================= */
  const tableHeaderSx = {
    backgroundColor: "#e2e8f0", // Brighter header
    "& th": {
      fontWeight: 700,
      fontSize: "12px",
      color: "#1e293b",
      textTransform: "uppercase",
      py: 1.5,
      borderBottom: "1px solid #cbd5e1",
    },
  };

  const StatusPill = ({ status }) => {
    const { bg, text } = getStatusColor(status);
    return (
      <Box
        sx={{
          display: "inline-block",
          px: 1.5,
          py: 0.5,
          borderRadius: "12px",
          backgroundColor: bg,
          color: text,
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          textAlign: "center",
          minWidth: "70px",
        }}
      >
        {status}
      </Box>
    );
  };

  /* ================= RENDERERS ================= */
  const renderPaymentTable = () => (
    <Box
      className="table-container-mobile"
      sx={{
        overflowX: "auto",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={tableHeaderSx}>
            <TableCell>Member</TableCell>
            <TableCell>Chit</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="right">Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data.recentPayments || []).map((p, i) => (
            <TableRow
              key={i}
              sx={{
                "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                "&:hover": { backgroundColor: "#f1f5f9" },
              }}
            >
              <TableCell sx={{ fontWeight: 600 }}>
                {p.memberId?.name || "-"}
              </TableCell>
              <TableCell>{p.chitId?.chitName || "-"}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                ₹{p.paidAmount?.toLocaleString("en-IN")}
              </TableCell>
              <TableCell align="center">
                <StatusPill status={p.status} />
              </TableCell>
              <TableCell align="right" sx={{ color: "#64748b" }}>
                {formatDate(p.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );

  const renderMobilePaymentCards = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {(data.recentPayments || []).map((p, i) => (
        <Card
          key={i}
          sx={{
            border: "1px solid #e2e8f0",
            boxShadow: "none",
            borderRadius: "12px",
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: "15px" }}>
                {p.memberId?.name || "Member"}
              </Typography>
              <StatusPill status={p.status} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  pb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Chit
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {p.chitId?.chitName || "-"}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                  pb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Amount
                </Typography>
                <Typography
                  sx={{ fontWeight: 700, fontSize: "14px", color: "#1e293b" }}
                >
                  ₹{p.paidAmount?.toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="caption">
                  {formatDate(p.createdAt)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const statItems = [
    {
      label: "Total Chits",
      value: data.totalChits,
      icon: <AccountBalanceIcon />,
      color: "#3b82f6",
      canDownload: true,
    },
    {
      label: "Active Chits",
      value: data.activeChits,
      icon: <CheckCircleIcon />,
      color: "#10b981",
      isCircle: true,
    },
    {
      label: "Closed Chits",
      value: data.closedChits,
      icon: <PendingActionsIcon />,
      color: "#f43f5e",
    },
    /* {
      label: "Total Chit Amount",
      value: `₹${data.totalChitAmount.toLocaleString("en-IN")}`,
      icon: <AccountBalanceIcon />,
      color: "#0284c7",
    }, */
    {
      label: "Total Members",
      value: data.totalMembers,
      icon: <GroupsIcon />,
      color: "#8b5cf6",
      canDownload: true,
    },
    {
      label: "Active Members",
      value: data.activeMembers,
      icon: <GroupsIcon />,
      color: "#10b981",
    },
    {
      label: "Inactive Members",
      value: data.inactiveMembers,
      icon: <GroupsIcon />,
      color: "#ef4444",
    },
    /* {
      label: "Total Paid",
      value: `₹${data.totalPaid.toLocaleString("en-IN")}`,
      icon: <MonetizationOnIcon />,
      color: "#16a34a",
      isCircle: true,
      canDownload: true,
    }, */
    {
      label: "Collected This Month",
      value: `₹${data.collectedThisMonth.toLocaleString("en-IN")}`,
      icon: <MonetizationOnIcon />,
      color: "#22c55e",
      isCircle: true,
      canDownload: true,
    },
    {
      label: "Expected to Collect",
      value: `₹${(data.expectedToCollect || 0).toLocaleString("en-IN")}`,
      icon: <PendingActionsIcon />,
      color: "#f59e0b",
    },
    /* {
      label: "Remaining Amount",
      value: `₹${data.remainingTotalChitAmount.toLocaleString("en-IN")}`,
      icon: <PendingActionsIcon />,
      color: "#f59e0b",
    }, */
    {
      label: "Remaining Months",
      value: data.remainingMonths,
      icon: <CalendarMonthIcon />,
      color: "#7c3aed",
    },
  ];

  return (
    <Box className="min-h-screen bg-[#f8fafc] mobile-page">
      <Box
        component="main"
        className="main-content-mobile"
        sx={{ p: { xs: 2, md: 3 } }}
      >
        {/* STATS GRID - Robust CSS Grid for exact 4 columns */}
        <Box
          className="stats-grid-mobile"
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gridAutoRows: "1fr", // Force all rows to have the same height
            gap: 3,
            mb: 4,
          }}
        >
          {statItems.map((item, idx) => (
            <Card
              key={idx}
              className="hover-card"
              sx={{
                height: "100%",
                minHeight: "110px", // Fixed minimum height for consistency
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <CardContent
                sx={{
                  p: "24px !important",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    height: 48,
                    borderRadius: item.isCircle ? "50%" : "8px",
                    backgroundColor: item.isCircle ? item.color : "transparent",
                    color: item.isCircle ? "white" : item.color,
                  }}
                >
                  {React.cloneElement(item.icon, { sx: { fontSize: 32 } })}
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#64748b",
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      fontSize: isMobile ? "1.1rem" : "1.25rem",
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>

                {item.canDownload && (
                  <Box sx={{ ml: "auto" }}>
                    <IconButton
                      size="small"
                      disabled={downloading === item.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadReport(item.label);
                      }}
                      sx={{
                        color: item.color,
                        "&:hover": { backgroundColor: `${item.color}15` },
                      }}
                    >
                      {downloading === item.label ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <DownloadIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* RECENT PAYMENTS SECTION */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            mb: 4,
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 3, fontWeight: 700, color: "#1e293b" }}
          >
            Latest Payments
          </Typography>
          {isMobile ? renderMobilePaymentCards() : renderPaymentTable()}
        </Paper>

        <Grid container spacing={3}>
          {/* RECENT MEMBERS */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
                New Members
              </Typography>
              <Box
                sx={{
                  overflowX: "auto",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={tableHeaderSx}>
                      <TableCell>Member</TableCell>
                      <TableCell>Chit</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.recentMembers || []).map((m, i) => (
                      <TableRow
                        key={i}
                        sx={{
                          "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "#1e293b" }}
                          >
                            {m.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#64748b", display: "block" }}
                          >
                            {m.address || "No Address"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "#1e293b" }}
                          >
                            {m.chitName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#64748b", display: "block" }}
                          >
                            {m.location || "No Location"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <StatusPill status={m.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Grid>

          {/* RECENT CHITS */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: "16px", border: "1px solid #e2e8f0" }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
                New Chits
              </Typography>
              <Box
                sx={{
                  overflowX: "auto",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={tableHeaderSx}>
                      <TableCell>Chit Name</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.recentChits || []).map((c, i) => (
                      <TableRow
                        key={i}
                        sx={{
                          "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                        }}
                      >
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "#1e293b" }}
                          >
                            {c.chitName}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#64748b", display: "block" }}
                          >
                            {c.location || "No Location"}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <StatusPill status={c.status} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ₹{c.amount?.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
      >
        <Alert
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
