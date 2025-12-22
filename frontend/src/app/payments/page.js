"use client";

import { useEffect, useState } from "react";
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

import { apiRequest } from "@/config/api";

export default function PaymentsPage() {
  /* ================= STATE ================= */

  const [payments, setPayments] = useState([]);
  const [chits, setChits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    chitId: "",
    memberId: "",
    phone: "",
    location: "",
    paymentMonth: "",
    paymentYear: "",
    paidAmount: "",
    penaltyAmount: "",
    paymentMode: "",
  });

  /* ================= FETCH PAYMENTS ================= */

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/payment/list", "GET");
      setPayments(res?.data?.payments || []);
    } catch (err) {
      console.error("Error fetching payments", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH CHITS ================= */

  const fetchChits = async () => {
    try {
      const res = await apiRequest("/chit/list", "GET");
      setChits(res?.data?.chits || []);
    } catch (err) {
      console.error("Error fetching chits", err);
      setChits([]);
    }
  };

  /* ================= FETCH MEMBERS BY CHIT ================= */

  const fetchMembersByChit = async (chitId) => {
    if (!chitId) return;

    try {
      const res = await apiRequest(`/chit/details/${chitId}`, "GET");

      // ✅ based on your API response
      setMembers(res?.data?.members || []);
    } catch (err) {
      console.error("Error fetching members", err);
      setMembers([]);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchChits();
  }, []);

  /* ================= SAVE PAYMENT ================= */

  const savePayment = async () => {
    try {
      const payload = {
        chitId: form.chitId,
        memberId: form.memberId,
        paymentMonth: form.paymentMonth,
        paymentYear: form.paymentYear,
        paidAmount: Number(form.paidAmount),
        penaltyAmount: Number(form.penaltyAmount || 0),
        paymentMode: form.paymentMode,
      };

      await apiRequest("/payment/add", "POST", payload);

      setOpenModal(false);
      setForm({
        chitId: "",
        memberId: "",
        phone: "",
        location: "",
        paymentMonth: "",
        paymentYear: "",
        paidAmount: "",
        penaltyAmount: "",
        paymentMode: "",
      });

      fetchPayments();
    } catch (err) {
      console.error("Error saving payment", err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: 24 }}>
      <div className="max-w-[1300px] mx-auto space-y-6">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center">
          <Typography
            fontWeight={600}
            sx={{ fontSize: { xs: "1.25rem", md: "1.75rem" } }}
          >
            Payment Management
          </Typography>

          <Button variant="contained" onClick={() => setOpenModal(true)}>
            Add Payment
          </Button>
        </div>

        {/* ================= PAYMENTS TABLE ================= */}
        <Card>
          <CardContent>
            <Typography mb={2} fontWeight={600}>
              Payments ({payments.length})
            </Typography>

            <div className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Chit</TableCell>
                    <TableCell>Month</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Penalty</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Mode</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        Loading payments...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        No payments found
                      </TableCell>
                    </TableRow>
                  )}

                  {payments.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>{p.invoiceNumber}</TableCell>
                      <TableCell>{p.memberId?.name || "-"}</TableCell>
                      <TableCell>{p.memberId?.phone || "-"}</TableCell>
                      <TableCell>{p.chitId?.chitName || "-"}</TableCell>
                      <TableCell>{p.paymentMonth}</TableCell>
                      <TableCell>₹{p.paidAmount}</TableCell>
                      <TableCell>₹{p.penaltyAmount}</TableCell>
                      <TableCell>₹{p.totalPaid}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>{p.paymentMode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ================= ADD PAYMENT MODAL ================= */}
        <Dialog open={openModal} fullWidth maxWidth="sm">
          <DialogTitle>Add Payment</DialogTitle>

          <DialogContent>
            {/* 🔹 CHIT DROPDOWN */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Chit</InputLabel>
              <Select
                label="Select Chit"
                value={form.chitId || ""}
                onChange={(e) => {
                  const chitId = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    chitId,
                    memberId: "",
                    phone: "",
                    location: "",
                  }));
                  fetchMembersByChit(chitId);
                }}
              >
                {chits.map((chit) => (
                  <MenuItem key={chit._id} value={chit._id}>
                    {chit.chitName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 🔹 MEMBER DROPDOWN */}
            <FormControl fullWidth sx={{ mb: 2 }} disabled={!members.length}>
              <InputLabel>Select Member</InputLabel>
              <Select
                label="Select Member"
                value={form.memberId || ""}
                onChange={(e) => {
                  const member = members.find(
                    (m) => m._id === e.target.value
                  );

                  setForm((prev) => ({
                    ...prev,
                    memberId: member?._id || "",
                    phone: member?.phone || "",
                    location: member?.address || "",
                  }));
                }}
              >
                {members.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 🔹 AUTO-FILLED FIELDS */}
            <TextField
              fullWidth
              label="Phone"
              value={form.phone || ""}
              disabled
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Location"
              value={form.location || ""}
              disabled
              sx={{ mb: 2 }}
            />

            <TextField
              type="month"
              fullWidth
              label="Payment Month"
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              value={
                form.paymentYear && form.paymentMonth
                  ? `${form.paymentYear}-${form.paymentMonth}`
                  : ""
              }
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                setForm((prev) => ({
                  ...prev,
                  paymentYear: year,
                  paymentMonth: month,
                }));
              }}
            />

            <TextField
              fullWidth
              label="Paid Amount"
              type="number"
              sx={{ mb: 2 }}
              value={form.paidAmount || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  paidAmount: e.target.value,
                }))
              }
            />

            <TextField
              fullWidth
              label="Penalty Amount"
              type="number"
              sx={{ mb: 2 }}
              value={form.penaltyAmount || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  penaltyAmount: e.target.value,
                }))
              }
            />

            <FormControl fullWidth>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                label="Payment Mode"
                value={form.paymentMode || ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMode: e.target.value,
                  }))
                }
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="bank">Bank Transfer</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={savePayment}>
              Save Payment
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
