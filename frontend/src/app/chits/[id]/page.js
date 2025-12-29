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

/* ================= BADGE UTILS ================= */
const badge = (status) => {
  if (status === "Active") return "bg-green-100 text-green-700";
  if (status === "Upcoming") return "bg-blue-100 text-blue-700";
  if (status === "Completed") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-600";
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
      <Box className="space-y-3">
        <Button variant="outlined" onClick={() => router.back()}>
          Back
        </Button>
        <Typography variant="h4" fontWeight={600} align="center" color="black">
          {chit.chitName}
        </Typography>
      </Box>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<MonetizationOnIcon sx={{ fontSize: 34, color: "#1e88e5" }} />}
          value={`₹${chit.amount}`}
          label="Amount"
        />
        <StatCard
          icon={<MonetizationOnIcon sx={{ fontSize: 34, color: "green" }} />}
          value={`₹${chit.monthlyPayableAmount}`}
          label="Monthly Payable"
        />
        <StatCard
          icon={<CalendarMonthIcon sx={{ fontSize: 34, color: "#9c27b0" }} />}
          value={chit.duration}
          label="Months"
        />
        <StatCard
          icon={<GroupsIcon sx={{ fontSize: 34, color: "green" }} />}
          value={`${members.length}/${chit.membersLimit}`}
          label="Members"
        />
        <StatCard
          icon={<CheckCircleIcon sx={{ fontSize: 34, color: "green" }} />}
          value={chit.status}
          label="Status"
        />
      </div>

      {/* OVERVIEW */}
      <Card>
        <CardContent>
          <Typography fontWeight={600} mb={2}>
            Overview
          </Typography>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <p>
              <b>Chit Amount:</b> ₹{chit.amount}
            </p>
            <p>
              <b>Monthly Payable:</b> ₹{chit.monthlyPayableAmount}
            </p>
            <p>
              <b>Duration:</b> {chit.duration} months
            </p>
            <p>
              <b>Total Members:</b> {members.length} / {chit.membersLimit}
            </p>
            <p>
              <b>Start Date:</b>{" "}
              {chit.startDate
                ? new Date(chit.startDate).toLocaleDateString()
                : "-"}
            </p>
            <p>
              <b>Due Date:</b> {chit.dueDate || "-"}
            </p>
            <p>
              <b>Location:</b> {chit.location}
            </p>
            <p>
              <b>Status:</b>{" "}
              <span
                className={`px-2 py-1 rounded text-sm ${badge(chit.status)}`}
              >
                {chit.status}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* MEMBERS LIST */}
      <Card>
        <CardContent className="p-0">
          <Typography fontWeight={600} sx={{ p: 2 }}>
            Members ({members.length})
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No members assigned
                    </TableCell>
                  </TableRow>
                )}

                {members.map((m, index) => (
                  <TableRow key={m.memberId || m._id || index}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell>{m.address || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${badge(
                          m.status
                        )}`}
                      >
                        {m.status}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          router.push(`/members/${m.memberId || m._id}`)
                        }
                      >
                        View Details
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
function StatCard({ icon, value, label }) {
  return (
    <Card className="p-3 flex items-center gap-3">
      {icon}
      <div>
        <Typography variant="h6" fontWeight={600}>
          {value}
        </Typography>
        <Typography variant="body2">{label}</Typography>
      </div>
    </Card>
  );
}
