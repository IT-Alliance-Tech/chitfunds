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
  Box,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";

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

/* ================= CHITS ================= */
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
    { month: "Jan 2025", paidDate: "05-Jan-2025", method: "UPI", interest: 0, paidAmount: 4150 },
    { month: "Feb 2025", paidDate: "05-Feb-2025", method: "UPI", interest: 0, paidAmount: 4150 },
    { month: "Mar 2025", paidDate: "04-Mar-2025", method: "Cash", interest: 0, paidAmount: 4150 },
    { month: "Apr 2025", paidDate: "—", method: "—", interest: 150, paidAmount: 4100 },
  ],
  "Gold Chit": [
    { month: "Jan 2025", paidDate: "06-Jan-2025", method: "Bank", interest: 0, paidAmount: 8200 },
    { month: "Feb 2025", paidDate: "—", method: "—", interest: 200, paidAmount: 8300 },
  ],
  "Starter Chit": [
    { month: "Jan 2025", paidDate: "02-Jan-2025", method: "UPI", interest: 0, paidAmount: 2500 },
    { month: "Feb 2025", paidDate: "01-Feb-2025", method: "Cash", interest: 0, paidAmount: 2500 },
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
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-6">

      
      {/* ================= HEADER ================= */}
<Box className="space-y-3">

  {/* Back Button */}
  <Box className="mt-2">
    <Button variant="outlined" onClick={() => router.back()}>
      Back
    </Button>
  </Box>

  {/* Centered Title */}
  <Typography
  variant="h4"
  fontWeight={600}
  align="center"
  sx={{ color: "text.primary" }}
>
  Member Details
</Typography>


</Box>


      {/* ================= PERSONAL DETAILS ================= */}
      <Card>
        <CardContent className="space-y-3">
          <Detail label="Full Name" value={member.name} />
          <Detail label="Email" value={member.email} />
          <Detail label="Phone" value={member.phone} />
          <Detail label="Status" value={member.status} />
          <Detail label="Address" value={member.address} />

          <Divider sx={{ my: 3 }} />

          <Typography fontWeight={600}>Security Documents</Typography>
          <div className="flex flex-wrap gap-2">
            {member.documents.map((doc) => (
              <Chip key={doc} label={doc} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ================= ASSIGNED CHITS ================= */}
      <Card>
        <CardContent>
          <Typography fontWeight={600} mb={2}>
            Assigned Chits
          </Typography>

          {/* Mobile safe scroll */}
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Chit</TableCell>
                  <TableCell>Amount</TableCell>
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
                      <Button size="small" variant="contained" onClick={() => handleOpen(c)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* ================= PAYMENT DIALOG ================= */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle className="flex justify-between items-center">
          <Typography fontWeight={600}>
            {selectedChit?.name} – Payment Details
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell>Payable</TableCell>
                  <TableCell>Paid Date</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Interest</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {MONTHLY_PAYMENTS[selectedChit?.name]?.map((pay, index) => {
                  const total = Number(selectedChit.monthly) + Number(pay.interest || 0);
                  const balance = Math.max(total - Number(pay.paidAmount || 0), 0);
                  const status = balance === 0 ? "Paid" : "Unpaid";

                  return (
                    <TableRow key={index}>
                      <TableCell>{pay.month}</TableCell>
                      <TableCell>₹{total}</TableCell>
                      <TableCell>{pay.paidDate}</TableCell>
                      <TableCell>₹{pay.paidAmount}</TableCell>
                      <TableCell>₹{pay.interest}</TableCell>
                      <TableCell sx={{ color: balance === 0 ? "green" : "red", fontWeight: 600 }}>
                        ₹{balance}
                      </TableCell>
                      <TableCell>{pay.method}</TableCell>
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
          </Box>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* ================= SMALL HELPER ================= */
function Detail({ label, value }) {
  return (
    <div>
      <Typography variant="caption">{label}</Typography>
      <Typography fontWeight={500}>{value}</Typography>
    </div>
  );
}
