"use client";

import { useParams, useRouter } from "next/navigation";
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

/* ================= MOCK CHITS ================= */
const MOCK_CHITS = [
  {
    id: "CHT-001",
    name: "Silver Chit",
    amount: 50000,
    durationMonths: 12,
    membersLimit: 50,
    membersCount: 24,
    startDate: "2025-01-10",
    cycleDay: 10,
    status: "Active",
  },
  {
    id: "CHT-002",
    name: "Gold Chit",
    amount: 100000,
    durationMonths: 24,
    membersLimit: 30,
    membersCount: 5,
    startDate: "2025-06-01",
    cycleDay: 1,
    status: "Upcoming",
  },
  {
    id: "CHT-003",
    name: "Starter Chit",
    amount: 25000,
    durationMonths: 6,
    membersLimit: 40,
    membersCount: 40,
    startDate: "2024-08-15",
    cycleDay: 15,
    status: "Closed",
  },
];

/* ================= MOCK MEMBERS ================= */
/* ================= LINKED MEMBERS ================= */
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


/* ================= STATUS BADGE ================= */
const badge = (status) => {
  if (status === "Paid") return "bg-green-100 text-green-700";
  if (status === "Pending") return "bg-yellow-100 text-yellow-700";
  if (status === "Defaulted") return "bg-red-100 text-red-700";
  return "bg-gray-200";
};

export default function ChitDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const chit = MOCK_CHITS.find((c) => c.id === id);
 const members = MEMBERS.filter(
  (m) => m.chit === chit.name
);


  if (!chit) {
    return (
      <main className="p-10 text-center">
        <Typography variant="h6">Chit not found</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => router.back()}>
          Back
        </Button>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <Topbar />

        <main className="p-6 space-y-6">

          {/* HEADER */}
         {/* ================= HEADER ================= */}
<div className="relative flex items-center mb-4">

  {/* BACK BUTTON - LEFT */}
  <Button variant="outlined" onClick={() => router.back()}>
    Back
  </Button>

  {/* CENTER TITLE */}
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
    onClick={() =>
      router.push(`/dashboard/members/${m.id}`)
    }
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
