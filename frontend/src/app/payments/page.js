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

/* ================= INITIAL FILTER STATE ================= */
const initialFilterState = {
  chitId: "",
  memberId: "",
  paymentMode: "",
  status: "",
};

export default function PaymentsPage() {
  const isMobile = useMediaQuery("(max-width:600px)");

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [chits, setChits] = useState([]);
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [filters, setFilters] = useState(initialFilterState);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  /* ================= FETCH PAYMENTS ================= */
  const fetchPayments = async (pageNum = page, pageSize = rowsPerPage) => {
    const queryParams = new URLSearchParams({
      page: pageNum + 1,
      limit: pageSize,
      ...(filters.chitId && { chitId: filters.chitId }),
      ...(filters.memberId && { memberId: filters.memberId }),
      ...(filters.paymentMode && { paymentMode: filters.paymentMode }),
      ...(filters.status && { status: filters.status }),
    });

    try {
      const res = await apiRequest(`/payment/list?${queryParams.toString()}`);
      const paymentData = res?.data?.items || [];
      const pagination = res?.data?.pagination || { totalItems: 0 };

      setPayments(paymentData);
      setFilteredPayments(paymentData); // Now same as payments due to server filtering
      setTotalCount(pagination.totalItems);
    } catch (error) {
      console.error("Failed to fetch payments", error);
    }
  };

  /* ================= FETCH CHITS ================= */
  const fetchChits = async () => {
    try {
      const res = await apiRequest("/chit/list?limit=1000"); // Fetch all for dropdowns
      const items = res?.data?.items || [];

      const formatted = items.map((c) => ({
        id: c._id,
        _id: c._id,
        chitName: c.chitName,
        duedate: c.calculatedDueDate || c.startDate, // Use calculated or startDate as fallback
      }));

      setChits(formatted);
    } catch (error) {
      console.error("Failed to fetch chits", error);
      setChits([]);
    }
  };

  /* ================= FETCH ALL MEMBERS ================= */
  const fetchAllMembers = async () => {
    try {
      const res = await apiRequest("/member/list");
      setAllMembers(res?.data?.members || []);
    } catch {
      setAllMembers([]);
    }
  };

  /* ================= FETCH MEMBERS BY CHIT ================= */
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
    fetchChits();
    fetchAllMembers();
  }, []);

  useEffect(() => {
    fetchPayments(page, rowsPerPage);
  }, [page, rowsPerPage, filters]);

  /* ================= CHIT-TO-MEMBER DROPDOWN LOGIC (For Filters) ================= */
  const membersForFilterDropdown = filters.chitId
    ? allMembers.filter((m) =>
        m.chits?.some(
          (c) => String(c.chitId?._id || c.chitId) === String(filters.chitId)
        )
      )
    : [];

  /* ================= RESET FILTERS ================= */
  const resetFilters = () => {
    setFilters(initialFilterState);
    setPage(0);
  };

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

    try {
      await apiRequest("/payment/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOpenModal(false);
      setForm(initialFormState);
      setMembers([]);
      fetchPayments();
    } catch (error) {
      console.error("Failed to save payment", error);
    }
  };

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

        {/* ================= FILTERS SECTION ================= */}
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
                        memberId: "", // Reset member when chit changes
                      }));
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
                    {membersForFilterDropdown.map((m) => (
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

        {/* ================= PAYMENT LIST ================= */}
        <Card>
          <CardContent>
            <Typography fontWeight={600} sx={{ mb: 2 }}>
              Payments List
            </Typography>

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
                      "Action",
                    ].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 600 }}>
                        {h}
                      </TableCell>
                    ))}
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

        {/* ================= ADD PAYMENT MODAL ================= */}
        <Dialog open={openModal} fullWidth maxWidth="sm" fullScreen={isMobile}>
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
                      dueDateValue = new Date(selectedChit.duedate)
                        .toISOString()
                        .split("T")[0];
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
              value={form.dueDate}
              InputLabelProps={{ shrink: true }}
              disabled
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
            <Button variant="contained" onClick={savePayment}>
              Save Payment
            </Button>
          </DialogActions>
        </Dialog>

        {/* ================= VIEW PAYMENT DETAILS MODAL ================= */}
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
                onClick={() =>
                  window.open(`/payments/pdf/${selectedPayment._id}`, "_blank")
                }
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
                      <Typography variant="caption">Member Name</Typography>
                      <Typography>{selectedPayment.memberId?.name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Phone</Typography>
                      <Typography>{selectedPayment.memberId?.phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="caption">Location</Typography>
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
      </div>
    </div>
  );
}
