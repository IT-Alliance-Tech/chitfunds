"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MUIMenuItem,
  TablePagination,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import { apiRequest } from "@/config/api";
import StatusPill from "@/components/shared/StatusPill";
import { tableHeaderSx } from "@/utils/statusUtils";

const STATUS_OPTIONS = ["Active", "Closed", "Upcoming"];

const ChitsPage = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data State
  const [chits, setChits] = useState([]);
  const [totalChits, setTotalChits] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    name: "",
    duration: "",
    members: "", // Note: Client side filter for now or unimplemented on backend
    startDate: "", // Note: Client side filter for now or unimplemented on backend
    status: "",
    location: "",
  });

  // Notifications
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Modals & Actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedChit, setSelectedChit] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chitToDelete, setChitToDelete] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    id: null,
    chitName: "",
    location: "",
    amount: "",
    monthlyPayableAmount: "",
    duration: "",
    totalSlots: "",
    startDate: "",
    dueDate: "",
    status: "Active",
  });

  /* ===================== EFFECTS ====================== */

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchChits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    rowsPerPage,
    filters.name,
    filters.location,
    filters.status,
    filters.duration,
    filters.members,
    filters.startDate,
  ]);

  /* ===================== API CALLS ====================== */

  const fetchChits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
      });

      // Server-side filtered fields
      if (filters.name) params.append("chitName", filters.name);
      if (filters.location) params.append("location", filters.location);
      if (filters.status) params.append("status", filters.status);
      if (filters.duration) params.append("duration", filters.duration);
      if (filters.members) params.append("totalSlots", filters.members);
      if (filters.startDate) params.append("startDate", filters.startDate);

      const response = await apiRequest(`/chit/list?${params.toString()}`);

      const chitArray =
        response?.data?.items || response?.data?.chits || response?.data || [];
      const paginationData = response?.data?.pagination || {};

      setTotalChits(paginationData.totalItems || paginationData.total || 0);

      const formattedChits = Array.isArray(chitArray)
        ? chitArray.map((chit) => ({
            id: chit._id || chit.id,
            chitId: chit.chitId, // Auto-generated ID like CID001
            name: chit.chitName,
            amount: chit.amount,
            monthlyAmount: chit.monthlyPayableAmount,
            durationMonths: chit.duration,
            totalSlots: chit.totalSlots,
            startDate: chit.startDate ? chit.startDate.split("T")[0] : "",
            dueDate: chit.dueDate,
            status: chit.status,
            location: chit.location,
          }))
        : [];

      setChits(formattedChits);
    } catch (error) {
      console.error("Fetch chits failed:", error);
      setChits([]);
      setTotalChits(0);
      showNotification("Failed to load chits", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== HELPERS ====================== */

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      name: "",
      duration: "",
      members: "",
      startDate: "",
      status: "",
      location: "",
    });
  };

  /* ===================== ACTIONS ====================== */

  const openActions = (event, chit) => {
    setSelectedChit(chit);
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => setAnchorEl(null);

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      id: null,
      chitName: "",
      location: "",
      amount: "",
      monthlyPayableAmount: "",
      duration: "",
      totalSlots: "",
      startDate: "",
      dueDate: "",
      status: "Active",
    });
    setOpenModal(true);
  };

  const openEditModal = (chit) => {
    if (!chit) return;
    setIsEditMode(true);
    setFormData({
      id: chit.id,
      chitName: chit.name,
      location: chit.location,
      amount: chit.amount,
      monthlyPayableAmount: chit.monthlyAmount,
      duration: chit.durationMonths,
      totalSlots: chit.totalSlots,
      startDate: chit.startDate,
      dueDate: chit.dueDate,
      status: chit.status,
    });
    setOpenModal(true);
    closeActions();
  };

  const handleSaveChit = async () => {
    if (!formData.chitName || !formData.amount || !formData.duration) {
      showNotification("Please fill required fields", "warning");
      return;
    }

    if (formData.dueDate && (formData.dueDate < 1 || formData.dueDate > 31)) {
      showNotification("Due Date must be between 1 and 31", "warning");
      return;
    }

    try {
      const payload = {
        chitName: formData.chitName,
        location: formData.location,
        amount: Number(formData.amount),
        monthlyPayableAmount: Number(formData.monthlyPayableAmount),
        duration: Number(formData.duration),
        totalSlots: Number(formData.totalSlots),
        startDate: formData.startDate,
        dueDate: Number(formData.dueDate),
        status: formData.status,
      };

      if (isEditMode && formData.id) {
        await apiRequest(`/chit/update/${formData.id}`, "PUT", payload);
        showNotification("Chit updated successfully");
      } else {
        await apiRequest("/chit/create", "POST", payload);
        showNotification("Chit created successfully");
      }

      setOpenModal(false);
      fetchChits();
    } catch (error) {
      showNotification(error.message || "Operation failed", "error");
    }
  };

  const handleDelete = (chit) => {
    if (!chit) return;
    setChitToDelete(chit);
    setConfirmOpen(true);
  };

  const confirmDeleteAction = async () => {
    if (!chitToDelete) return;
    try {
      await apiRequest(`/chit/delete/${chitToDelete.id}`, "DELETE");
      showNotification("Chit deleted successfully");
      fetchChits();
    } catch (error) {
      showNotification(error.message || "Failed to delete chit", "error");
    } finally {
      setConfirmOpen(false);
      setChitToDelete(null);
      closeActions();
    }
  };

  return (
    <Box
      className="mobile-page-padding"
      sx={{ minHeight: "100vh", bgcolor: "#f1f5f9", p: { xs: 2, md: 4 } }}
    >
      {/* HEADER */}
      <div className="relative mb-6">
        <div className="flex flex-col items-center gap-3 sm:hidden">
          <Typography
            variant="h5"
            fontWeight={700}
            textAlign="center"
            sx={{ color: "#1e293b" }}
          >
            Chit Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddModal}
            sx={{
              backgroundColor: "#1976d2",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "14px",
              px: 2.5,
              letterSpacing: "0.02em",
              "&:hover": { backgroundColor: "#1565c0" },
            }}
          >
            ADD CHIT
          </Button>
        </div>

        <div className="hidden sm:flex items-center justify-center px-16">
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ textAlign: "center", color: "#1e293b" }}
          >
            Chit Management
          </Typography>
          <div className="absolute right-0">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddModal}
              sx={{
                backgroundColor: "#1976d2",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "14px",
                px: 3,
                py: 1,
                letterSpacing: "0.02em",
                "&:hover": { backgroundColor: "#1565c0" },
              }}
            >
              ADD CHIT
            </Button>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      {mounted && (
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
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(6, 1fr)",
              },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              placeholder="Chit Name"
              size="small"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              fullWidth
              placeholder="Duration"
              type="number"
              size="small"
              value={filters.duration}
              onChange={(e) =>
                setFilters({ ...filters, duration: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              fullWidth
              placeholder="Slot"
              type="number"
              size="small"
              value={filters.members}
              onChange={(e) =>
                setFilters({ ...filters, members: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <TextField
              fullWidth
              type="date"
              size="small"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
              placeholder="Start Date"
            />
            <TextField
              fullWidth
              placeholder="Location"
              size="small"
              value={filters.location}
              onChange={(e) =>
                setFilters({ ...filters, location: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
            />
            <FormControl fullWidth size="small">
              <Select
                value={filters.status}
                displayEmpty
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                sx={{ borderRadius: "8px" }}
              >
                <MUIMenuItem value="">
                  <span className="text-gray-400">Status</span>
                </MUIMenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MUIMenuItem key={s} value={s}>
                    {s}
                  </MUIMenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Typography
              onClick={clearFilters}
              sx={{
                color: "#2563eb",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Clear filters
            </Typography>
          </Box>
        </Card>
      )}

      {/* TABLE */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] table-container-mobile">
            <Table className="min-w-max">
              <TableHead>
                <TableRow sx={tableHeaderSx}>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Monthly</TableCell>
                  <TableCell align="center">Duration</TableCell>
                  <TableCell align="center">Total Slots</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chits.map((chit) => (
                  <TableRow
                    key={chit.id}
                    sx={{
                      "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                      "&:hover": { backgroundColor: "#f1f5f9" },
                    }}
                  >
                    <TableCell sx={{ color: "#64748b", fontWeight: 500 }}>
                      {chit.chitId ||
                        (chit.id ? chit.id.slice(-6).toUpperCase() : "N/A")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                      {chit.name}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      ₹{chit.amount?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 600, color: "#0284c7" }}
                    >
                      ₹{chit.monthlyAmount?.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell align="center">{chit.durationMonths}</TableCell>
                    <TableCell align="center">{chit.totalSlots}</TableCell>
                    <TableCell sx={{ color: "#64748b" }}>
                      {chit.startDate}
                    </TableCell>
                    <TableCell>{chit.location}</TableCell>
                    <TableCell align="center">
                      <StatusPill status={chit.status} />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={(e) => openActions(e, chit)}
                        size="small"
                      >
                        <MoreVertIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {chits.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      No chits found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Box sx={{ borderTop: 1, borderColor: "divider" }}>
            <TablePagination
              component="div"
              count={totalChits}
              page={page - 1}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </Box>
        </CardContent>
      </Card>

      {/* ACTIONS & MODALS */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeActions}>
        <MenuItem
          disabled={!selectedChit}
          onClick={() => {
            if (!selectedChit) return;
            localStorage.setItem("selectedChit", JSON.stringify(selectedChit));
            router.push(`/chits/${selectedChit.id}`);
            closeActions();
          }}
        >
          View
        </MenuItem>
        <MenuItem onClick={() => openEditModal(selectedChit)}>Edit</MenuItem>
        <MenuItem onClick={() => handleDelete(selectedChit)}>Delete</MenuItem>
      </Menu>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="sm"
        sx={{
          "& .MuiPaper-root": {
            width: "520px",
            borderRadius: "16px",
            padding: "20px",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, color: "#1e293b" }}>
          {isEditMode ? "Edit Chit" : "Add Chit"}
        </DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}
        >
          <TextField
            placeholder="Chit Name"
            fullWidth
            value={formData.chitName}
            onChange={(e) =>
              setFormData({ ...formData, chitName: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <TextField
            placeholder="Location"
            fullWidth
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          {isEditMode && (
            <FormControl fullWidth>
              <Select
                value={formData.status}
                displayEmpty
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                sx={{ borderRadius: "10px" }}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            placeholder="Amount"
            type="number"
            fullWidth
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <TextField
            placeholder="Monthly Payable Amount"
            type="number"
            fullWidth
            value={formData.monthlyPayableAmount}
            onChange={(e) =>
              setFormData({
                ...formData,
                monthlyPayableAmount: e.target.value,
              })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <TextField
            placeholder="Duration (Months)"
            type="number"
            fullWidth
            value={formData.duration}
            onChange={(e) =>
              setFormData({ ...formData, duration: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <TextField
            placeholder="Total Slots"
            type="number"
            fullWidth
            value={formData.totalSlots}
            onChange={(e) =>
              setFormData({ ...formData, totalSlots: e.target.value })
            }
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", mb: 0.5, display: "block", ml: 0.5 }}
            >
              Start Date
            </Typography>
            <TextField
              type="date"
              fullWidth
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
            />
          </Box>
          <TextField
            placeholder="Due Date / Cycle Day (1-31)"
            type="number"
            fullWidth
            value={formData.dueDate}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || (Number(value) >= 1 && Number(value) <= 31)) {
                setFormData({ ...formData, dueDate: value });
              }
            }}
            inputProps={{ min: 1, max: 31 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setOpenModal(false)}
            sx={{ color: "#64748b", fontWeight: 700 }}
          >
            CANCEL
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveChit}
            sx={{
              borderRadius: "8px",
              px: 3,
              fontWeight: 700,
              backgroundColor: "#1976d2",
              "&:hover": { backgroundColor: "#1565c0" },
            }}
          >
            {isEditMode ? "SAVE CHANGES" : "CREATE CHIT"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        sx={{
          "& .MuiPaper-root": {
            borderRadius: "16px",
            padding: "10px",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#1e293b" }}>
          Delete Confirmation
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#64748b" }}>
            Are you sure you want to delete &quot;
            <b style={{ color: "#1e293b" }}>{chitToDelete?.name}</b>&quot;? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            sx={{ color: "#64748b", fontWeight: 700 }}
          >
            CANCEL
          </Button>
          <Button
            onClick={confirmDeleteAction}
            variant="contained"
            color="error"
            autoFocus
            sx={{ borderRadius: "8px", fontWeight: 700 }}
          >
            DELETE
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChitsPage;
