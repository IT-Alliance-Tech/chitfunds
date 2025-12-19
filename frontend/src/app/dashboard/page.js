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
    px: 4,
    py: 3,
    width: "100%",
  }}
>
  <Typography variant="h6" fontWeight={700} mb={2}>
    Recent Activities
  </Typography>

  <Grid
    container
    direction="column"
    spacing={2}
    sx={{ mt: 1 }}
  >
    <RecentBlock
      title="Recent Payments"
      items={data.recentActivities.filter(
        (item) => item.type === "PAYMENT"
      )}
    />

    <RecentBlock
      title="Recent Members"
      items={data.recentActivities.filter(
        (item) => item.type === "MEMBER"
      )}
    />

    <RecentBlock
      title="Recent Chits"
      items={data.recentActivities.filter(
        (item) => item.type === "CHIT"
      )}
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

function RecentBlock({ title, items }) {
  return (
    <Grid item xs={12}>
      <Paper
        variant="outlined"
        sx={{
          p: "14px 16px",
          borderRadius: 2,
        }}
      >
        <Typography fontWeight={600} mb={1.5} fontSize={15}>
          {title}
        </Typography>

        {/* Header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1.5fr",
            fontSize: 12,
            fontWeight: 600,
            color: "text.secondary",
            mb: 1,
          }}
        >
          <span>Type</span>
          <span>Action</span>
          <span>Amount</span>
          <span>Date</span>
        </Box>

        {items.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1.5fr",
              fontSize: 13,
              borderBottom: "1px solid #eee",
              py: 0.8,
            }}
          >
            <span>{item.type}</span>
            <span>{item.action}</span>
            <span>
              {item.amount
                ? `₹${item.amount.toLocaleString("en-IN")}`
                : "-"}
            </span>
            <span>{formatDate(item.date)}</span>
          </Box>
        ))}
      </Paper>
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


