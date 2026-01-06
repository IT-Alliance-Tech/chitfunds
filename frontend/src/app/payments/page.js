"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { apiRequest } from "@/config/api";

const getStatusColor = (status) => {
  const s = status?.toLowerCase();
  if (["active", "paid", "success"].includes(s))
    return { bg: "#dcfce7", text: "#166534" }; // Green
  if (["inactive", "overdue", "closed", "failed", "pending"].includes(s))
    return { bg: "#fee2e2", text: "#991b1b" }; // Red
  if (["partial"].includes(s)) return { bg: "#fef3c7", text: "#92400e" }; // Orange/Amber
  return { bg: "#f1f5f9", text: "#475569" }; // Default Gray
};

const tableHeaderSx = {
  backgroundColor: "#e2e8f0",
  "& th": {
    fontWeight: 700,
    fontSize: "12px",
    color: "#1e293b",
    textTransform: "uppercase",
    py: 1.5,
    borderBottom: "1px solid #cbd5e1",
  },
};

const StatusPill = ({ status }) => {
  const { bg, text } = getStatusColor(status);
  return (
    <Box
      sx={{
        display: "inline-block",
        px: 1.5,
        py: 0.5,
        borderRadius: "12px",
        backgroundColor: bg,
        color: text,
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        textAlign: "center",
        minWidth: "70px",
      }}
    >
      {status}
    </Box>
  );
};

const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [chits, setChits] = useState([]);
  const [filterMembers, setFilterMembers] = useState([]);
  const [filters, setFilters] = useState({
    chitId: "",
    memberId: "",
    paymentMode: "",
    status: "",
  });

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const initialFormState = {
    memberId: "",
    chitId: "",
    paidAmount: "",
    penaltyAmount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "cash",
    paymentMonth: new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    }),
  };
  const [form, setForm] = useState(initialFormState);

  // View Modal
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Preview Modal
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchPayments();
    fetchChits();
  }, [filters]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(filters).toString();
      const res = await apiRequest(`/payment/list?${q}`);
      const list = res?.data?.items || res?.data?.payments || res?.data || [];
      const total = res?.data?.pagination?.totalItems || res?.data?.total || 0;
      setPayments(list);
      setTotalCount(total);
    } catch (err) {
      console.error(err);
      setPayments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchChits = async () => {
    try {
      const res = await apiRequest("/chit/list?limit=100");
      const list = res.data.items || res.data.chits || res.data || [];
      setChits(
        list.map((c) => ({
          id: c._id || c.id,
          chitName: c.chitName,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFilterMembers = async (chitId) => {
    if (!chitId) {
      setFilterMembers([]);
      return;
    }
    try {
      const res = await apiRequest(`/chit/${chitId}`);
      setFilterMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async (chitId) => {
    if (!chitId) return;
    try {
      const res = await apiRequest(`/chit/${chitId}`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
    }
  };

  const resetFilters = () => {
    setFilters({
      chitId: "",
      memberId: "",
      paymentMode: "",
      status: "",
    });
    setFilterMembers([]);
  };

  const handleCreatePayment = async () => {
    if (!form.memberId || !form.chitId || !form.paidAmount) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "warning",
      });
      return;
    }

    setPaymentLoading(true);
    try {
      await apiRequest("/payment/create", "POST", form);
      setSnackbar({
        open: true,
        message: "Payment recorded successfully",
        severity: "success",
      });
      setOpenModal(false);
      setOpenPreviewModal(false);
      fetchPayments();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to record payment",
        severity: "error",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleExportPDF = async (id) => {
    try {
      const response = await apiRequest(`/payment/invoice/${id}`, "GET", null, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export PDF",
        severity: "error",
      });
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
            alignItems: "center",
            mb: 4,
            gap: 2,
            position: "relative",
          }}
        >
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              textAlign: "center",
              color: "#1e293b",
              fontSize: { xs: "1.75rem", sm: "2.25rem" },
              textTransform: "capitalize",
            }}
          >
            Payment Management
          </Typography>
          <Box
            sx={{
              position: { sm: "absolute" },
              right: { sm: 0 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: "#2563eb",
                borderRadius: "8px",
                padding: "10px 24px",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.05em",
                "&:hover": { backgroundColor: "#1d4ed8" },
              }}
              onClick={() => {
                setForm(initialFormState);
                setMembers([]);
                setOpenModal(true);
              }}
            >
              ADD PAYMENT
            </Button>
          </Box>
        </Box>

        {/* FILTERS */}
        <Card
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            backgroundColor: "white",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                fontWeight={700}
                sx={{ color: "#1e293b", fontSize: "1.1rem" }}
              >
                Filters
              </Typography>
              <Typography
                sx={{
                  cursor: "pointer",
                  color: "#2563eb",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={resetFilters}
              >
                Reset Filters
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 2.5,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel
                  shrink
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#475569",
                    mb: 0.5,
                    position: "static",
                    transform: "none",
                  }}
                >
                  CHIT NAME
                </InputLabel>
                <Select
                  value={filters.chitId}
                  displayEmpty
                  sx={{
                    borderRadius: "8px",
                    mt: 0.5,
                    backgroundColor: "#f8fafc",
                  }}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setFilters((p) => ({
                      ...p,
                      chitId: cid,
                      memberId: "",
                    }));
                    fetchFilterMembers(cid);
                  }}
                >
                  <MenuItem value="">All Chits</MenuItem>
                  {chits.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.chitName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel
                  shrink
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#475569",
                    mb: 0.5,
                    position: "static",
                    transform: "none",
                  }}
                >
                  MEMBER
                </InputLabel>
                <Select
                  value={filters.memberId}
                  displayEmpty
                  sx={{
                    borderRadius: "8px",
                    mt: 0.5,
                    backgroundColor: "#f8fafc",
                  }}
                  disabled={!filters.chitId}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, memberId: e.target.value }))
                  }
                >
                  <MenuItem value="">
                    {!filters.chitId ? "Select Chit First" : "All Members"}
                  </MenuItem>
                  {filterMembers.map((m) => (
                    <MenuItem key={m._id} value={m._id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel
                  shrink
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#475569",
                    mb: 0.5,
                    position: "static",
                    transform: "none",
                  }}
                >
                  PAYMENT MODE
                </InputLabel>
                <Select
                  value={filters.paymentMode}
                  displayEmpty
                  sx={{
                    borderRadius: "8px",
                    mt: 0.5,
                    backgroundColor: "#f8fafc",
                  }}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, paymentMode: e.target.value }))
                  }
                >
                  <MenuItem value="">All Modes</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel
                  shrink
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#475569",
                    mb: 0.5,
                    position: "static",
                    transform: "none",
                  }}
                >
                  STATUS
                </InputLabel>
                <Select
                  value={filters.status}
                  displayEmpty
                  sx={{
                    borderRadius: "8px",
                    mt: 0.5,
                    backgroundColor: "#f8fafc",
                  }}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, status: e.target.value }))
                  }
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography
              variant="body2"
              sx={{
                mt: 3,
                color: "#64748b",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              Showing {payments.length} of {totalCount} payments
            </Typography>
          </CardContent>
        </Card>

        {/* PAYMENT LIST */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            backgroundColor: "white",
          }}
        >
          <CardContent className="p-0">
            <Typography
              fontWeight={700}
              sx={{ p: 2, color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}
            >
              Payments History
            </Typography>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <Table size="small">
                <TableHead sx={tableHeaderSx}>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Chit</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Penalty</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Mode</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
                        align="center"
                        sx={{ py: 8, color: "#94a3b8" }}
                      >
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow
                        key={p._id}
                        sx={{
                          "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                          "&:hover": { backgroundColor: "#f1f5f9" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                          {p.invoiceNumber || "-"}
                        </TableCell>
                        <TableCell sx={{ color: "#475569", fontWeight: 500 }}>
                          {p.chitId?.chitName || "-"}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                          {p.memberId?.name || "-"}
                        </TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "12px" }}>
                          {p.memberId?.phone || "-"}
                        </TableCell>
                        <TableCell
                          sx={{ color: "#64748b", whiteSpace: "nowrap" }}
                        >
                          {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: "#16a34a", fontWeight: 600 }}
                        >
                          ₹{p.paidAmount?.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#dc2626" }}>
                          ₹{p.penaltyAmount?.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 700, color: "#1e293b" }}
                        >
                          ₹
                          {(
                            p.totalPaid ??
                            Number(p.paidAmount || 0) +
                              Number(p.penaltyAmount || 0)
                          ).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            textTransform: "capitalize",
                            color: "#64748b",
                            fontWeight: 500,
                          }}
                        >
                          {p.paymentMode}
                        </TableCell>
                        <TableCell align="center">
                          <StatusPill status={p.status || "pending"} />
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: "10px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                borderColor: "#cbd5e1",
                                color: "#64748b",
                                "&:hover": {
                                  borderColor: "#2563eb",
                                  color: "#2563eb",
                                },
                              }}
                              onClick={() => {
                                setSelectedPayment(p);
                                setOpenViewModal(true);
                              }}
                            >
                              VIEW
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: "10px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                borderColor: "#cbd5e1",
                                color: "#64748b",
                                "&:hover": {
                                  borderColor: "#2563eb",
                                  color: "#2563eb",
                                },
                              }}
                              onClick={() => handleExportPDF(p._id)}
                            >
                              PDF
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Box>

      {/* ADD PAYMENT MODAL */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.25rem", pb: 1 }}>
          Record New Payment
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Select Chit</InputLabel>
              <Select
                label="Select Chit"
                value={form.chitId}
                onChange={(e) => {
                  setForm({ ...form, chitId: e.target.value, memberId: "" });
                  fetchMembers(e.target.value);
                }}
              >
                {chits.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.chitName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!form.chitId}>
              <InputLabel>Select Member</InputLabel>
              <Select
                label="Select Member"
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              >
                {members.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Paid Amount"
                  type="number"
                  value={form.paidAmount}
                  onChange={(e) =>
                    setForm({ ...form, paidAmount: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Penalty (Optional)"
                  type="number"
                  value={form.penaltyAmount}
                  onChange={(e) =>
                    setForm({ ...form, penaltyAmount: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Payment Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.paymentDate}
              onChange={(e) =>
                setForm({ ...form, paymentDate: e.target.value })
              }
            />

            <TextField
              fullWidth
              label="Payment Month"
              value={form.paymentMonth}
              onChange={(e) =>
                setForm({ ...form, paymentMonth: e.target.value })
              }
              placeholder="e.g. January 2026"
            />

            <FormControl fullWidth>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                label="Payment Mode"
                value={form.paymentMode}
                onChange={(e) =>
                  setForm({ ...form, paymentMode: e.target.value })
                }
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ fontWeight: 700, color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const selectedMemberName = members.find(
                (m) => m._id === form.memberId
              )?.name;
              const selectedChitName = chits.find(
                (c) => c.id === form.chitId
              )?.chitName;
              setPreviewData({
                ...form,
                memberName: selectedMemberName,
                chitName: selectedChitName,
              });
              setOpenPreviewModal(true);
            }}
            sx={{
              backgroundColor: "#2563eb",
              borderRadius: "8px",
              fontWeight: 700,
              px: 3,
            }}
          >
            Preview Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* VIEW PAYMENT MODAL */}
      <Dialog
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle
          sx={{ fontWeight: 800, borderBottom: "1px solid #f1f5f9" }}
        >
          Payment Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedPayment && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  INVOICE NUMBER
                </Typography>
                <Typography fontWeight={600} color="#1e293b">
                  {selectedPayment.invoiceNumber}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  CHIT NAME
                </Typography>
                <Typography fontWeight={600} color="#1e293b">
                  {selectedPayment.chitId?.chitName}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  MEMBER NAME
                </Typography>
                <Typography fontWeight={600} color="#1e293b">
                  {selectedPayment.memberId?.name}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                  >
                    AMOUNT PAID
                  </Typography>
                  <Typography fontWeight={700} color="#16a34a">
                    ₹{selectedPayment.paidAmount?.toLocaleString("en-IN")}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                  >
                    PENALTY
                  </Typography>
                  <Typography fontWeight={700} color="#dc2626">
                    ₹{selectedPayment.penaltyAmount?.toLocaleString("en-IN")}
                  </Typography>
                </Grid>
              </Grid>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  PAYMENT DATE
                </Typography>
                <Typography fontWeight={600} color="#1e293b">
                  {new Date(selectedPayment.paymentDate).toLocaleDateString(
                    "en-IN"
                  )}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #f1f5f9" }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => setOpenViewModal(false)}
            sx={{
              backgroundColor: "#1e293b",
              borderRadius: "8px",
              fontWeight: 700,
              "&:hover": { backgroundColor: "#0f172a" },
            }}
          >
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>

      {/* PREVIEW CONFIRM MODAL */}
      <Dialog
        open={openPreviewModal}
        onClose={() => setOpenPreviewModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Payment</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              backgroundColor: "#f8fafc",
              p: 2,
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Member:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#1e293b">
                {previewData?.memberName}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Chit:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#1e293b">
                {previewData?.chitName}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Amount:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#16a34a">
                ₹{Number(previewData?.paidAmount).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Penalty:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#dc2626">
                ₹{Number(previewData?.penaltyAmount || 0).toLocaleString()}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body1" fontWeight={800}>
                Total:
              </Typography>
              <Typography variant="body1" fontWeight={800} color="#1e293b">
                ₹
                {(
                  Number(previewData?.paidAmount || 0) +
                  Number(previewData?.penaltyAmount || 0)
                ).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setOpenPreviewModal(false)}
            sx={{ fontWeight: 700, color: "#64748b" }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            disabled={paymentLoading}
            onClick={handleCreatePayment}
            sx={{
              backgroundColor: "#16a34a",
              "&:hover": { backgroundColor: "#15803d" },
              borderRadius: "8px",
              fontWeight: 700,
              px: 4,
            }}
          >
            {paymentLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "CONFIRM & SAVE"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ borderRadius: "12px", fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PaymentsPage;
