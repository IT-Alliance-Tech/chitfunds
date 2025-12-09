"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  Typography,
  Button,
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

/* ================= CHITS (MONTHLY FROM CHIT PAGE) ================= */
const CHITS = [
  {
    name: "Silver Chit",
    monthly: 4150,
    amount: "₹50,000",
    duration: "12 Months",
    members: 50,
  },
  {
    name: "Gold Chit",
    monthly: 8200,
    amount: "₹1,00,000",
    duration: "24 Months",
    members: 30,
  },
  {
    name: "Starter Chit",
    monthly: 2500,
    amount: "₹25,000",
    duration: "6 Months",
    members: 40,
  },
];

/* ================= PAYMENT DATA ================= */
const MONTHLY_PAYMENTS = {
  "Silver Chit": [
    {
      month: "Jan 2025",
      paidDate: "05-Jan-2025",
      method: "UPI",
      interest: 0,
      paidAmount: 4150,
    },
    {
      month: "Feb 2025",
      paidDate: "05-Feb-2025",
      method: "UPI",
      interest: 0,
      paidAmount: 4150,
    },
    {
      month: "Mar 2025",
      paidDate: "04-Mar-2025",
      method: "Cash",
      interest: 0,
      paidAmount: 4150,
    },
    {
      month: "Apr 2025",
      paidDate: "—",
      method: "—",
      interest: 150,
      paidAmount: 4100,
    },
  ],

  "Gold Chit": [
    {
      month: "Jan 2025",
      paidDate: "06-Jan-2025",
      method: "Bank",
      interest: 0,
      paidAmount: 8200,
    },
    {
      month: "Feb 2025",
      paidDate: "—",
      method: "—",
      interest: 200,
      paidAmount: 8300,
    },
  ],

  "Starter Chit": [
    {
      month: "Jan 2025",
      paidDate: "02-Jan-2025",
      method: "UPI",
      interest: 0,
      paidAmount: 2500,
    },
    {
      month: "Feb 2025",
      paidDate: "01-Feb-2025",
      method: "Cash",
      interest: 0,
      paidAmount: 2500,
    },
  ],
};

/* ================= HELPERS ================= */
const calculateTotal = (monthly, interest) =>
  Number(monthly || 0) + Number(interest || 0);

const calculateBalance = (total, paid) =>
  Math.max(total - Number(paid || 0), 0);

export default function MemberDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const member = MEMBERS.find((m) => m.id === id);
  if (!member) return null;

  const memberChits = CHITS.filter((c) =>
    member.chits.includes(c.name)
  );

  const [open, setOpen] = useState(false);
  const [selectedChit, setSelectedChit] = useState(null);

  const handleOpen = (chit) => {
    setSelectedChit(chit);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedChit(null);
    setOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6 space-y-6">

          {/* HEADER */}
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
              Member Details
            </Typography>
          </div>

          {/* PERSONAL */}
          <Card>
            <CardContent>

              <div className="space-y-3">
                <div>
                  <Typography variant="caption">Full Name</Typography>
                  <Typography fontWeight={500}>{member.name}</Typography>
                </div>

                <div>
                  <Typography variant="caption">Email</Typography>
                  <Typography fontWeight={500}>{member.email}</Typography>
                </div>

                <div>
                  <Typography variant="caption">Phone</Typography>
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

          {/* ASSIGNED CHITS */}
          <Card>
            <CardContent>

              <Typography fontWeight={600} mb={2}>
                Assigned Chits
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Chit</TableCell>
                    <TableCell>Chit Amount</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {memberChits.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.amount}</TableCell>
                      <TableCell>{c.duration}</TableCell>
                      <TableCell>{c.members}</TableCell>

                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpen(c)}
                        >
                          View Payment
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

      {/* PAYMENT DIALOG */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">

        <DialogTitle className="flex justify-between">
          <Typography fontWeight={600}>
            {selectedChit?.name} {`– Payment Details`}
          </Typography>

          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>

          <Table size="small">

           <TableHead>
  <TableRow>
    <TableCell><b>Month</b></TableCell>
    <TableCell><b>Payable</b></TableCell>
    <TableCell><b>Paid Date</b></TableCell>
    <TableCell><b>Paid</b></TableCell>
    <TableCell><b>Interest</b></TableCell>
    <TableCell><b>Balance</b></TableCell>
    <TableCell><b>Method</b></TableCell>
    <TableCell><b>Status</b></TableCell>
  </TableRow>
</TableHead>


            <TableBody>
  {MONTHLY_PAYMENTS[selectedChit?.name]?.map((pay, index) => {

    const totalPayable =
      Number(selectedChit.monthly) + Number(pay.interest || 0);

    const balance =
      Math.max(totalPayable - Number(pay.paidAmount || 0), 0);

    const status = balance === 0 ? "Paid" : "Unpaid";

    return (
      <TableRow key={index}>

        <TableCell>{pay.month}</TableCell>

        {/* Payable Amount */}
        <TableCell>
          ₹{totalPayable}
        </TableCell>

        {/* Paid Date */}
        <TableCell>{pay.paidDate}</TableCell>

        {/* Paid */}
        <TableCell>
          ₹{pay.paidAmount}
        </TableCell>

        {/* Interest */}
        <TableCell>
          ₹{pay.interest}
        </TableCell>

        {/* Balance */}
        <TableCell
          sx={{
            fontWeight: 600,
            color: balance === 0 ? "green" : "red",
          }}
        >
          ₹{balance}
        </TableCell>

        {/* Payment Method */}
        <TableCell>
          {pay.method}
        </TableCell>

        {/* Status */}
        <TableCell>
          <Chip
            size="small"
            label={status}
            color={status === "Paid" ? "success" : "error"}
          />
        </TableCell>

      </TableRow>
    );
  })}
</TableBody>


          </Table>

        </DialogContent>

      </Dialog>

    </div>
  );
}
