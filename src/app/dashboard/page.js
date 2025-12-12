"use client";
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
import PendingActionsIcon from "@mui/icons-material/PendingActions";

export default function Dashboard() {
  // Dummy values (replace with API later)
  const totalChits = 12;
  const totalMembers = 56;
  const activeChits = 9;
  const pendingChits = 3;
  const closedChits = 5;

  const recentActivities = [
    { action: "Added new member", detail: "Rohit Sharma", time: "2 hours ago" },
    {
      action: "Created chit",
      detail: "₹1,00,000 - 20 Months",
      time: "5 hours ago",
    },
    { action: "Updated payment", detail: "Member ID #102", time: "1 day ago" },
    { action: "Deleted chit", detail: "Old 50K chit", time: "2 days ago" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1">
        {/* Main Area */}
        <main className="p-6">
          {/* Stats Cards */}
          <Grid container spacing={3}>
            {/* Total Chits */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <AccountBalanceIcon
                      sx={{ fontSize: 40, color: "#0ea5e9" }}
                    />
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Chits
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {totalChits}
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Members */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <GroupsIcon sx={{ fontSize: 40, color: "#8b5cf6" }} />
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Members
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {totalMembers}
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Active Chits */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon sx={{ fontSize: 40, color: "green" }} />
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">
                        Active Chits
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {activeChits}
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Pending Chits */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <PendingActionsIcon
                      sx={{ fontSize: 40, color: "#d97706" }}
                    />
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pending Chits
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {pendingChits}
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Closed Chits (NEW) */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon sx={{ fontSize: 40, color: "#64748b" }} />
                    <div>
                      <Typography variant="subtitle2" color="text.secondary">
                        Closed Chits
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {closedChits}
                      </Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Activities Table */}
          <Paper elevation={2} className="mt-10 p-4">
            <Typography variant="h6" fontWeight="600" className="mb-4">
              Recent Activities
            </Typography>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Activity</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Details</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Time</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {recentActivities.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.detail}</TableCell>
                    <TableCell>{row.time}</TableCell>
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
