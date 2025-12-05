"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";

/* ================= MOCK MEMBERS ================= */
const MEMBERS = [
  {
    id: "1",
    name: "Gireeshma Reddy",
    email: "gireeshma@gmail.com",
    address: "Banjara Hills, Hyderabad",
    phone: "9876501234",
    status: "Active",
    documents: ["Aadhaar Card", "PAN Card"],
    chits: ["Silver Chit", "Gold Chit"],
  },
  {
    id: "2",
    name: "Sahana R",
    email: "sahana@gmail.com",
    address: "Whitefield, Bangalore",
    phone: "9900123456",
    status: "Inactive",
    documents: ["Electricity Bill"],
    chits: ["Starter Chit"],
  },
];

/* ================= MOCK CHITS ================= */
const CHITS = [
  { name: "Silver Chit", amount: "₹50,000", duration: "12 Months", members: 50 },
  { name: "Gold Chit", amount: "₹1,00,000", duration: "24 Months", members: 30 },
  { name: "Starter Chit", amount: "₹25,000", duration: "6 Months", members: 40 },
];

/* ================= PAYMENT DETAILS BY CHIT ================= */
const MONTHLY_PAYMENTS = {
  "Silver Chit": [
    { month: "Jan 2025", amount: "₹4,150", status: "Paid" },
    { month: "Feb 2025", amount: "₹4,150", status: "Paid" },
    { month: "Mar 2025", amount: "₹4,150", status: "Paid" },
    { month: "Apr 2025", amount: "₹4,150", status: "Unpaid" },
  ],
  "Gold Chit": [
    { month: "Jan 2025", amount: "₹4,200", status: "Paid" },
    { month: "Feb 2025", amount: "₹4,200", status: "Unpaid" },
    { month: "Mar 2025", amount: "₹4,200", status: "Unpaid" },
  ],
  "Starter Chit": [
    { month: "Jan 2025", amount: "₹4,000", status: "Paid" },
    { month: "Feb 2025", amount: "₹4,000", status: "Paid" },
  ],
};

export default function MemberDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const member = MEMBERS.find((m) => m.id === id);
  if (!member) return null;

  const memberChits = CHITS.filter((c) =>
    member.chits.includes(c.name)
  );

  /* ================= DIALOG STATES ================= */
  const [open, setOpen] = useState(false);
  const [selectedChit, setSelectedChit] = useState(null);

  const handleOpen = (chitName) => {
    setSelectedChit(chitName);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedChit(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6 space-y-6">

          {/* ================= HEADER ================= */}
          <div className="relative flex items-center mb-4">

            {/* Back Button */}
            <Button variant="outlined" onClick={() => router.back()}>
              Back
            </Button>

            {/* Center Title */}
            <Typography
              variant="h4"
              fontWeight={600}
              color="black"
              className="absolute left-1/2 -translate-x-1/2"
            >
              Member Details
            </Typography>

          </div>

          {/* ================= PERSONAL DETAILS ================= */}
          <Card>
            <CardContent>
              <div className="space-y-3">

                <div>
                  <Typography variant="caption">Full Name</Typography>
                  <Typography fontWeight={500}>{member.name}</Typography>
                </div>

                <div>
                  <Typography variant="caption">Email Address</Typography>
                  <Typography fontWeight={500}>{member.email}</Typography>
                </div>

                <div>
                  <Typography variant="caption">Phone Number</Typography>
                  <Typography fontWeight={500}>{member.phone}</Typography>
                </div>

                <div>
                  <Typography variant="caption">Status</Typography>
                  <Typography fontWeight={500}>{member.status}</Typography>
                </div>

                <div>
                  <Typography variant="caption">Address</Typography>
                  <Typography fontWeight={500}>{member.address}</Typography>
                </div>

              </div>

              <Divider sx={{ my: 3 }} />

              {/* ================= SECURITY DOCUMENTS ================= */}
              <Typography fontWeight={600} mb={2}>
                Security Documents
              </Typography>

              <div className="flex flex-wrap gap-2">
                {member.documents.map((doc) => (
                  <Chip key={doc} label={doc} />
                ))}
              </div>

            </CardContent>
          </Card>

          {/* ================= ASSIGNED CHITS + ACTION ================= */}
          <Card>
            <CardContent>

              <Typography fontWeight={600} mb={2}>
                Assigned Chits
              </Typography>

              <Table>

                <TableHead>
                  <TableRow>
                    <TableCell>Chit Name</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Members Limit</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {memberChits.map((chit) => (
                    <TableRow key={chit.name}>
                      <TableCell>{chit.name}</TableCell>
                      <TableCell>{chit.amount}</TableCell>
                      <TableCell>{chit.duration}</TableCell>
                      <TableCell>{chit.members}</TableCell>

                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ px: 1.5, py: 0.3, fontSize: "12px" }}
                          onClick={() => handleOpen(chit.name)}
                        >
                          View Payment Details
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

      {/* ================= PAYMENT DETAILS POPUP ================= */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >

        <DialogTitle className="flex justify-between items-center">
          <Typography fontWeight={600}>
            {selectedChit} – Payment Details
          </Typography>

          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>

          <Table size="small">

            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {MONTHLY_PAYMENTS[selectedChit]?.map((pay, index) => (
                <TableRow key={index}>
                  <TableCell>{pay.month}</TableCell>
                  <TableCell>{pay.amount}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={pay.status}
                      color={pay.status === "Paid" ? "success" : "error"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>

        </DialogContent>

      </Dialog>

    </div>
  );
}
