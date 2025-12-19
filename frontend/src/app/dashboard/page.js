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

const handleLogout = () => {
  
  localStorage.removeItem("token");
  localStorage.removeItem("user"); 

  
  window.location.href = "/login";
};

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
        <Grid container spacing={1.5} justifyContent="center" padding="1rem">
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
        <Paper elevation={1} sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>
            Recent Activities
          </Typography>

          <Grid container spacing={2}>
            <RecentBlock
              title="Recent Members"
              items={data.recentActivities.filter((a) => a.type === "MEMBER")}
              renderRight={(item) => item.title}
            />

            <RecentBlock
              title="Recent Chits"
              items={data.recentActivities.filter((a) => a.type === "CHIT")}
              renderRight={(item) => item.title || "-"}
            />

            <RecentBlock
              title="Recent Payments"
              items={data.recentActivities.filter((a) => a.type === "PAYMENT")}
              renderRight={(item) => `₹${item.amount}`}
            />
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}

/* ================= STAT CARD ================= */

function StatCard({ icon, label, value }) {
  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card sx={cardStyle}>
        <CardContent sx={cardContentStyle}>
          <Box sx={iconWrapper}>{icon}</Box>

          <Box sx={textWrapper}>
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
function RecentBlock({ title, items, renderRight }) {
  return (
    <Grid item xs={12} md={4} justifycontent= "center">
      <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
        <Typography fontWeight={700} mb={1}>
          {title}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {items.slice(0, 6).map((item, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                borderBottom: "1px solid #eee",
                pb: 0.5,
              }}
            >
              <span>{item.action}</span>
              <span>{renderRight(item)}</span>
            </Box>
          ))}

          {items.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No records found
            </Typography>
          )}
        </Box>
      </Paper>
    </Grid>
  );
}

/* ================= STYLES ================= */

const cardStyle = {
  width: "100%", // ✅ full width
  height: 120,
  borderRadius: 2,
  padding: 5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardContentStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 2,
};

const iconWrapper = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 50,
};

const textWrapper = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
};
const iconStyle = (color) => ({
  justifyContent: "center",
  fontSize: 30,
  color,
});
