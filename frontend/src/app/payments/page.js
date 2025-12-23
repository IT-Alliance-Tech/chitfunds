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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  useMediaQuery,
} from "@mui/material";

import { apiRequest } from "@/config/api";

/* ================= INITIAL FORM STATE ================= */
const initialFormState = {
  chitId: "",
  memberId: "",
  phone: "",
  location: "",
  paymentMonth: "",
  paymentYear: "",
  paidAmount: "",
  penaltyAmount: "",
  paymentMode: "",
  dueDate: "",
  paymentDate: "",
};

export default function PaymentsPage() {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [payments, setPayments] = useState([]);
  const [chits, setChits] = useState([]);
  const [members, setMembers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(initialFormState);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ================= FETCH PAYMENTS ================= */
  const fetchPayments = async () => {
    const res = await apiRequest("/payment/list");
    setPayments(res?.data?.payments || []);
  };

  /* ================= FETCH CHITS ================= */
  const fetchChits = async () => {
    const res = await apiRequest("/chit/list");
    setChits(res?.data?.chits || []);
  };

  /* ================= FETCH MEMBERS ================= */
  const fetchMembersByChit = async (chitId) => {
    if (!chitId) return;
    try {
      const res = await apiRequest(`/chit/details/${chitId}`);
      setMembers(res?.data?.members || []);
    } catch {
      setMembers([]);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchChits();
  }, []);

  /* ================= SAVE PAYMENT ================= */
  const savePayment = async () => {
    const payload = {
      chitId: form.chitId,
      memberId: form.memberId,
      paidAmount: Number(form.paidAmount),
      penaltyAmount: Number(form.penaltyAmount || 0),
      paymentMonth: form.paymentMonth,
      paymentYear: Number(form.paymentYear),
      dueDate: form.dueDate,
      paymentDate: form.paymentDate,
      paymentMode: form.paymentMode,
    };

    await apiRequest("/payment/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setOpenModal(false);
    setForm(initialFormState);
    setMembers([]);
    fetchPayments();
  };

  const paginatedPayments = payments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: 24 }}>
      <div className="max-w-[1300px] mx-auto space-y-6">

        {/* ================= HEADER ================= */}
      <div
  style={{
    position: "relative",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  }}
>
  {/* Heading */}
  <Typography
    fontWeight={600}
    sx={{
      fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
      color: "#000",
      textAlign: "center",
    }}
  >
    Payment Management
  </Typography>

  {/* Add Payment Button */}
  <Button
    variant="contained"
    sx={{
      position: { xs: "static", md: "absolute" }, // 👈 mobile vs desktop
      right: { md: 0 },
      top: { md: "50%" },
      transform: { md: "translateY(-50%)" },
    }}
    onClick={() => {
      setForm(initialFormState);
      setMembers([]);
      setOpenModal(true);
    }}
  >
    Add Payment
  </Button>
</div>


        {/* ================= PAYMENT LIST ================= */}
        <Card>
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Payments List
            </Typography>

            {/* Responsive table wrapper */}
            <div style={{ width: "100%", overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      "Invoice",
                      "Chit",
                      "Member",
                      "Phone",
                      "Date",
                      "Paid",
                      "Penalty",
                      "Total",
                      "Mode",
                      "Status",
                    ].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPayments.map((p) => (
                      <TableRow key={p._id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {p.invoiceNumber || "-"}
                        </TableCell>
                        <TableCell>{p.chitId?.chitName || "-"}</TableCell>
                        <TableCell>{p.memberId?.name || "-"}</TableCell>
                        <TableCell>{p.memberId?.phone || "-"}</TableCell>
                        <TableCell>
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>₹{p.paidAmount}</TableCell>
                        <TableCell>₹{p.penaltyAmount}</TableCell>
                        <TableCell>₹{p.totalPaid}</TableCell>
                        <TableCell>{p.paymentMode}</TableCell>
                        <TableCell>{p.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {payments.length > 0 && (
              <TablePagination
                component="div"
                count={payments.length}
                page={page}
                onPageChange={(e, n) => setPage(n)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) =>
                  setRowsPerPage(parseInt(e.target.value, 10))
                }
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{
                  mt: 2,
                  "& .MuiTablePagination-toolbar": {
                    flexWrap: "wrap",
                    justifyContent: "center",
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* ================= ADD PAYMENT MODAL ================= */}
        <Dialog
          open={openModal}
          fullWidth
          maxWidth="sm"
          fullScreen={isMobile}   // ✅ ONLY mobile
        >
          <DialogTitle>Add Payment</DialogTitle>

          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Select Chit</InputLabel>
              <Select
                label="Select Chit"
                value={form.chitId}
                onChange={(e) => {
                  const chitId = e.target.value;
                  setForm((p) => ({
                    ...p,
                    chitId,
                    memberId: "",
                    phone: "",
                    location: "",
                  }));
                  fetchMembersByChit(chitId);
                }}
              >
                {chits.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.chitName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!members.length}>
              <InputLabel>Select Member</InputLabel>
              <Select
                label="Select Member"
                value={form.memberId}
                onChange={(e) => {
                  const m = members.find((x) => x._id === e.target.value);
                  setForm((p) => ({
                    ...p,
                    memberId: m._id,
                    phone: m.phone,
                    location: m.address,
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

            <TextField label="Phone" value={form.phone} disabled />
            <TextField label="Location" value={form.location} disabled />

            <TextField
              type="month"
              label="Payment Month"
              InputLabelProps={{ shrink: true }}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                setForm((p) => ({
                  ...p,
                  paymentYear: year,
                  paymentMonth: `${year}-${month}`,
                }));
              }}
            />

            <TextField
              type="date"
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              onChange={(e) =>
                setForm((p) => ({ ...p, dueDate: e.target.value }))
              }
            />

            <TextField
              type="date"
              label="Payment Date"
              InputLabelProps={{ shrink: true }}
              onChange={(e) =>
                setForm((p) => ({ ...p, paymentDate: e.target.value }))
              }
            />

            <TextField
              label="Paid Amount"
              type="number"
              onChange={(e) =>
                setForm((p) => ({ ...p, paidAmount: e.target.value }))
              }
            />

            <TextField
              label="Penalty Amount"
              type="number"
              onChange={(e) =>
                setForm((p) => ({ ...p, penaltyAmount: e.target.value }))
              }
            />

            <FormControl fullWidth>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                label="Payment Mode"
                value={form.paymentMode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paymentMode: e.target.value }))
                }
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
                <MenuItem value="bank">Bank</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions
            sx={{
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              px: 3,
              pb: 2,
            }}
          >
            <Button
              onClick={() => {
                setOpenModal(false);
                setForm(initialFormState);
                setMembers([]);
              }}
            >
              Cancel
            </Button>
            <Button variant="contained" onClick={savePayment}>
              Save Payment
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}
