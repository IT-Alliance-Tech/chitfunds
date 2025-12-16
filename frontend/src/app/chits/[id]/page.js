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
  Grid,
} from "@mui/material";

import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";

/* ================= MOCK MEMBERS ================= */
const MEMBERS = [
  {
    id: 1,
    name: "Gireeshma Reddy",
    phone: "9876501234",
    joined: "2025-01-12",
    status: "Paid",
    chit: "Silver Chit",
  },
  {
    id: 2,
    name: "Sahana R",
    phone: "9900123456",
    joined: "2025-01-15",
    status: "Pending",
    chit: "Gold Chit",
  },
  {
    id: 3,
    name: "Kiran Kumar",
    phone: "9988776655",
    joined: "2025-01-20",
    status: "Paid",
    chit: "Starter Chit",
  },
  {
    id: 4,
    name: "Lavanya P",
    phone: "9123987654",
    joined: "2025-02-05",
    status: "Paid",
    chit: "Silver Chit",
  },
  {
    id: 5,
    name: "Manoj Shetty",
    phone: "9001237890",
    joined: "2025-02-10",
    status: "Defaulted",
    chit: "Gold Chit",
  },
];

/* ================= BADGE UTILS ================= */
const badge = (status) => {
  if (status === "Paid") return "bg-green-100 text-green-700";
  if (status === "Pending") return "bg-yellow-100 text-yellow-700";
  if (status === "Defaulted") return "bg-red-100 text-red-700";
  return "bg-gray-200 text-gray-600";
};

export default function ChitDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [chit, setChit] = useState(null);

  /* ✅ Load data passed from Chits page */
  useEffect(() => {
    const stored = localStorage.getItem("selectedChit");

    if (stored) {
      const parsed = JSON.parse(stored);

      // ✅ safety check: ensure correct chit is loaded
      if (parsed?.id === id) {
        setChit(parsed);
      }
    }
  }, [id]);

  /* ================= LOADING / NOT FOUND ================= */

  if (!chit) {
    return (
      <main className="p-10 text-center">
        <Typography variant="h6">Loading chit details...</Typography>

        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() => router.back()}
        >
          Back
        </Button>
      </main>
    );
  }

  const members = MEMBERS.filter((m) => m.chit === chit.name);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6 space-y-6">

          {/* ================= HEADER ================= */}
          <div className="relative flex items-center mb-4">
            <Button variant="outlined" onClick={() => router.back()}>
              Back
            </Button>

            <Typography
              variant="h4"
              fontWeight={600}
              color="black"
              className="absolute left-1/2 -translate-x-1/2"
            >
              {chit.name}
            </Typography>
          </div>

          {/* ================= STATS CARDS ================= */}
          <Grid container spacing={3}>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent className="flex gap-3 items-center">
                  <MonetizationOnIcon color="primary" />
                  <div>
                    <Typography variant="subtitle2">Amount</Typography>
                    <Typography fontWeight={600}>₹{chit.amount}</Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent className="flex gap-3 items-center">
                  <MonetizationOnIcon color="success" />
                  <div>
                    <Typography variant="subtitle2">Monthly Payable</Typography>
                    <Typography fontWeight={600}>
                      ₹{chit.monthlyAmount}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent className="flex gap-3 items-center">
                  <CalendarMonthIcon color="secondary" />
                  <div>
                    <Typography variant="subtitle2">Duration</Typography>
                    <Typography fontWeight={600}>
                      {chit.durationMonths} Months
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent className="flex gap-3 items-center">
                  <GroupsIcon color="success" />
                  <div>
                    <Typography variant="subtitle2">Members</Typography>
                    <Typography fontWeight={600}>
                      {chit.membersCount}/{chit.membersLimit}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent className="flex gap-3 items-center">
                  <CheckCircleIcon color="success" />
                  <div>
                    <Typography variant="subtitle2">Status</Typography>
                    <Typography fontWeight={600}>{chit.status}</Typography>
                  </div>
                </CardContent>
              </Card>
            </Grid>

          </Grid>

          {/* ================= OVERVIEW ================= */}
          <Card elevation={2}>
            <CardContent>

              <Typography fontWeight={600} mb={2}>
                Overview
              </Typography>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <p><b>ID:</b> {chit.id}</p>
                <p><b>Start Date:</b> {chit.startDate}</p>
                <p><b>Cycle Day:</b> {chit.cycleDay}</p>
                <p><b>Duration:</b> {chit.durationMonths}</p>
                <p><b>Monthly Amount:</b> ₹{chit.monthlyAmount}</p>
                <p><b>Members Limit:</b> {chit.membersLimit}</p>
                <p><b>Status:</b> {chit.status}</p>
              </div>

            </CardContent>
          </Card>

          {/* ================= MEMBERS LIST ================= */}
          <Card elevation={2}>
            <CardContent className="p-0">

              <Typography fontWeight="600" sx={{ p: 2 }}>
                Members ({members.length})
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><b>ID</b></TableCell>
                    <TableCell><b>Name</b></TableCell>
                    <TableCell><b>Phone</b></TableCell>
                    <TableCell><b>Joined</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell align="center"><b>Action</b></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>

                  {members.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No members yet
                      </TableCell>
                    </TableRow>
                  )}

                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.id}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.phone}</TableCell>
                      <TableCell>{m.joined}</TableCell>

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
                          variant="outlined"
                          size="small"
                          sx={{ textTransform: "none", borderRadius: "8px" }}
                          onClick={() => router.push(`/members/${m.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                </TableBody>
              </Table>

            </CardContent>
          </Card>

        </main>
      </div>
    </div>
  );
}
