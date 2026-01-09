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
import FileDownloadIcon from "@mui/icons-material/FileDownload";
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
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "cash",
    paymentMonth: new Date().toISOString().slice(0, 7),
    location: "",
    dueDay: "",
    dueDate: "",
    monthlyPayableAmount: 0,
    totalAssignedSlots: 1,
    sendEmail: false,
    slotDetails: [], // Array of { slotNumber, paidAmount, interestAmount, penaltyAmount, paymentMode, paymentDate, paymentMonth, isPaid }
  };
  const [form, setForm] = useState(initialFormState);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [fetchingStatus, setFetchingStatus] = useState(false);

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

  useEffect(() => {
    if (form.paymentMonth && form.dueDay) {
      const [year, month] = form.paymentMonth.split("-");
      const day = String(form.dueDay).padStart(2, "0");
      const calculatedDate = `${year}-${month}-${day}`;
      setForm((prev) => ({ ...prev, dueDate: calculatedDate }));
    }
  }, [form.paymentMonth, form.dueDay]);

  useEffect(() => {
    if (form.chitId && form.memberId && form.paymentMonth) {
      fetchPaymentStatus(form.chitId, form.memberId, form.paymentMonth);
    }
  }, [form.chitId, form.memberId, form.paymentMonth]);

  const fetchPaymentStatus = async (chitId, memberId, month) => {
    setFetchingStatus(true);
    try {
      const res = await apiRequest(
        `/payment/status?chitId=${chitId}&memberId=${memberId}&paymentMonth=${month}`
      );
      const data = res.data;
      setPaymentStatus(data);

      const totalSlots = data.totalSlots || 1;
      const paidSlotNumbers = data.paidSlotNumbers || [];

      // Build slot details array
      const details = [];
      for (let i = 1; i <= totalSlots; i++) {
        const isPaid = paidSlotNumbers.includes(i);
        const prevPay = data.previousPayments?.find((p) => p.slotNumber === i);

        details.push({
          slotNumber: i,
          paidAmount: isPaid
            ? prevPay.paidAmount || 0
            : data.monthlyAmount || 0,
          interestAmount: isPaid ? prevPay.interestAmount || 0 : 0,
          penaltyAmount: isPaid ? prevPay.penaltyAmount || 0 : 0,
          paymentMode: isPaid
            ? prevPay.paymentMode || "cash"
            : form.paymentMode || "cash",
          paymentDate: isPaid
            ? new Date(prevPay.paymentDate).toISOString().split("T")[0]
            : form.paymentDate,
          paymentMonth: isPaid ? prevPay.paymentMonth || month : month,
          interestPercent: isPaid ? prevPay.interestPercent || 0 : 0,
          isPaid: isPaid,
          selected: !isPaid,
        });
      }

      setForm((prev) => ({
        ...prev,
        totalAssignedSlots: totalSlots,
        slotDetails: details,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingStatus(false);
    }
  };

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
      const res = await apiRequest(`/chit/details/${chitId}`);
      setFilterMembers(res.data.members || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async (chitId) => {
    if (!chitId) return;
    try {
      const res = await apiRequest(`/chit/details/${chitId}`);
      const chitData = res.data.chit || {};
      setMembers(res.data.members || []);
      setForm((prev) => ({
        ...prev,
        location: chitData.location || "",
        dueDay: chitData.dueDate || "",
        dueDate: chitData.dueDate || "", // Initially just the day or empty
        monthlyPayableAmount: chitData.monthlyPayableAmount || 0,
        paidAmount: chitData.monthlyPayableAmount || "",
      }));
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
    if (!form.memberId || !form.chitId) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "warning",
      });
      return;
    }

    const unPaidSlotsToPay = form.slotDetails.filter(
      (s) => !s.isPaid && s.selected
    );

    if (unPaidSlotsToPay.length === 0) {
      setSnackbar({
        open: true,
        message: "Please select at least one unpaid slot to pay",
        severity: "info",
      });
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await apiRequest("/payment/create", "POST", {
        chitId: form.chitId,
        memberId: form.memberId,
        slotPayments: unPaidSlotsToPay.map((s) => ({
          ...s,
          sendEmail: form.sendEmail,
        })),
      });

      setSnackbar({
        open: true,
        message: "Payments recorded successfully",
        severity: "success",
      });
      setOpenModal(false);
      setOpenPreviewModal(false);
      fetchPayments();

      // Export PDF for the first one or all? Let's just refresh.
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

  const handleViewPayment = async (id) => {
    try {
      const res = await apiRequest(`/payment/details/${id}`);
      setSelectedPayment(res.data.payment);
      setOpenViewModal(true);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to fetch payment details",
        severity: "error",
      });
    }
  };

  const handleExportPDF = async (id) => {
    try {
      const response = await apiRequest(`/payment/invoice/${id}`, "GET", null, {
        responseType: "blob",
      });
      const blob = new Blob([response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export PDF",
        severity: "error",
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const q = new URLSearchParams(filters).toString();
      const response = await apiRequest(
        `/payment/export/excel?${q}`,
        "GET",
        null,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Payments_Report_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSnackbar({
        open: true,
        message: "Excel report exported successfully",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to export Excel report",
        severity: "error",
      });
    }
  };

  return (
    <Box
      className="mobile-page-padding"
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
                padding: "8px 24px",
                textTransform: "uppercase",
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "0.02em",
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
          className="filter-card-mobile"
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
          <CardContent className="p-0 table-container-mobile">
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
                    <TableCell>ID</TableCell>
                    <TableCell>Chit</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell align="center">Slots</TableCell>
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
                          {p.paymentId || p.invoiceNumber || "-"}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: "#475569",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.chitId?.chitName || "-"}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 600,
                            color: "#1e293b",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.memberId?.name || "-"}
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: 700, color: "#475569" }}
                        >
                          {p.slots || 1}
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
                              onClick={() => handleViewPayment(p._id || p.id)}
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
          <Box
            sx={{
              mt: 1.5,
              mb: 1,
              p: 1.5,
              backgroundColor: "#fff7ed",
              borderRadius: "10px",
              border: "1px solid #ffedd5",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 5,
                height: 40,
                backgroundColor: "#ea580c",
                borderRadius: "4px",
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "#9a3412",
                fontWeight: 600,
                fontSize: "0.85rem",
                lineHeight: 1.4,
              }}
            >
              Note: You must select a specific chit fund first to view and
              access member details and payment calculations.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
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

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Location"
                  value={form.location || "-"}
                  InputProps={{ readOnly: true }}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Due Date"
                  value={
                    form.dueDate && String(form.dueDate).includes("-")
                      ? String(form.dueDate).split("-").reverse().join("/")
                      : form.dueDate || "-"
                  }
                  InputProps={{ readOnly: true }}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Monthly Amt"
                  value={form.monthlyPayableAmount || 0}
                  InputProps={{ readOnly: true }}
                  disabled
                />
              </Grid>
            </Grid>

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

            {/* SMART DUES BANNER */}
            {paymentStatus && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  backgroundColor: paymentStatus.isFullyPaid
                    ? "#dcfce7"
                    : "#fff7ed",
                  border: "1px solid",
                  borderColor: paymentStatus.isFullyPaid
                    ? "#86efac"
                    : "#fdba74",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={800}
                  color={paymentStatus.isFullyPaid ? "#166534" : "#9a3412"}
                >
                  {(() => {
                    const [year, month] = form.paymentMonth.split("-");
                    const monthName = new Date(
                      year,
                      parseInt(month) - 1
                    ).toLocaleString("default", { month: "long" });
                    return `Monthly Status: ${monthName} ${year}`;
                  })()}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={paymentStatus.isFullyPaid ? "#15803d" : "#c2410c"}
                >
                  {paymentStatus.isFullyPaid
                    ? `This member has fully cleared all ${paymentStatus.totalSlots} slots!`
                    : `Member has paid ${paymentStatus.paidSlots} out of ${paymentStatus.totalSlots} slots.`}
                </Typography>
                {!paymentStatus.isFullyPaid && (
                  <Typography
                    variant="caption"
                    color="#9a3412"
                    fontWeight={700}
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    BALANCE DUE: {paymentStatus.remainingSlots} Slots (₹
                    {(
                      paymentStatus.remainingSlots * paymentStatus.monthlyAmount
                    ).toLocaleString()}
                    )
                  </Typography>
                )}
              </Box>
            )}

            {/* PER-SLOT INPUTS */}
            {form.slotDetails.map((slot, index) => (
              <Box
                key={slot.slotNumber}
                sx={{
                  p: 2,
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  bgcolor: slot.isPaid ? "#f8fafc" : "#ffffff",
                  position: "relative",
                  opacity: slot.isPaid ? 0.8 : 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {!slot.isPaid && (
                      <input
                        type="checkbox"
                        checked={slot.selected}
                        onChange={(e) => {
                          const newDetails = [...form.slotDetails];
                          newDetails[index].selected = e.target.checked;
                          setForm({ ...form, slotDetails: newDetails });
                        }}
                        style={{ cursor: "pointer", width: 16, height: 16 }}
                      />
                    )}
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      color="#334155"
                    >
                      Slot {slot.slotNumber}
                    </Typography>
                  </Box>
                  {slot.isPaid && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: "10px",
                        bgcolor: "#dcfce7",
                        color: "#166534",
                        px: 1,
                        py: 0.2,
                        borderRadius: "4px",
                      }}
                    >
                      PAID
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Paid Amount"
                      type="number"
                      size="small"
                      disabled={slot.isPaid}
                      value={slot.paidAmount}
                      onChange={(e) => {
                        const newDetails = [...form.slotDetails];
                        newDetails[index].paidAmount = e.target.value;
                        setForm({ ...form, slotDetails: newDetails });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Interest (%)</InputLabel>
                      <Select
                        label="Interest (%)"
                        disabled={slot.isPaid}
                        value={slot.interestPercent || 0}
                        onChange={(e) => {
                          const percent = e.target.value;
                          const interest =
                            (Number(slot.paidAmount) * Number(percent)) / 100;
                          const newDetails = [...form.slotDetails];
                          newDetails[index].interestPercent = percent;
                          newDetails[index].interestAmount = interest;
                          setForm({ ...form, slotDetails: newDetails });
                        }}
                      >
                        <MenuItem value={0}>0%</MenuItem>
                        <MenuItem value={5}>5%</MenuItem>
                        <MenuItem value={10}>10%</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Penalty"
                      type="number"
                      size="small"
                      disabled={slot.isPaid}
                      value={slot.penaltyAmount}
                      onChange={(e) => {
                        const newDetails = [...form.slotDetails];
                        newDetails[index].penaltyAmount = e.target.value;
                        setForm({ ...form, slotDetails: newDetails });
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Mode</InputLabel>
                      <Select
                        label="Mode"
                        disabled={slot.isPaid}
                        value={slot.paymentMode}
                        onChange={(e) => {
                          const newDetails = [...form.slotDetails];
                          newDetails[index].paymentMode = e.target.value;
                          setForm({ ...form, slotDetails: newDetails });
                        }}
                      >
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="online">Online</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Date"
                      type="date"
                      size="small"
                      disabled={slot.isPaid}
                      InputLabelProps={{ shrink: true }}
                      value={slot.paymentDate}
                      onChange={(e) => {
                        const newDetails = [...form.slotDetails];
                        newDetails[index].paymentDate = e.target.value;
                        setForm({ ...form, slotDetails: newDetails });
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Month"
                      type="month"
                      size="small"
                      disabled={slot.isPaid}
                      InputLabelProps={{ shrink: true }}
                      value={slot.paymentMonth}
                      onChange={(e) => {
                        const newDetails = [...form.slotDetails];
                        newDetails[index].paymentMonth = e.target.value;
                        setForm({ ...form, slotDetails: newDetails });
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <input
                type="checkbox"
                id="sendEmail"
                checked={form.sendEmail}
                onChange={(e) =>
                  setForm({ ...form, sendEmail: e.target.checked })
                }
                style={{ cursor: "pointer", width: 18, height: 18 }}
              />
              <label
                htmlFor="sendEmail"
                style={{
                  fontWeight: 700,
                  color: "#475569",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Send Payment Invoice via Email
              </label>
            </Box>
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

              // Format month for preview (e.g. "January 2026")
              const [year, month] = form.paymentMonth.split("-");
              const monthName = new Date(
                year,
                parseInt(month) - 1
              ).toLocaleString("default", { month: "long" });
              const displayMonth = `${monthName} ${year}`;

              setPreviewData({
                ...form,
                memberName: selectedMemberName,
                chitName: selectedChitName,
                displayMonth: displayMonth,
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

      {/* VIEW PAYMENT MODAL (CLEANED UI) */}
      <Dialog
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
            Payment Receipt Details
          </Typography>
          <StatusPill status={selectedPayment?.status || "confirmed"} />
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedPayment && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* TOP HEADER: INVOICE & DATE */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  bgcolor: "#f1f5f9",
                  p: 2,
                  borderRadius: "12px",
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                  >
                    INVOICE NUMBER
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={800}
                    color="#2563eb"
                    sx={{ letterSpacing: "0.5px" }}
                  >
                    {selectedPayment.invoiceNumber}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                  >
                    PAYMENT DATE
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {new Date(selectedPayment.paymentDate).toLocaleDateString(
                      "en-IN"
                    )}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* CHIT DETAILS */}
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      height: "100%",
                      borderRight: { sm: "1px solid #e2e8f0" },
                      pr: { sm: 2 },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="#0369a1"
                      fontWeight={800}
                      gutterBottom
                      sx={{
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                      }}
                    >
                      Chit Information
                    </Typography>
                    <Box
                      sx={{
                        mt: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Chit Name
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {selectedPayment.chitId?.chitName}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Location
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedPayment.chitId?.location || "-"}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 3 }}>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            Amount
                          </Typography>
                          <Typography variant="body2" fontWeight={800}>
                            ₹
                            {selectedPayment.chitId?.amount?.toLocaleString(
                              "en-IN"
                            )}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            Duration
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedPayment.chitId?.duration} Months
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* MEMBER DETAILS */}
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="#b45309"
                      fontWeight={800}
                      gutterBottom
                      sx={{
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontSize: "11px",
                      }}
                    >
                      Member Information
                    </Typography>
                    <Box
                      sx={{
                        mt: 1.5,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Full Name
                        </Typography>
                        <Typography variant="body2" fontWeight={800}>
                          {selectedPayment.memberId?.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Contact Number
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {selectedPayment.memberId?.phone || "-"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          Address
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ wordBreak: "break-all" }}
                        >
                          {selectedPayment.memberId?.address ||
                            "No address provided"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              {/* FINANCIALS */}
              <Box>
                <Typography
                  variant="subtitle2"
                  color="#1e293b"
                  fontWeight={800}
                  gutterBottom
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontSize: "11px",
                    mb: 2,
                  }}
                >
                  Payment Breakdown
                </Typography>
                <Box
                  sx={{
                    bgcolor: "#f8fafc",
                    p: 2.5,
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Grid container spacing={1}>
                    <Grid item xs={3}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        Slots
                      </Typography>
                      <Typography variant="body1" fontWeight={800}>
                        {selectedPayment.slots}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        Base Amount
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={800}
                        color="#16a34a"
                      >
                        ₹{selectedPayment.paidAmount?.toLocaleString("en-IN")}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        Penalty/Int.
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={800}
                        color="#dc2626"
                      >
                        ₹
                        {selectedPayment.penaltyAmount?.toLocaleString("en-IN")}
                      </Typography>
                    </Grid>
                    <Grid item xs={3} sx={{ textAlign: "right" }}>
                      <Typography
                        variant="caption"
                        color="#1e293b"
                        fontWeight={800}
                      >
                        TOTAL
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={900}
                        color="#0f172a"
                      >
                        ₹
                        {(
                          Number(selectedPayment.paidAmount || 0) +
                          Number(selectedPayment.penaltyAmount || 0)
                        ).toLocaleString("en-IN")}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    px: 1,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      PAYMENT MODE
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ textTransform: "uppercase", color: "#64748b" }}
                    >
                      {selectedPayment.paymentMode}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      TRANSACTION ID
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#64748b"
                    >
                      {selectedPayment.paymentId || "-"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 2.5,
            bgcolor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => handleExportPDF(selectedPayment?._id)}
            startIcon={<FileDownloadIcon />}
            sx={{
              fontWeight: 800,
              borderRadius: "8px",
              borderColor: "#cbd5e1",
              color: "#475569",
              px: 3,
            }}
          >
            Export PDF
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenViewModal(false)}
            sx={{
              backgroundColor: "#1e293b",
              borderRadius: "8px",
              fontWeight: 800,
              px: 4,
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
                Month:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#1e293b">
                {previewData?.displayMonth}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Location:
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {previewData?.location}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Due Date:
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {previewData?.dueDate &&
                String(previewData.dueDate).includes("-")
                  ? String(previewData.dueDate).split("-").reverse().join("/")
                  : previewData?.dueDate}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Paid Amount:
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#16a34a">
                ₹{Number(previewData?.paidAmount || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Slots Paid:
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {previewData?.slotsPaid} Slots
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                Interest ({previewData?.interestPercent}%):
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
