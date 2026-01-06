"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";

import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { apiRequest } from "@/config/api";

const getStatusColor = (status) => {
  const s = status?.toLowerCase();
  if (["active", "paid"].includes(s)) return { bg: "#dcfce7", text: "#166534" }; // Green
  if (["inactive", "overdue", "closed", "completed"].includes(s))
    return { bg: "#fee2e2", text: "#991b1b" }; // Red
  if (["partial", "upcoming", "pending"].includes(s))
    return { bg: "#fef3c7", text: "#92400e" }; // Orange/Amber
  return { bg: "#f1f5f9", text: "#475569" }; // Default Gray
};

const tableHeaderSx = {
  backgroundColor: "#e2e8f0",
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

export default function ChitDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [chit, setChit] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===================== NOTIFICATION STATE ====================== */
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
    if (!id) return;

    const fetchChitDetails = async () => {
      try {
        const res = await apiRequest(`/chit/details/${id}`);
        // Extract data accurately based on API response structure
        const chitData = res?.data?.chit || res?.data || null;
        const membersData = res?.data?.members || [];

        setChit(chitData);
        setMembers(membersData);
      } catch (err) {
        showNotification(
          err.message || "Failed to fetch chit details",
          "error"
        );
        console.error("Failed to fetch chit details", err);
        setChit(null);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChitDetails();
  }, [id]);

  /* ================= LOADING / ERROR ================= */
  if (loading) {
    return (
      <main className="p-10 text-center">
        <Typography variant="h6">Loading chit details...</Typography>
      </main>
    );
  }

  if (!chit) {
    return (
      <main className="p-10 text-center">
        <Typography variant="h6">No chit found</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => router.back()}>
          Back
        </Button>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-6">
      <Box sx={{ position: "relative", mb: 4 }}>
        <Button
          variant="outlined"
          onClick={() => router.back()}
          sx={{
            color: "#64748b",
            borderColor: "#cbd5e1",
            fontWeight: 700,
            borderRadius: "8px",
            "&:hover": { borderColor: "#94a3b8", backgroundColor: "#f8fafc" },
          }}
        >
          BACK
        </Button>
        <Typography
          variant="h4"
          fontWeight={800}
          align="center"
          sx={{
            color: "#1e293b",
            mt: -4,
            textTransform: "capitalize",
          }}
        >
          {chit.chitName}
        </Typography>
      </Box>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<MonetizationOnIcon sx={{ fontSize: 34, color: "#0284c7" }} />}
          value={`₹${chit.amount?.toLocaleString("en-IN")}`}
          label="Amount"
        />
        <StatCard
          icon={<MonetizationOnIcon sx={{ fontSize: 34, color: "#16a34a" }} />}
          value={`₹${chit.monthlyPayableAmount?.toLocaleString("en-IN")}`}
          label="Monthly Payable"
        />
        <StatCard
          icon={<CalendarMonthIcon sx={{ fontSize: 34, color: "#9333ea" }} />}
          value={chit.duration}
          label="Months"
        />
        <StatCard
          icon={<GroupsIcon sx={{ fontSize: 34, color: "#ea580c" }} />}
          value={`${members.length}/${chit.membersLimit}`}
          label="Members"
        />
        <StatCard
          icon={
            <CheckCircleIcon
              sx={{ fontSize: 34, color: getStatusColor(chit.status).text }}
            />
          }
          value={chit.status}
          label="Status"
          isStatus
        />
      </div>

      {/* OVERVIEW */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          p: 1,
        }}
      >
        <CardContent>
          <Typography
            fontWeight={700}
            sx={{ color: "#1e293b", mb: 3, fontSize: "1.1rem" }}
          >
            Overview
          </Typography>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                Chit Amount:
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                ₹{chit.amount?.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                Monthly Payable:
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                ₹{chit.monthlyPayableAmount?.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                Duration:
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {chit.duration} months
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                Total Members:
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {members.length} / {chit.membersLimit}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                Start Date:
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {chit.startDate
                  ? new Date(chit.startDate).toLocaleDateString("en-IN")
                  : "-"}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                Due Date:
              </Typography>
              <Typography sx={{ fontWeight: 700 }}>
                {chit.dueDate || "-"}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                Location:
              </Typography>
              <Typography sx={{ fontWeight: 700, textTransform: "capitalize" }}>
                {chit.location}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                pb: 1,
              }}
            >
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>
                Status:
              </Typography>
              <StatusPill status={chit.status} />
            </Box>
          </div>
        </CardContent>
      </Card>

      {/* MEMBERS LIST */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <CardContent className="p-0">
          <Typography fontWeight={700} sx={{ p: 2, color: "#1e293b" }}>
            Members ({members.length})
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={tableHeaderSx}>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {members.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 3, color: "#94a3b8" }}
                    >
                      No members assigned
                    </TableCell>
                  </TableRow>
                )}

                {members.map((m, index) => (
                  <TableRow
                    key={m.memberId || m._id || index}
                    sx={{
                      "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                      "&:hover": { backgroundColor: "#f1f5f9" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                      {m.name}
                    </TableCell>
                    <TableCell sx={{ color: "#64748b" }}>{m.phone}</TableCell>
                    <TableCell sx={{ color: "#64748b", fontSize: "13px" }}>
                      {m.address || "-"}
                    </TableCell>
                    <TableCell align="center">
                      <StatusPill status={m.status} />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          router.push(`/members/${m.memberId || m._id}`)
                        }
                        sx={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#2563eb",
                          borderColor: "#cbd5e1",
                          borderRadius: "6px",
                          "&:hover": {
                            borderColor: "#2563eb",
                            backgroundColor: "#eff6ff",
                          },
                        }}
                      >
                        VIEW DETAILS
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

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
    </main>
  );
}

/* STAT CARD */
function StatCard({ icon, value, label, isStatus }) {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        backgroundColor: "white",
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: "12px",
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            color: "#1e293b",
            fontSize: "1.1rem",
            textTransform: isStatus ? "uppercase" : "none",
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#64748b",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </Typography>
      </Box>
    </Card>
  );
}
