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
} from "@mui/material";

import { apiRequest, BASE_URL } from "@/config/api";

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
  monthlyPayableAmount: "",
  interestPercent: 0,
};

/* ================= INITIAL FILTER STATE ================= */
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

  /* ================= EFFECTS ================= */

  useEffect(() => {
    fetchChits();
  }, []);

  useEffect(() => {
    fetchPayments(page, rowsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filters]);

  /* ================= API CALLS ================= */

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
    <div style={{ minHeight: "100vh", background: "#f3f4f6", padding: 24 }}>
      <div className="max-w-[1300px] mx-auto space-y-6">
        {/* HEADER */}
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

          <Button
            variant="contained"
            sx={{
              position: { xs: "static", md: "absolute" },
              right: { md: 0 },
              top: { md: "50%" },
              transform: { md: "translateY(-50%)" },
              backgroundColor: "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" },
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

        {/* FILTERS */}
        <Card>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography fontWeight={600} fontSize="1.1rem">
                Filters
              </Typography>
              <Button
                size="small"
                onClick={resetFilters}
                sx={{ textTransform: "uppercase", fontSize: "0.75rem" }}
              >
                Reset Filters
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <FormControl fullWidth size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>Chit</InputLabel>
                  <Select
                    label="Chit"
                    value={filters.chitId}
                    sx={{ height: 44 }}
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

              <Grid item xs={12} sm={6} md={6} lg={3}>
                <FormControl fullWidth size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>Member</InputLabel>
                  <Select
                    label="Member"
                    value={filters.memberId}
                    sx={{ height: 44 }}
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

              <Grid item xs={12} sm={6} md={6} lg={3}>
                <FormControl fullWidth size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select
                    label="Payment Mode"
                    value={filters.paymentMode}
                    sx={{ height: 44 }}
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

              <Grid item xs={12} sm={6} md={6} lg={3}>
                <FormControl fullWidth size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={filters.status}
                    sx={{ height: 44 }}
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
              sx={{ mt: 2.5, color: "text.secondary", fontWeight: 500 }}
            >
              Showing {payments.length} of {totalCount} payments
            </Typography>
          </CardContent>
        </Card>

        {/* PAYMENT LIST */}
        <Card>
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Payments List
            </Typography>

            <div style={{ width: "100%", overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Chit</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Member</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Paid</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Penalty</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
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
                        <TableCell>
                          ₹
                          {p.totalPaid ??
                            Number(p.paidAmount || 0) +
                              Number(p.penaltyAmount || 0)}
                        </TableCell>
                        <TableCell>{p.paymentMode}</TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>
                          {p.status || "-"}
                        </TableCell>
                        <TableCell>
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
                            sx={{ mr: 1 }}
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
                          >
                            View
                          </Button>
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
        >
          <DialogTitle>Add Payment</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
          >
            <FormControl fullWidth>
              <InputLabel>Select Chit</InputLabel>
              <Select
                label="Select Chit"
                value={form.chitId}
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

            <TextField
              type="date"
              label="Due Date"
              value={form.dueDate}
              InputLabelProps={{ shrink: true }}
              disabled
              sx={{
                backgroundColor: "#f9fafb",
              }}
            />

            <TextField
              label="Monthly Payable Amount"
              value={form.monthlyPayableAmount}
              disabled
              sx={{
                backgroundColor: "#f9fafb",
              }}
            />

            <FormControl fullWidth>
              <InputLabel sx={{ "&.Mui-focused": { color: "#1976d2" } }}>
                Interest %
              </InputLabel>
              <Select
                label="Interest %"
                value={form.interestPercent}
                sx={{
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                  },
                }}
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
                <MenuItem value={0}>0%</MenuItem>
                <MenuItem value={5}>5%</MenuItem>
                <MenuItem value={10}>10%</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Paid Amount"
              type="number"
              value={form.paidAmount}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#1976d2" },
              }}
              onChange={(e) =>
                setForm((p) => ({ ...p, paidAmount: e.target.value }))
              }
            />

            <TextField
              label="Penalty Amount"
              type="number"
              value={form.penaltyAmount}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#1976d2" },
              }}
              onChange={(e) =>
                setForm((p) => ({ ...p, penaltyAmount: e.target.value }))
              }
            />

            <TextField
              type="date"
              label="Payment Date"
              InputLabelProps={{ shrink: true }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#1976d2" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#1976d2" },
              }}
              onChange={(e) =>
                setForm((p) => ({ ...p, paymentDate: e.target.value }))
              }
            />

            <FormControl fullWidth>
              <InputLabel sx={{ "&.Mui-focused": { color: "#1976d2" } }}>
                Payment Mode
              </InputLabel>
              <Select
                label="Payment Mode"
                value={form.paymentMode}
                sx={{
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                  },
                }}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paymentMode: e.target.value }))
                }
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="online">Online</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setOpenModal(false);
                setForm(initialFormState);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => setOpenPreviewModal(true)}
              sx={{
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
            >
              Preview & Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* VIEW PAYMENT MODAL */}
        <Dialog
          open={openViewModal}
          onClose={() => setOpenViewModal(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
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
              >
                View as PDF
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
          <DialogActions sx={{ px: 4, py: 2 }}>
            <Button onClick={() => setOpenViewModal(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* PREVIEW CONFRIM MODAL */}
        <Dialog
          open={openPreviewModal}
          onClose={() => setOpenPreviewModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
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
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenPreviewModal(false)} color="inherit">
              Edit
            </Button>
            <Button onClick={savePayment} variant="contained" color="primary">
              Confirm & Save
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
    </div>
  );
};

export default PaymentsPage;
