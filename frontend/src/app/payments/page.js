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
  Grid,
  Box,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";

import { apiRequest, BASE_URL } from "@/config/api";
import AddIcon from "@mui/icons-material/Add";

const getStatusColor = (status) => {
  const s = status?.toLowerCase();
  if (["active", "paid", "upcoming"].includes(s))
    return { bg: "#dcfce7", text: "#166534" }; // Green
  if (["inactive", "overdue", "closed", "completed"].includes(s))
    return { bg: "#fee2e2", text: "#991b1b" }; // Red
  if (["partial", "pending"].includes(s))
    return { bg: "#fef3c7", text: "#92400e" }; // Orange/Amber
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

// initial form state
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
  monthlyPayableAmount: "",
  interestPercent: 0,
};

// initial filter state
const initialFilterState = {
  chitId: "",
  memberId: "",
  paymentMode: "",
  status: "",
};

const PaymentsPage = () => {
  const isMobile = useMediaQuery("(max-width:600px)");

  // State
  const [payments, setPayments] = useState([]);
  const [chits, setChits] = useState([]);
  const [members, setMembers] = useState([]); // For Add Payment Modal
  const [filterMembers, setFilterMembers] = useState([]); // For Filter Dropdown

  // Modals & UI State
  const [openModal, setOpenModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Forms & Filters
  const [form, setForm] = useState(initialFormState);
  const [filters, setFilters] = useState(initialFilterState);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // effects

  useEffect(() => {
    fetchChits();
  }, []);

  useEffect(() => {
    fetchPayments(page, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filters]);

  // api calls

  const fetchPayments = async (pageNum = page, pageSize = rowsPerPage) => {
    const queryParams = new URLSearchParams({
      page: (pageNum + 1).toString(),
      limit: pageSize.toString(),
    });

    if (filters.chitId) queryParams.append("chitId", filters.chitId);
    if (filters.memberId) queryParams.append("memberId", filters.memberId);
    if (filters.paymentMode)
      queryParams.append("paymentMode", filters.paymentMode);
    if (filters.status) queryParams.append("status", filters.status);

    try {
      const res = await apiRequest(`/payment/list?${queryParams.toString()}`);
      const paymentData = res?.data?.items || [];
      const pagination = res?.data?.pagination || { totalItems: 0 };

      setPayments(paymentData);
      setTotalCount(pagination.totalItems);
    } catch (error) {
      console.error("Failed to fetch payments", error);
    }
  };

  const fetchChits = async () => {
    try {
      const res = await apiRequest("/chit/list?limit=1000");
      const items = res?.data?.items || [];

      const formatted = items.map((c) => ({
        id: c._id,
        _id: c._id,
        chitName: c.chitName,
        duedate: c.calculatedDueDate || c.startDate,
        ...c, // include other props just in case
      }));

      setChits(formatted);
    } catch (error) {
      console.error("Failed to fetch chits", error);
      setChits([]);
    }
  };

  const fetchMembersByChit = async (chitId) => {
    if (!chitId) return;
    try {
      const res = await apiRequest(`/chit/details/${chitId}`);
      setMembers(res?.data?.members || []);
    } catch {
      setMembers([]);
    }
  };

  const fetchFilterMembers = async (chitId) => {
    if (!chitId) {
      setFilterMembers([]);
      return;
    }
    try {
      const res = await apiRequest(`/chit/details/${chitId}`);
      setFilterMembers(res?.data?.members || []);
    } catch {
      setFilterMembers([]);
    }
  };

  /* ================= HELPERS ================= */

  const resetFilters = () => {
    setFilters(initialFilterState);
    setFilterMembers([]);
    setPage(0);
  };

  /* ================= ACTIONS ================= */

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
      interestPercent: Number(form.interestPercent || 0),
    };

    try {
      const res = await apiRequest("/payment/create", "POST", payload);

      setOpenModal(false);
      setOpenPreviewModal(false);
      setForm(initialFormState);
      setMembers([]);
      setSnackbar({
        open: true,
        message: "Payment successful!",
        severity: "success",
      });
      fetchPayments();

      if (res?.data?.payment?._id) {
        const token = localStorage.getItem("token");
        window.open(
          `${BASE_URL}/payment/invoice/${res.data.payment._id}?token=${token}`,
          "_blank"
        );
      }
    } catch (error) {
      console.error("Failed to save payment", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to save payment",
        severity: "error",
      });
    }
  };

  /* ================= RENDER ================= */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#f3f4f6",
        p: { xs: 2, sm: 3 },
      }}
    >
      <div className="max-w-[1300px] mx-auto space-y-6">
        {/* HEADER */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            mb: 6,
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
            p: 2.5,
            mb: 4,
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
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
                  color: "#64748b",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  "&:hover": { color: "#2563eb" },
                }}
                onClick={resetFilters}
              >
                Reset Filters
              </Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.chitId}
                    displayEmpty
                    sx={{ borderRadius: "10px" }}
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
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.memberId}
                    displayEmpty
                    sx={{ borderRadius: "10px" }}
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
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.paymentMode}
                    displayEmpty
                    sx={{ borderRadius: "10px" }}
                    onChange={(e) =>
                      setFilters((p) => ({ ...p, paymentMode: e.target.value }))
                    }
                  >
                    <MenuItem value="">All Modes</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <Select
                    value={filters.status}
                    displayEmpty
                    sx={{ borderRadius: "10px" }}
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
              </Grid>
            </Grid>

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
                  {payments.length === 0 ? (
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
                              onClick={() => {
                                const token = localStorage.getItem("token");
                                window.open(
                                  `${BASE_URL}/payment/invoice/${p._id}?token=${token}`,
                                  "_blank"
                                );
                              }}
                              sx={{
                                minWidth: "50px",
                                fontSize: "10px",
                                fontWeight: 700,
                                borderColor: "#cbd5e1",
                                color: "#2563eb",
                                borderRadius: "6px",
                                "&:hover": {
                                  borderColor: "#2563eb",
                                  backgroundColor: "#eff6ff",
                                },
                              }}
                            >
                              PDF
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedPayment(p);
                                setOpenViewModal(true);
                              }}
                              sx={{
                                minWidth: "50px",
                                fontSize: "10px",
                                fontWeight: 700,
                                borderColor: "#cbd5e1",
                                color: "#1e293b",
                                borderRadius: "6px",
                                "&:hover": {
                                  borderColor: "#1e293b",
                                  backgroundColor: "#f1f5f9",
                                },
                              }}
                            >
                              VIEW
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalCount > 0 && (
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(e, n) => setPage(n)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) =>
                  setRowsPerPage(parseInt(e.target.value, 10))
                }
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{ mt: 2 }}
              />
            )}
          </CardContent>
        </Card>

        {/* ADD PAYMENT MODAL */}
        <Dialog
          open={openModal}
          fullWidth
          maxWidth="sm"
          fullScreen={isMobile}
          onClose={() => setOpenModal(false)}
          sx={{
            "& .MuiPaper-root": {
              borderRadius: "16px",
              padding: "20px",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#1e293b", pb: 1 }}>
            Add Payment
          </DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
          >
            <FormControl fullWidth>
              <Select
                displayEmpty
                value={form.chitId}
                sx={{ borderRadius: "10px" }}
                onChange={(e) => {
                  const chitId = e.target.value;
                  const selectedChit = chits.find((c) => c.id === chitId);

                  let dueDateValue = "";
                  if (selectedChit?.duedate) {
                    try {
                      const date = new Date(selectedChit.duedate);
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      const d = String(date.getDate()).padStart(2, "0");
                      dueDateValue = `${y}-${m}-${d}`;
                    } catch (error) {
                      console.error("Error formatting date:", error);
                    }
                  }

                  setForm((p) => ({
                    ...p,
                    chitId,
                    memberId: "",
                    phone: "",
                    location: "",
                    dueDate: dueDateValue,
                    monthlyPayableAmount:
                      selectedChit?.monthlyPayableAmount || "",
                    paidAmount: selectedChit?.monthlyPayableAmount || "",
                    interestPercent: 0,
                    penaltyAmount: 0,
                  }));
                  fetchMembersByChit(chitId);
                }}
              >
                <MenuItem value="">Select Chit</MenuItem>
                {chits.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.chitName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!members.length}>
              <Select
                displayEmpty
                value={form.memberId}
                sx={{ borderRadius: "10px" }}
                onChange={(e) => {
                  const m = members.find((x) => x._id === e.target.value);

                  // Find slots for this specific chit in member's assignments
                  const chitAssignment = (m.chits || []).find(
                    (c) => (c.chitId._id || c.chitId) === form.chitId
                  );
                  const slots = chitAssignment?.slots || 1;
                  const selectedChit = chits.find((c) => c.id === form.chitId);
                  const chitBaseAmount =
                    selectedChit?.monthlyPayableAmount || 0;

                  const totalPayable = chitBaseAmount * slots;

                  setForm((p) => ({
                    ...p,
                    memberId: m._id,
                    phone: m.phone,
                    location: m.address,
                    monthlyPayableAmount: totalPayable,
                    paidAmount: totalPayable,
                  }));
                }}
              >
                <MenuItem value="">
                  {!form.chitId ? "Select Chit First" : "Select Member"}
                </MenuItem>
                {members.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              placeholder="Phone"
              value={form.phone}
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                },
              }}
            />
            <TextField
              placeholder="Location"
              value={form.location}
              disabled
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc",
                },
              }}
            />

            <TextField
              type="month"
              label="Payment Month"
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#1976d2" },
              }}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                setForm((p) => ({
                  ...p,
                  paymentYear: year,
                  paymentMonth: `${year}-${month}`,
                }));
              }}
            />

            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", mb: 0.5, display: "block", ml: 0.5 }}
              >
                Due Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                value={form.dueDate}
                disabled
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                  },
                }}
              />
            </Box>

            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", mb: 0.5, display: "block", ml: 0.5 }}
              >
                Monthly Payable Amount
              </Typography>
              <TextField
                fullWidth
                value={form.monthlyPayableAmount}
                disabled
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc",
                  },
                }}
              />
            </Box>

            <FormControl fullWidth>
              <Select
                displayEmpty
                value={form.interestPercent}
                sx={{ borderRadius: "10px" }}
                onChange={(e) => {
                  const interestPercent = e.target.value;
                  const penaltyAmount =
                    (Number(form.monthlyPayableAmount) * interestPercent) / 100;
                  setForm((p) => ({
                    ...p,
                    interestPercent,
                    penaltyAmount,
                  }));
                }}
              >
                <MenuItem value={0}>0% Interest</MenuItem>
                <MenuItem value={5}>5% Interest</MenuItem>
                <MenuItem value={10}>10% Interest</MenuItem>
              </Select>
            </FormControl>

            <TextField
              placeholder="Paid Amount"
              type="number"
              fullWidth
              value={form.paidAmount}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              onChange={(e) =>
                setForm((p) => ({ ...p, paidAmount: e.target.value }))
              }
            />

            <TextField
              placeholder="Penalty Amount"
              type="number"
              fullWidth
              value={form.penaltyAmount}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
              onChange={(e) =>
                setForm((p) => ({ ...p, penaltyAmount: e.target.value }))
              }
            />

            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#64748b", mb: 0.5, display: "block", ml: 0.5 }}
              >
                Payment Date
              </Typography>
              <TextField
                type="date"
                fullWidth
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paymentDate: e.target.value }))
                }
              />
            </Box>

            <FormControl fullWidth>
              <Select
                displayEmpty
                value={form.paymentMode}
                sx={{ borderRadius: "10px" }}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paymentMode: e.target.value }))
                }
              >
                <MenuItem value="">Select Payment Mode</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 4, gap: 1 }}>
            <Button
              onClick={() => {
                setOpenModal(false);
                setForm(initialFormState);
              }}
              sx={{
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => setOpenPreviewModal(true)}
              sx={{
                backgroundColor: "#2563eb",
                borderRadius: "8px",
                px: 3,
                fontWeight: 700,
                textTransform: "uppercase",
                "&:hover": { backgroundColor: "#1d4ed8" },
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
          fullWidth
          maxWidth="md"
          sx={{
            "& .MuiPaper-root": {
              borderRadius: "16px",
              padding: "20px",
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 800,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#1e293b",
              pb: 1,
            }}
          >
            Payment Details
            {selectedPayment && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  const token = localStorage.getItem("token");
                  window.open(
                    `${BASE_URL}/payment/invoice/${selectedPayment._id}?token=${token}`,
                    "_blank"
                  );
                }}
                sx={{
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "11px",
                  borderColor: "#cbd5e1",
                  color: "#2563eb",
                  "&:hover": {
                    borderColor: "#2563eb",
                    backgroundColor: "#eff6ff",
                  },
                }}
              >
                VIEW AS PDF
              </Button>
            )}
          </DialogTitle>

          <DialogContent dividers sx={{ px: 4, py: 3 }}>
            {selectedPayment && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 2 }}>
                    Basic Information
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Invoice Number</Typography>
                      <Typography>
                        {selectedPayment.invoiceNumber || "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Status</Typography>
                      <Typography sx={{ textTransform: "capitalize" }}>
                        {selectedPayment.status}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Payment Mode</Typography>
                      <Typography sx={{ textTransform: "capitalize" }}>
                        {selectedPayment.paymentMode}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Payment Date</Typography>
                      <Typography>
                        {new Date(
                          selectedPayment.paymentDate
                        ).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 2 }}>
                    Chit & Member Details
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Chit Name</Typography>
                      <Typography>
                        {selectedPayment.chitId?.chitName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Chit Location</Typography>
                      <Typography>
                        {selectedPayment.chitId?.location || "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Member Name</Typography>
                      <Typography>{selectedPayment.memberId?.name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Phone</Typography>
                      <Typography>{selectedPayment.memberId?.phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Member Location</Typography>
                      <Typography>
                        {selectedPayment.memberId?.address || "-"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 2 }}>
                    Amount Details
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Monthly Payable</Typography>
                      <Typography>
                        ₹{selectedPayment.chitId?.monthlyPayableAmount || "-"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Paid Amount</Typography>
                      <Typography>₹{selectedPayment.paidAmount}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Penalty Amount</Typography>
                      <Typography>₹{selectedPayment.penaltyAmount}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Total Paid</Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        ₹{selectedPayment.totalPaid}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Due Date</Typography>
                      <Typography>
                        {new Date(selectedPayment.dueDate).toLocaleDateString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 3 }}>
            <Button
              onClick={() => setOpenViewModal(false)}
              sx={{
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* PREVIEW CONFRIM MODAL */}
        <Dialog
          open={openPreviewModal}
          onClose={() => setOpenPreviewModal(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            "& .MuiPaper-root": {
              borderRadius: "16px",
              padding: "20px",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#1e293b", pb: 1 }}>
            Confirm Payment Details
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} color="primary">
                Please review the details before confirming.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Chit Name
                  </Typography>
                  <Typography fontWeight={500}>
                    {chits.find((c) => c.id === form.chitId)?.chitName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Member Name
                  </Typography>
                  <Typography fontWeight={500}>
                    {members.find((m) => m._id === form.memberId)?.name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Month
                  </Typography>
                  <Typography fontWeight={500}>{form.paymentMonth}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Monthly Payable
                  </Typography>
                  <Typography fontWeight={500}>
                    ₹{form.monthlyPayableAmount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Date
                  </Typography>
                  <Typography fontWeight={500}>{form.paymentDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Paid Amount
                  </Typography>
                  <Typography fontWeight={500}>₹{form.paidAmount}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Penalty
                  </Typography>
                  <Typography fontWeight={500}>
                    ₹{form.penaltyAmount || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Total Payable
                  </Typography>
                  <Typography fontWeight={700} fontSize="1.1rem">
                    ₹{Number(form.paidAmount) + Number(form.penaltyAmount || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Payment Mode
                  </Typography>
                  <Typography
                    fontWeight={500}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {form.paymentMode}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 4, gap: 1 }}>
            <Button
              onClick={() => setOpenPreviewModal(false)}
              sx={{
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Edit
            </Button>
            <Button
              onClick={savePayment}
              variant="contained"
              sx={{
                backgroundColor: "#16a34a",
                borderRadius: "8px",
                px: 3,
                fontWeight: 700,
                textTransform: "uppercase",
                "&:hover": { backgroundColor: "#15803d" },
              }}
            >
              CONFIRM & SAVE
            </Button>
          </DialogActions>
        </Dialog>

        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </Box>
  );
};

export default PaymentsPage;
