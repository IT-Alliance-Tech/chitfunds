"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import HistoryIcon from "@mui/icons-material/History";
import { apiRequest } from "@/config/api";
import { supabase } from "@/config/supabase";
import StatusPill from "@/components/shared/StatusPill";
import { tableHeaderSx } from "@/utils/statusUtils";

const TransactionListPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chits, setChits] = useState([]);
  const [filters, setFilters] = useState({
    chitId: "",
    memberId: "",
    status: "",
    paymentMode: "",
    date: "",
    page: 1,
    limit: 10,
  });
  const [filterMembers, setFilterMembers] = useState([]);

  // View Modal State
  const [openViewModal, setOpenViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Add Modal State
  const [openAddModal, setOpenAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [fromMembers, setFromMembers] = useState([]);
  const [toMembers, setToMembers] = useState([]);
  const [fromChitId, setFromChitId] = useState("");
  const [toChitId, setToChitId] = useState("");
  const [addForm, setAddForm] = useState({
    type: "transfer",
    memberId: "",
    transferFrom: "",
    transferTo: "",
    amount: "",
    paymentMode: "online",
    paymentDate: "", // Initialize empty for hydration stability
    description: "",
  });

  useEffect(() => {
    // Set default date on mount to avoid SSR mismatch
    setAddForm((prev) => ({
      ...prev,
      paymentDate: new Date().toISOString().split("T")[0],
    }));
  }, []);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [memberHistory, setMemberHistory] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState("");

  // Preview Flow State
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [finalPreviewData, setFinalPreviewData] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchTransactions();
    fetchChits();
  }, [filters]);

  useEffect(() => {
    if (fromChitId) {
      fetchMembers(fromChitId, setFromMembers);
    } else {
      setFromMembers([]);
      setMemberHistory([]);
    }
  }, [fromChitId]);

  useEffect(() => {
    if (toChitId) {
      fetchMembers(toChitId, setToMembers);
    } else {
      setToMembers([]);
    }
  }, [toChitId]);

  useEffect(() => {
    const fetchFilterMembers = async () => {
      if (filters.chitId) {
        try {
          const res = await apiRequest(`/chit/details/${filters.chitId}`);
          setFilterMembers(res.data.members || []);
        } catch (err) {
          console.error(err);
        }
      } else {
        setFilterMembers([]);
      }
    };
    fetchFilterMembers();
  }, [filters.chitId]);

  useEffect(() => {
    if (fromChitId && addForm.transferFrom) {
      fetchMemberHistory(fromChitId, addForm.transferFrom);
    } else {
      setMemberHistory([]);
    }
  }, [fromChitId, addForm.transferFrom]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(filters).toString();
      const res = await apiRequest(`/transaction/list?${q}`);
      setTransactions(res?.data?.items || []);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to fetch transactions",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChits = async () => {
    try {
      const res = await apiRequest("/chit/list?limit=100");
      setChits(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async (chitId, setter) => {
    try {
      const res = await apiRequest(`/chit/details/${chitId}`);
      if (setter) {
        setter(res.data.members || []);
      } else {
        setFromMembers(res.data.members || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMemberHistory = async (chitId, memberId) => {
    setFetchingHistory(true);
    try {
      // Fetch from both modules to give a complete "Payment History"
      const [transRes, payRes] = await Promise.all([
        apiRequest(
          `/transaction/list?chitId=${chitId}&memberId=${memberId}&limit=5`,
        ),
        apiRequest(
          `/payment/list?chitId=${chitId}&memberId=${memberId}&limit=5`,
        ),
      ]);

      const transItems = (transRes.data.items || []).map((t) => ({
        ...t,
        displayAmount: t.amount,
        type: "transaction",
      }));

      const payItems = (payRes.data.items || payRes.data.payments || []).map(
        (p) => ({
          ...p,
          displayAmount: p.paidAmount,
          type: "payment",
          paymentDate: p.paymentDate, // Both use paymentDate
        }),
      );

      // Merge and sort by date descending, then take top 5
      const combined = [...transItems, ...payItems]
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .slice(0, 5);

      setMemberHistory(combined);
    } catch (err) {
      console.error("History fetch error:", err);
      setMemberHistory([]);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 1024 * 1024) {
        setSnackbar({
          open: true,
          message: "File size exceeds 1MB limit.",
          severity: "error",
        });
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const compressImage = async (file, { quality = 0.6, maxWidth = 1000 }) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            "image/jpeg",
            quality,
          );
        };
      };
    });
  };

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.floor(
        Math.random() * 1000,
      )}.${fileExt}`;
      const filePath = `${Date.now()}-${Math.floor(
        Math.random() * 1000,
      )}.${fileExt}`;

      console.log(
        "Attempting upload to Supabase bucket 'chitfunds':",
        filePath,
      );
      const { data, error } = await supabase.storage
        .from("chitfunds")
        .upload(filePath, file);

      if (error) {
        console.error("Supabase upload error details:", error);
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("chitfunds").getPublicUrl(filePath);

      console.log("Upload successful. Public URL:", publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("Full upload error object:", err);
      throw err;
    }
  };

  const handleAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (
      !fromChitId ||
      !toChitId ||
      !addForm.transferFrom ||
      !addForm.transferTo ||
      !addForm.amount ||
      !addForm.description ||
      !file
    ) {
      setSnackbar({
        open: true,
        message:
          "Please fill all required fields (Note: Remarks and Image are mandatory for transfer)",
        severity: "warning",
      });
      return;
    }

    setAddLoading(true);
    try {
      let imageProofUrl = "";
      if (file) {
        setUploading(true);
        try {
          const compressedFile = await compressImage(file, { quality: 0.5 });
          imageProofUrl = await uploadImage(compressedFile);
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
          setUploading(false);
          setSnackbar({
            open: true,
            message: "Failed to upload image. Please try again.",
            severity: "error",
          });
          setAddLoading(false);
          return; // STOP HERE
        }
        setUploading(false);
      }

      const { memberId, ...formData } = addForm;
      const transactionBody = {
        ...formData,
        type: "transfer", // Explicitly ensure type is transfer
        transferFromChit: fromChitId,
        transferToChit: toChitId,
        imageProofUrl,
        status: "paid",
      };

      console.log(
        "Sending transaction create request with body:",
        JSON.stringify(transactionBody, null, 2),
      );
      await apiRequest("/transaction/create", "POST", transactionBody);

      setSnackbar({
        open: true,
        message: "Transaction recorded successfully",
        severity: "success",
      });
      setOpenPreviewModal(false);
      setOpenAddModal(false);
      resetAddForm();
      fetchTransactions();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save transaction",
        severity: "error",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const resetAddForm = () => {
    setFromChitId("");
    setToChitId("");
    setFromMembers([]);
    setToMembers([]);
    setMemberHistory([]);
    setSelectedHistoryId("");
    setAddForm({
      type: "transfer",
      memberId: "",
      transferFrom: "",
      transferTo: "",
      amount: "",
      paymentMode: "online",
      paymentDate: new Date().toISOString().split("T")[0],
      description: "",
    });
    setFile(null);
    setPreview(null);
  };

  const handleViewTransaction = async (transaction) => {
    try {
      const res = await apiRequest(`/transaction/details/${transaction._id}`);
      setSelectedTransaction(res.data.transaction);
      setOpenViewModal(true);
    } catch (err) {
      console.error("Fetch details error:", err);
      // Fallback to list data if API fails
      setSelectedTransaction(transaction);
      setOpenViewModal(true);
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
      <Box sx={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" fontWeight={800} color="#1e293b">
            Transactions
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            suppressHydrationWarning
            sx={{
              backgroundColor: "#2563eb",
              borderRadius: "8px",
              fontWeight: 700,
            }}
            onClick={() => setOpenAddModal(true)}
          >
            ADD TRANSACTION
          </Button>
        </Box>

        {/* FILTERS */}
        <Card
          sx={{
            p: 3,
            mb: 4,
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>CHIT NAME</InputLabel>
              <Select
                value={filters.chitId}
                label="CHIT NAME"
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    chitId: e.target.value,
                    memberId: "",
                  })
                }
              >
                <MenuItem value="">All Chits</MenuItem>
                {chits.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.chitName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={!filters.chitId}>
              <InputLabel>MEMBER</InputLabel>
              <Select
                value={filters.memberId}
                label="MEMBER"
                onChange={(e) =>
                  setFilters({ ...filters, memberId: e.target.value })
                }
              >
                <MenuItem value="">All Members</MenuItem>
                {filterMembers.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {m.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>MODE</InputLabel>
              <Select
                value={filters.paymentMode}
                label="MODE"
                onChange={(e) =>
                  setFilters({ ...filters, paymentMode: e.target.value })
                }
              >
                <MenuItem value="">All Modes</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="DATE"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            />

            <FormControl fullWidth size="small">
              <InputLabel>STATUS</InputLabel>
              <Select
                value={filters.status}
                label="STATUS"
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Card>

        {/* LIST TABLE */}
        <TableContainer
          component={Card}
          sx={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflowX: "auto",
            "&::-webkit-scrollbar": {
              height: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#e2e8f0",
              borderRadius: "10px",
            },
          }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={tableHeaderSx}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>From Chit</TableCell>
                <TableCell>To Chit</TableCell>
                <TableCell>Transfer From</TableCell>
                <TableCell>Transfer To</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Mode</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {t.transactionId}
                    </TableCell>
                    <TableCell>
                      {t.type === "transfer"
                        ? t.transferFromChit?.chitName
                        : t.chitId?.chitName}
                    </TableCell>
                    <TableCell>
                      {t.type === "transfer" ? t.transferToChit?.chitName : "-"}
                    </TableCell>
                    <TableCell>
                      {t.type === "transfer"
                        ? t.transferFrom?.name
                        : t.memberId?.name}
                    </TableCell>
                    <TableCell>
                      {t.type === "transfer" ? t.transferTo?.name : "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(t.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{t.amount.toLocaleString()}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {t.paymentMode}
                    </TableCell>
                    <TableCell align="center">
                      <StatusPill status={t.status} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleViewTransaction(t)}
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* VIEW MODAL */}
      <Dialog
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        maxWidth="sm"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: "16px" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            color: "#1e293b",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          Transaction Details
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedTransaction && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Card
                variant="outlined"
                sx={{ borderRadius: "12px", overflow: "hidden" }}
              >
                <Table size="small">
                  <TableBody>
                    {[
                      {
                        label: "Transaction ID",
                        value: selectedTransaction.transactionId,
                      },
                      {
                        label: "Date",
                        value: new Date(
                          selectedTransaction.paymentDate,
                        ).toLocaleDateString(),
                      },
                      {
                        label: "From Chit",
                        value:
                          selectedTransaction.type === "transfer"
                            ? selectedTransaction.transferFromChit?.chitName
                            : selectedTransaction.chitId?.chitName,
                      },
                      {
                        label: "To Chit",
                        value:
                          selectedTransaction.type === "transfer"
                            ? selectedTransaction.transferToChit?.chitName
                            : "-",
                      },
                      {
                        label: "Payment Mode",
                        value: selectedTransaction.paymentMode,
                        transform: "capitalize",
                      },
                      {
                        label: "Transfer From",
                        value:
                          selectedTransaction.type === "transfer"
                            ? selectedTransaction.transferFrom?.name
                            : selectedTransaction.memberId?.name,
                      },
                      {
                        label: "Transfer To",
                        value:
                          selectedTransaction.type === "transfer"
                            ? selectedTransaction.transferTo?.name
                            : "-",
                      },
                      {
                        label: "Amount",
                        value: `₹${selectedTransaction.amount.toLocaleString()}`,
                        color: "#16a34a",
                        isAmount: true,
                      },
                      {
                        label: "Description",
                        value:
                          selectedTransaction.description ||
                          "No description provided",
                      },
                    ].map((row, index) => (
                      <TableRow
                        key={index}
                        sx={{ "&:nth-of-type(odd)": { bgcolor: "#f8fafc" } }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            color: "#64748b",
                            width: { xs: "40%", sm: "30%" },
                            py: 1.5,
                            borderRight: "1px solid #e2e8f0",
                            textTransform: "uppercase",
                            fontSize: "0.75rem",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {row.label}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: row.isAmount ? 800 : 600,
                            color: row.color || "#1e293b",
                            py: 1.5,
                            textTransform: row.transform || "none",
                            fontSize: row.isAmount ? "1.1rem" : "0.9rem",
                          }}
                        >
                          {row.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {selectedTransaction.imageProofUrl ? (
                <Box>
                  <Divider sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="textSecondary"
                    >
                      TRANSACTION PROOF
                    </Typography>
                  </Divider>
                  <Box
                    component="a"
                    href={selectedTransaction.imageProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: "block",
                      width: "100%",
                      cursor: "pointer",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      transition: "transform 0.2s, boxShadow 0.2s",
                      "&:hover": {
                        transform: "scale(1.01)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={selectedTransaction.imageProofUrl}
                      alt="Proof"
                      sx={{
                        width: "100%",
                        maxHeight: "350px",
                        objectFit: "contain",
                        backgroundColor: "#f8fafc",
                        display: "block",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    align="center"
                    sx={{ display: "block", mt: 1 }}
                  >
                    Click image to enlarge
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 2,
                    bgcolor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px dashed #e2e8f0",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No proof image was uploaded for this transaction.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #f1f5f9" }}>
          <Button
            onClick={() => setOpenViewModal(false)}
            variant="outlined"
            sx={{ borderRadius: "8px" }}
          >
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAddModal}
        onClose={() => {
          if (!addLoading && !uploading) setOpenAddModal(false);
        }}
        maxWidth="sm"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: "16px" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1.25rem",
            pb: 1,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          Record New Transaction
        </DialogTitle>
        <DialogContent sx={{ mt: 2, px: 3 }}>
          <Box
            sx={{
              mb: 3,
              p: 2,
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
              access member details and record transaction.
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={handleAddSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <FormControl fullWidth required sx={{ flex: 1 }}>
                <InputLabel>From Chit</InputLabel>
                <Select
                  value={fromChitId}
                  label="From Chit"
                  onChange={(e) => setFromChitId(e.target.value)}
                  sx={{ borderRadius: "8px" }}
                >
                  {chits.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.chitName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required sx={{ flex: 1 }}>
                <InputLabel>To Chit</InputLabel>
                <Select
                  value={toChitId}
                  label="To Chit"
                  onChange={(e) => setToChitId(e.target.value)}
                  sx={{ borderRadius: "8px" }}
                >
                  {chits.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.chitName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <FormControl
                fullWidth
                required
                disabled={!fromChitId}
                sx={{ flex: 1 }}
              >
                <InputLabel>Transfer From</InputLabel>
                <Select
                  value={addForm.transferFrom}
                  label="Transfer From"
                  onChange={(e) =>
                    setAddForm({ ...addForm, transferFrom: e.target.value })
                  }
                  sx={{ borderRadius: "8px" }}
                >
                  {fromMembers.map((m) => (
                    <MenuItem key={m._id} value={m._id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                required
                disabled={!toChitId}
                sx={{ flex: 1 }}
              >
                <InputLabel>Transfer To</InputLabel>
                <Select
                  value={addForm.transferTo}
                  label="Transfer To"
                  onChange={(e) =>
                    setAddForm({ ...addForm, transferTo: e.target.value })
                  }
                  sx={{ borderRadius: "8px" }}
                >
                  {toMembers.map((m) => (
                    <MenuItem key={m._id} value={m._id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              required
              label="Amount"
              type="number"
              value={addForm.amount}
              onChange={(e) =>
                setAddForm({ ...addForm, amount: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />

            <FormControl fullWidth required>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={addForm.paymentMode}
                label="Payment Mode"
                onChange={(e) =>
                  setAddForm({ ...addForm, paymentMode: e.target.value })
                }
                sx={{ borderRadius: "8px" }}
              >
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="upi">UPI</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              required
              label="Payment Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={addForm.paymentDate}
              onChange={(e) =>
                setAddForm({ ...addForm, paymentDate: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />

            <TextField
              fullWidth
              required
              label="Remarks (Mandatory)"
              placeholder="Enter mandatory remarks for transfer"
              multiline
              rows={2}
              value={addForm.description}
              onChange={(e) =>
                setAddForm({ ...addForm, description: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />

            <Box>
              <Typography
                variant="subtitle2"
                color="#64748b"
                sx={{ mb: 1, display: "block", fontWeight: 700 }}
              >
                TRANSACTION PROOF (IMAGE){" "}
                <span style={{ color: "#dc2626" }}>* Mandatory</span>
              </Typography>
              <Box
                component="label"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #e2e8f0",
                  borderRadius: "12px",
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  backgroundColor: "#ffffff",
                  "&:hover": {
                    borderColor: "#2563eb",
                    backgroundColor: "#eff6ff",
                  },
                }}
              >
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <CloudUploadIcon
                  sx={{ fontSize: 48, color: "#94a3b8", mb: 1.5 }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "#475569", fontWeight: 600 }}
                >
                  {file ? file.name : "Click to upload transaction proof image"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#94a3b8", mt: 0.5 }}
                >
                  Support: JPG, PNG (Max 1MB)
                </Typography>
              </Box>
              {preview && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Box
                    component="img"
                    src={preview}
                    alt="Preview"
                    sx={{
                      maxWidth: "100%",
                      maxHeight: "150px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: "1px solid #f1f5f9", gap: 1 }}>
          <Button
            onClick={() => {
              setOpenAddModal(false);
              resetAddForm();
            }}
            disabled={addLoading || uploading}
            sx={{ fontWeight: 700, color: "#64748b" }}
          >
            CANCEL
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (
                !fromChitId ||
                !toChitId ||
                !addForm.transferFrom ||
                !addForm.transferTo ||
                !addForm.amount ||
                !addForm.description ||
                !file
              ) {
                setSnackbar({
                  open: true,
                  message:
                    "Please fill all required fields (Remarks and Image are mandatory for transfer)",
                  severity: "warning",
                });
                return;
              }

              const selectedFrom = fromMembers.find(
                (m) => m._id === addForm.transferFrom,
              );
              const selectedTo = toMembers.find(
                (m) => m._id === addForm.transferTo,
              );
              const selectedFromChit = chits.find((c) => c._id === fromChitId);
              const selectedToChit = chits.find((c) => c._id === toChitId);
              setFinalPreviewData({
                ...addForm,
                type: "transfer", // Ensure type is set to transfer
                transferFromName: selectedFrom?.name,
                transferToName: selectedTo?.name,
                fromChitName: selectedFromChit?.chitName,
                toChitName: selectedToChit?.chitName,
              });
              setOpenPreviewModal(true);
            }}
            disabled={addLoading || uploading}
            sx={{
              backgroundColor: "#2563eb",
              borderRadius: "8px",
              fontWeight: 700,
              px: 4,
              py: 1,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            PREVIEW TRANSACTION
          </Button>
        </DialogActions>
      </Dialog>

      {/* PREVIEW TRANSACTION MODAL */}
      <Dialog
        open={openPreviewModal}
        onClose={() => setOpenPreviewModal(false)}
        maxWidth="xs"
        fullWidth
        sx={{ "& .MuiDialog-paper": { borderRadius: "20px" } }}
      >
        <DialogTitle
          sx={{ textAlign: "center", pt: 3, fontWeight: 900, color: "#1e293b" }}
        >
          Confirm Transaction
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography
            variant="body2"
            color="#64748b"
            align="center"
            sx={{ mb: 3 }}
          >
            Please double check the details before saving.
          </Typography>

          <Box
            sx={{
              bgcolor: "#f8fafc",
              p: 2.5,
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                TRANSFER FROM
              </Typography>
              <Typography variant="body1" fontWeight={800} color="#1e293b">
                {finalPreviewData?.transferFromName}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                TRANSFER TO
              </Typography>
              <Typography variant="body1" fontWeight={800} color="#1e293b">
                {finalPreviewData?.transferToName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                FROM CHIT
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#64748b">
                {finalPreviewData?.fromChitName}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                TO CHIT
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#64748b">
                {finalPreviewData?.toChitName}
              </Typography>
            </Box>

            <Divider />

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                  AMOUNT
                </Typography>
                <Typography variant="h5" fontWeight={900} color="#2563eb">
                  ₹{Number(finalPreviewData?.amount).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                  MODE
                </Typography>
                <Typography variant="body1" fontWeight={800} color="#1e293b">
                  {finalPreviewData?.paymentMode.toUpperCase()}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                DATE
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {finalPreviewData?.paymentDate}
              </Typography>
            </Box>

            {finalPreviewData?.description && (
              <Box>
                <Typography variant="caption" color="#94a3b8" fontWeight={700}>
                  REMARKS
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  &ldquo;{finalPreviewData.description}&rdquo;
                </Typography>
              </Box>
            )}

            {preview && (
              <Box>
                <Typography
                  variant="caption"
                  color="#94a3b8"
                  fontWeight={700}
                  sx={{ mb: 1, display: "block" }}
                >
                  ATTACHED PROOF
                </Typography>
                <Box
                  component="img"
                  src={preview}
                  sx={{
                    width: "100%",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, justifyContent: "center", gap: 2 }}>
          <Button
            onClick={() => setOpenPreviewModal(false)}
            sx={{ fontWeight: 800, color: "#64748b" }}
          >
            GO BACK
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSubmit}
            disabled={addLoading || uploading}
            sx={{
              backgroundColor: "#16a34a",
              "&:hover": { backgroundColor: "#15803d" },
              borderRadius: "10px",
              px: 4,
              fontWeight: 800,
            }}
          >
            {uploading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Uploading Proof...
              </Box>
            ) : addLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "CONFIRM & SAVE"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TransactionListPage;
