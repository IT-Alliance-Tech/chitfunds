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
  Box,
} from "@mui/material";

import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

/* ================= MOCK MEMBERS ================= */
const MEMBERS = [
  { id: 1, name: "Gireeshma Reddy", phone: "9876501234", joined: "2025-01-12", status: "Paid", chit: "Silver Chit" },
  { id: 2, name: "Sahana R", phone: "9900123456", joined: "2025-01-15", status: "Pending", chit: "Gold Chit" },
  { id: 3, name: "Kiran Kumar", phone: "9988776655", joined: "2025-01-20", status: "Paid", chit: "Starter Chit" },
  { id: 4, name: "Lavanya P", phone: "9123987654", joined: "2025-02-05", status: "Paid", chit: "Silver Chit" },
  { id: 5, name: "Manoj Shetty", phone: "9001237890", joined: "2025-02-10", status: "Defaulted", chit: "Gold Chit" },
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

  useEffect(() => {
    const stored = localStorage.getItem("selectedChit");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.id === id) {
        setChit(parsed);
      }
    }
  }, [id]);

  if (!chit) {
    return (
      <main className="p-10 text-center">
        <Typography variant="h6">Loading chit details...</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => router.back()}>
          Back
        </Button>
      </main>
    );
  }

  const members = MEMBERS.filter((m) => m.chit === chit.name);

  return (
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-6">

      {/* ================= HEADER ================= */}
      <Box className="space-y-3">
        <Box className="mt-2">
          <Button variant="outlined" onClick={() => router.back()}>
            Back
          </Button>
        </Box>

        <Typography
  variant="h4"
  fontWeight={600}
  align="center"
  sx={{ color: "#000" }}
>
  {chit.name}
</Typography>

      </Box>

      {/* ================= STATS CARDS ================= */}
  <div className="max-w-[100%] mx-auto">
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 justify-items-center">

    <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
      <div className="flex items-center gap-3 w-full">
        <MonetizationOnIcon sx={{ fontSize: 34, color: "#1e88e5" }} />
        <div>
          <Typography variant="h6" fontWeight={600}>₹{chit.amount}</Typography>
          <Typography variant="body2">Amount</Typography>
        </div>
      </div>
    </Card>

    <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
      <div className="flex items-center gap-3 w-full">
        <MonetizationOnIcon sx={{ fontSize: 34, color: "green" }} />
        <div>
          <Typography variant="h6" fontWeight={600}>₹{chit.monthlyAmount}</Typography>
          <Typography variant="body2">Monthly Payable</Typography>
        </div>
      </div>
    </Card>

    <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
      <div className="flex items-center gap-3 w-full">
        <CalendarMonthIcon sx={{ fontSize: 34, color: "#9c27b0" }} />
        <div>
          <Typography variant="h6" fontWeight={600}>
            {chit.durationMonths}
          </Typography>
          <Typography variant="body2">Months</Typography>
        </div>
      </div>
    </Card>

    <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
      <div className="flex items-center gap-3 w-full">
        <GroupsIcon sx={{ fontSize: 34, color: "green" }} />
        <div>
          <Typography variant="h6" fontWeight={600}>
            {chit.membersCount}/{chit.membersLimit}
          </Typography>
          <Typography variant="body2">Members</Typography>
        </div>
      </div>
    </Card>

    <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
      <div className="flex items-center gap-3 w-full">
        <CheckCircleIcon sx={{ fontSize: 34, color: "green" }} />
        <div>
          <Typography variant="h6" fontWeight={600}>{chit.status}</Typography>
          <Typography variant="body2">Status</Typography>
        </div>
      </div>
    </Card>

  </div>
</div>



      {/* ================= OVERVIEW ================= */}
     <Card>
  <CardContent>
    <Typography fontWeight={600} mb={2}>
      Overview
    </Typography>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
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
      <Card>
        <CardContent className="p-0">
          <Typography fontWeight={600} sx={{ p: 2 }}>
            Members ({members.length})
          </Typography>

          {/* Mobile-safe scroll */}
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
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
                      <span className={`px-3 py-1 rounded-full text-sm ${badge(m.status)}`}>
                        {m.status}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
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
          </Box>
        </CardContent>
      </Card>

    </main>
  );
}
