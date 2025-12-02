"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";

export default function PaymentPage() {
  const [openModal, setOpenModal] = useState(false);

  const [paymentData, setPaymentData] = useState({
    memberName: "",
    amount: "",
    date: "",
    mode: "",
    notes: "",
  });

  const [payments, setPayments] = useState([
    {
      id: 1,
      memberName: "Gireeshma",
      amount: "2000",
      date: "2025-12-01",
      mode: "Cash",
      notes: "Monthly payment",
    },
    {
      id: 2,
      memberName: "Sahana",
      amount: "1500",
      date: "2025-12-01",
      mode: "UPI",
      notes: "Pending clearance",
    },
  ]);

  const handleSavePayment = () => {
    setPayments((prev) => [
      ...prev,
      { ...paymentData, id: prev.length + 1 },
    ]);
    setOpenModal(false);

    setPaymentData({
      memberName: "",
      amount: "",
      date: "",
      mode: "",
      notes: "",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h5" fontWeight="600" className="text-black">
              Payment Tracking & Billing
            </Typography>

            <Button variant="contained" onClick={() => setOpenModal(true)}>
              Add Payment
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>S.No</strong></TableCell>
                    <TableCell><strong>Member</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Mode</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {payments.map((p, index) => (
                    <TableRow key={p.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{p.memberName}</TableCell>
                      <TableCell>₹{p.amount}</TableCell>
                      <TableCell>{p.date}</TableCell>
                      <TableCell>{p.mode}</TableCell>
                      <TableCell>{p.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Payment Modal */}
          <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
            <DialogTitle className="text-xl font-semibold">Add Payment</DialogTitle>

            <DialogContent className="space-y-4 py-4">

              {/* MEMBER NAME */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Member Name</label>
                <TextField
                  fullWidth
                  value={paymentData.memberName}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, memberName: e.target.value })
                  }
                />
              </div>

              {/* AMOUNT */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Amount</label>
                <TextField
                  fullWidth
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: e.target.value })
                  }
                />
              </div>

              {/* DATE */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Payment Date</label>
                <TextField
                  fullWidth
                  type="date"
                  value={paymentData.date}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, date: e.target.value })
                  }
                />
              </div>

              {/* PAYMENT MODE */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Payment Mode</label>
                <TextField
                  fullWidth
                  select
                  value={paymentData.mode}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, mode: e.target.value })
                  }
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </TextField>
              </div>

              {/* NOTES */}
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Notes</label>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, notes: e.target.value })
                  }
                />
              </div>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSavePayment}>
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
