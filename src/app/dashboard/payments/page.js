"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  InputLabel,
  FormControl,
  Select,
} from "@mui/material";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";

/* ================= CHITS ================= */
const CHITS = [
  { id: "CHT-001", name: "Silver Chit" },
  { id: "CHT-002", name: "Gold Chit" },
  { id: "CHT-003", name: "Starter Chit" },
];

/* ================= MEMBERS ================= */
const MEMBERS = [
  { id: 1, name: "Gireeshma Reddy", phone: "9876501234", chit: "Silver Chit" },
  { id: 2, name: "Lavanya P", phone: "9123987654", chit: "Silver Chit" },

  { id: 3, name: "Sahana R", phone: "9900123456", chit: "Gold Chit" },
  { id: 4, name: "Manoj Shetty", phone: "9001237890", chit: "Gold Chit" },

  { id: 5, name: "Kiran Kumar", phone: "9988776655", chit: "Starter Chit" },
];

export default function PaymentsPage() {
  const router = useRouter();

  const [selectedChit, setSelectedChit] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);

  const [payments, setPayments] = useState([]);

  const [form, setForm] = useState({
    month: "",
    amount: "",
    method: "",
    status: "Paid",
  });

  /* ================= MEMBERS FILTER ================= */
  const members = selectedChit
    ? MEMBERS.filter((m) => m.chit === selectedChit)
    : MEMBERS;

  /* ================= PAYMENTS FILTER ================= */
  const filteredPayments = selectedChit
    ? payments.filter((p) => p.chit === selectedChit)
    : payments;

  /* ================= OPEN FORM ================= */
  const openPaymentForm = (member) => {
    setSelectedMember(member);
    setForm({
      month: "",
      amount: "",
      method: "",
      status: "Paid",
    });
    setOpenModal(true);
  };

  /* ================= SAVE ================= */
  const savePayment = () => {
    if (!selectedMember || !form.month || !form.amount || !form.method) return;

    setPayments((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        chit: selectedMember.chit,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        phone: selectedMember.phone,
        month: form.month,
        amount: form.amount,
        method: form.method,
        status: form.status,
      },
    ]);

    setOpenModal(false);
  };

  /* ================= DELETE ================= */
  const deletePayment = (id) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6 space-y-6">

          {/* HEADER */}
          <Typography variant="h4" fontWeight={600} color="black" textAlign={"center"}>
            Payment Management
          </Typography>

          {/* CHIT SELECT */}
          <Card>
            <CardContent>
              <FormControl sx={{ minWidth: 260 }}>
                <InputLabel>Select Chit</InputLabel>
                <Select
                  label="Select Chit"
                  value={selectedChit}
                  onChange={(e) => setSelectedChit(e.target.value)}
                >
                  {CHITS.map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>

          {/* MEMBERS TABLE */}
          <Card>
            <CardContent>

              <Typography mb={2} fontWeight={600}>
                Members ({members.length})
                {selectedChit && ` — ${selectedChit}`}
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><b>Name</b></TableCell>
                    <TableCell><b>Phone</b></TableCell>
                    <TableCell><b>Chit</b></TableCell>
                    <TableCell align="center"><b>Action</b></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.phone}</TableCell>
                      <TableCell>{m.chit}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openPaymentForm(m)}
                        >
                          Add Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

            </CardContent>
          </Card>

          {/* PAYMENT HISTORY */}
          {filteredPayments.length > 0 && (
            <Card>
              <CardContent>

                <Typography mb={2} fontWeight={600}>
                  Payment History
                </Typography>

                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell>Month</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>

                    {filteredPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.memberName}</TableCell>
                        <TableCell>{p.month}</TableCell>
                        <TableCell>₹{p.amount}</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell>{p.status}</TableCell>
                        <TableCell>

                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1 }}
                            onClick={() =>
                              router.push(`/dashboard/members/${p.memberId}`)
                            }
                          >
                            View Member
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => deletePayment(p.id)}
                          >
                            Delete
                          </Button>

                        </TableCell>
                      </TableRow>
                    ))}

                  </TableBody>
                </Table>

              </CardContent>
            </Card>
          )}

        </main>
      </div>

      {/* ADD PAYMENT MODAL */}
      <Dialog open={openModal} fullWidth onClose={() => setOpenModal(false)}>

        <DialogTitle>
          Add Payment — {selectedMember?.name}
        </DialogTitle>

        <DialogContent>

          <TextField
            type="month"
            fullWidth
            sx={{ mb: 3 }}
            label="Payment Month"
            InputLabelProps={{ shrink: true }}
            value={form.month}
            onChange={(e) =>
              setForm({ ...form, month: e.target.value })
            }
          />

          <TextField
            type="number"
            fullWidth
            sx={{ mb: 3 }}
            label="Amount"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              label="Payment Method"
              value={form.method}
              onChange={(e) =>
                setForm({ ...form, method: e.target.value })
              }
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              <MenuItem value="Debit Card">Debit Card</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={form.status}
              label="Status"
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </FormControl>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>
            Cancel
          </Button>

          <Button variant="contained" onClick={savePayment}>
            Save Payment
          </Button>
        </DialogActions>

      </Dialog>

    </div>
  );
}
