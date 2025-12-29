"use client";
import { useState, useEffect } from "react";
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
  Select,
  InputLabel,
  FormControl,
  TablePagination,
  Box,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Group, CheckCircle, Cancel } from "@mui/icons-material";
import CountUp from "react-countup";
import ReactSelect from "react-select";
import makeAnimated from "react-select/animated";
import { apiRequest } from "@/config/api";
import AddIcon from "@mui/icons-material/Add";

const animatedComponents = makeAnimated();

/* ===================== DOCUMENT OPTIONS ====================== */
const securityDocumentOptions = [
  "Aadhaar Card",
  "PAN Card",
  "Ration Card",
  "Bank Passbook Copy",
  "Property Document",
  "Electricity Bill",
  "Salary Slip",
  "Cheque Leaf",
  "Guarantee Letter",
  "Any Other",
];

export default function MembersPage() {
  /* ===================== PAGINATION STATE ====================== */
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  /* ===================== LOAD CHITS ====================== */
  const [chits, setChits] = useState([]);

  useEffect(() => {
    fetchChits();
  }, []);

  const fetchChits = async () => {
    try {
      const res = await apiRequest("/chit/list", { method: "GET" });

      const chitsArray = res?.data?.chits || res?.data?.items || [];

      const formattedChits = chitsArray.map((c) => ({
        id: c._id || c.id,
        name: c.chitName,
        location: c.location,
      }));

      setChits(formattedChits);
    } catch (err) {
      console.error("Failed to fetch chits", err);
      setChits([]);
    }
  };

  useEffect(() => {
    console.log("CHITS DATA 👉", chits);
  }, [chits]);

  const LOCATIONS = [...new Set(chits.map((c) => c.location))];

  /* ===================== MEMBERS ====================== */
  const [members, setMembers] = useState([]);

  // 🔥 FETCH MEMBERS WITH PAGINATION
  useEffect(() => {
    fetchMembers();
  }, [page, rowsPerPage]); // Refetch when page or rowsPerPage changes

  const fetchMembers = async () => {
    try {
      // 🔥 ADD PAGINATION PARAMETERS TO API CALL
      const res = await apiRequest(
        `/member/list?page=${page}&limit=${rowsPerPage}`,
        { method: "GET" }
      );

      const membersArray = res?.data?.members || res?.data?.items || [];

      // 🔥 EXTRACT PAGINATION DATA
      const paginationData = res?.data?.pagination || {};
      setTotalItems(paginationData.totalItems || 0);
      setTotalPages(paginationData.totalPages || 0);

      const formattedMembers = membersArray.map((m) => {
        // Extract chitIds from the chits array - handle both string and object cases
        const chitIds = (m.chits || [])
          .map((c) => {
            // If c.chitId is an object with _id or id property
            if (typeof c.chitId === "object" && c.chitId !== null) {
              return c.chitId._id || c.chitId.id;
            }
            // If c.chitId is already a string
            return c.chitId;
          })
          .filter(Boolean);

        console.log("🔍 Member chits raw:", m.chits);
        console.log("🔍 Extracted chitIds:", chitIds);

        // Match with loaded chits to get names
        const chitDetails = chitIds.map((chitId) => {
          const matchedChit = chits.find((ch) => ch.id === chitId);
          return {
            id: chitId,
            name: matchedChit?.name || "Unknown Chit",
          };
        });

        return {
          id: m._id,
          name: m.name,
          phone: m.phone,
          email: m.email,
          address: m.address,
          status: m.status,
          chitIds: chitIds, // Array of strings
          chitDetails: chitDetails, // Array of {id, name}
          documents: m.securityDocuments || [],
        };
      });

      console.log("✅ Formatted members:", formattedMembers);
      setMembers(formattedMembers);
    } catch (err) {
      console.error("Failed to fetch members", err);
      setMembers([]);
      setTotalItems(0);
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  /* ================= CONFIRM DIALOG STATE ================= */
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  /* FILTER STATES */
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [filterChit, setFilterChit] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    chitIds: [],
    documents: [],
    status: "Active",
    sendEmail: false,
  });

  const [chitLimitError, setChitLimitError] = useState("");

  /* ===================== NOTIFICATION STATE ====================== */
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success", // success | error | warning | info
  });

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Debug formData changes
  useEffect(() => {
    console.log("💾 FORM DATA UPDATED:", formData);
  }, [formData]);

  // 🔥 PAGINATION HANDLERS
  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1); // Material-UI uses 0-based index, API uses 1-based
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset to first page when changing rows per page
  };

  /* MENU ACTIONS */
  const handleMenuOpen = (e, member) => {
    setAnchorEl(e.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => setAnchorEl(null);

  /* ADD */
  const handleAddMember = () => {
    setIsEdit(false);
    setChitLimitError(""); // ✅ clear old backend error

    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      chitIds: [],
      documents: [],
      status: "Active",
      sendEmail: false,
    });

    setOpenModal(true);
  };

  /* EDIT */
  const handleEditMember = () => {
    setIsEdit(true);
    setChitLimitError(""); // ✅ clear error

    // Ensure chitIds are strings
    const cleanChitIds = (selectedMember.chitIds || [])
      .map((id) => {
        if (typeof id === "object") {
          return id._id || id.id || null;
        }
        return id;
      })
      .filter(Boolean);

    const editData = {
      id: selectedMember.id,
      name: selectedMember.name,
      phone: selectedMember.phone,
      email: selectedMember.email,
      address: selectedMember.address,
      chitIds: cleanChitIds,
      documents: selectedMember.documents || [],
      status: selectedMember.status,
      sendEmail: false,
    };

    console.log("📝 CLEAN EDIT DATA:", editData);
    setFormData(editData);

    setOpenModal(true);
    handleMenuClose();
  };

  /* DELETE */
  const handleDelete = () => {
    if (!selectedMember) return;
    setMemberToDelete(selectedMember);
    setConfirmOpen(true);
    handleMenuClose(); // Close the action menu
  };

  const confirmDeleteAction = async () => {
    if (!memberToDelete) return;

    try {
      await apiRequest(`/member/delete/${memberToDelete.id}`, {
        method: "DELETE",
      });

      showNotification("Member deleted successfully");
      // 🔥 REFETCH DATA AFTER DELETE
      fetchMembers();
    } catch (err) {
      showNotification(err.message || "Failed to delete member", "error");
    } finally {
      setConfirmOpen(false);
      setMemberToDelete(null);
    }
  };

  /* SAVE MEMBER */
  const handleSaveMember = async () => {
    console.log("🔍 FORM DATA BEFORE SAVE:", formData);
    console.log("🔍 CHIT IDS:", formData.chitIds);
    console.log("🔍 DOCUMENTS:", formData.documents);

    if (!formData.name || !formData.phone || formData.chitIds.length === 0) {
      showNotification("Name, Phone & at least one Chit required", "warning");
      return;
    }

    // ✅ VALIDATION: Phone must be exactly 10 digits
    if (!/^\d{10}$/.test(formData.phone)) {
      showNotification("Phone number must be exactly 10 digits", "warning");
      return;
    }

    // ✅ VALIDATION: Email format (if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showNotification("Invalid email format", "warning");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        status: formData.status,
        chitIds: formData.chitIds.filter(Boolean),
        securityDocuments: formData.documents.filter(Boolean),
        sendEmail: formData.sendEmail,
      };

      console.log("📤 PAYLOAD BEING SENT:", payload);

      if (isEdit) {
        await apiRequest(`/member/update/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        showNotification("Member updated successfully!");
      } else {
        await apiRequest("/member/create", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        showNotification("Member created successfully!");
      }

      setOpenModal(false);
      setIsEdit(false);
      // 🔥 REFETCH DATA AFTER SAVE
      fetchMembers();
    } catch (err) {
      console.error("❌ ERROR:", err);

      // ✅ If chit member limit reached
      if (err.message?.includes("Chit member limit reached")) {
        setChitLimitError(err.message);
        showNotification(err.message, "error");
      } else {
        showNotification(err.message || "Failed to save member", "error");
      }
    }
  };

  /* FILTERED MEMBERS */
  const filteredMembers = members.filter((m) => {
    const matchesName = m.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesPhone = m.phone.includes(searchPhone);
    const matchesChit = filterChit === "" || m.chitIds.includes(filterChit);
    const matchesStatus = filterStatus === "" || m.status === filterStatus;

    // Get locations from member's chits
    const memberLocations = m.chitDetails
      .map((cd) => {
        const chit = chits.find((c) => c.id === cd.id);
        return chit?.location;
      })
      .filter(Boolean);

    const matchesLocation =
      filterLocation === "" || memberLocations.includes(filterLocation);

    return (
      matchesName &&
      matchesPhone &&
      matchesChit &&
      matchesStatus &&
      matchesLocation
    );
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="flex-1 w-full min-w-0">
        <main className="p-4 sm:p-6">
          {/* HEADER */}
          <div className="relative mb-6">
            {/* MOBILE VIEW */}
            <div className="flex flex-col items-center gap-3 sm:hidden">
              <Typography
                variant="h5"
                fontWeight={600}
                sx={{ textAlign: "center" }}
              >
                Member Management
              </Typography>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddMember}
              >
                Add Member
              </Button>
            </div>

            {/* TABLET & DESKTOP VIEW */}
            <div className="hidden sm:flex items-center justify-center px-16">
              <Typography
                variant="h4"
                fontWeight={600}
                sx={{
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  color: "#000",
                }}
              >
                Member Management
              </Typography>

              <div className="absolute right-0">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddMember}
                >
                  Add Member
                </Button>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <Card sx={{ p: 2, mb: 3 }}>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search Name */}
              <TextField
                fullWidth
                size="small"
                label="Search Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                sx={{ maxWidth: { sm: 220 } }}
              />

              {/* Phone */}
              <TextField
                fullWidth
                size="small"
                label="Phone"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                sx={{ maxWidth: { sm: 220 } }}
              />

              {/* Chit Filter */}
              <FormControl
                fullWidth
                size="small"
                sx={{ maxWidth: { sm: 220 } }}
              >
                <InputLabel>Chit</InputLabel>
                <Select
                  value={filterChit}
                  label="Chit"
                  onChange={(e) => setFilterChit(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {chits.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Location */}
              <FormControl
                fullWidth
                size="small"
                sx={{ maxWidth: { sm: 220 } }}
              >
                <InputLabel>Location</InputLabel>
                <Select
                  value={filterLocation}
                  label="Location"
                  onChange={(e) => setFilterLocation(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {LOCATIONS.map((loc) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Status */}
              <FormControl
                fullWidth
                size="small"
                sx={{ maxWidth: { sm: 220 } }}
              >
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              {/* Clear Filters */}
              <Typography
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  textAlign: { xs: "right", sm: "left" },
                  ml: { sm: "auto" },
                  cursor: "pointer",
                  color: "#2563eb",
                  fontWeight: 600,
                }}
                onClick={() => {
                  setSearchName("");
                  setSearchPhone("");
                  setFilterChit("");
                  setFilterStatus("");
                  setFilterLocation("");
                }}
              >
                Clear Filters
              </Typography>
            </div>
          </Card>

          {/* TABLE WITH MOBILE SCROLL */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                <Table className="min-w-max">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Address</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredMembers.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.id}</TableCell>
                        <TableCell>{m.name}</TableCell>
                        <TableCell>{m.phone}</TableCell>
                        <TableCell>{m.address}</TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              m.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {m.status}
                          </span>
                        </TableCell>

                        <TableCell align="center">
                          <IconButton onClick={(e) => handleMenuOpen(e, m)}>
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 🔥 PAGINATION CONTROLS */}
              <Box sx={{ borderTop: 1, borderColor: "divider" }}>
                <TablePagination
                  component="div"
                  count={totalItems}
                  page={page - 1} // Material-UI uses 0-based index
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Rows per page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} of ${
                      count !== -1 ? count : `more than ${to}`
                    }`
                  }
                />
              </Box>
            </CardContent>
          </Card>

          {/* ACTION MENU */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() =>
                (window.location.href = `/members/${selectedMember?.id}`)
              }
            >
              View Details
            </MenuItem>

            <MenuItem onClick={handleEditMember}>Edit</MenuItem>

            <MenuItem sx={{ color: "red" }} onClick={handleDelete}>
              Delete
            </MenuItem>
          </Menu>

          {/* ADD / EDIT MODAL */}
          <Dialog
            open={openModal}
            onClose={() => setOpenModal(false)}
            fullWidth
          >
            <DialogTitle>{isEdit ? "Edit Member" : "Add Member"}</DialogTitle>

            <DialogContent>
              <TextField
                fullWidth
                sx={{ mb: 3, mt: 1 }}
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <TextField
                fullWidth
                sx={{ mb: 3 }}
                label="Phone"
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({ ...formData, phone: val });
                }}
              />

              <TextField
                fullWidth
                sx={{ mb: 3 }}
                label="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                sx={{ mb: 3 }}
                label="Address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              {isEdit && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status || "Active"}
                    label="Status"
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* ASSIGNED CHITS - REACT SELECT */}
              <div className="mb-6">
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#666" }}
                >
                  Assigned Chits
                </Typography>
                <ReactSelect
                  isMulti
                  components={animatedComponents}
                  options={chits.map((c) => ({
                    value: c.id,
                    label: `${c.name} - ${c.location}`,
                  }))}
                  value={
                    Array.isArray(formData.chitIds)
                      ? formData.chitIds
                          .map((chitId) => {
                            const chit = chits.find((c) => c.id === chitId);
                            return chit
                              ? {
                                  value: chit.id,
                                  label: `${chit.name} - ${chit.location}`,
                                }
                              : null;
                          })
                          .filter(Boolean)
                      : []
                  }
                  onChange={(selected) => {
                    const newChitIds = selected
                      ? selected.map((s) => s.value)
                      : [];

                    setChitLimitError(""); // ✅ clear error when user changes chit

                    setFormData({
                      ...formData,
                      chitIds: newChitIds,
                    });
                  }}
                  placeholder="Select chits..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: "56px",
                      borderColor: state.isFocused ? "#1976d2" : "#c4c4c4",
                      boxShadow: state.isFocused ? "0 0 0 1px #1976d2" : "none",
                      "&:hover": {
                        borderColor: "#000",
                      },
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#e3f2fd",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#1976d2",
                      fontWeight: 500,
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "#1976d2",
                      "&:hover": {
                        backgroundColor: "#1976d2",
                        color: "white",
                      },
                    }),
                  }}
                />
                {chitLimitError && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      color: "error.main",
                      fontWeight: 500,
                    }}
                  >
                    {chitLimitError}
                  </Typography>
                )}
              </div>

              {/* SECURITY DOCUMENTS - REACT SELECT */}
              <div className="mb-3">
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#666" }}
                >
                  Security Documents
                </Typography>
                <ReactSelect
                  isMulti
                  components={animatedComponents}
                  options={securityDocumentOptions.map((doc) => ({
                    value: doc,
                    label: doc,
                  }))}
                  value={
                    Array.isArray(formData.documents)
                      ? formData.documents.map((d) => ({
                          value: d,
                          label: d,
                        }))
                      : []
                  }
                  onChange={(selected) => {
                    const newDocuments = selected
                      ? selected.map((s) => s.value)
                      : [];
                    console.log("🔄 DOCUMENTS CHANGED:", newDocuments);
                    setFormData({
                      ...formData,
                      documents: newDocuments,
                    });
                  }}
                  placeholder="Select documents..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: "56px",
                      borderColor: state.isFocused ? "#1976d2" : "#c4c4c4",
                      boxShadow: state.isFocused ? "0 0 0 1px #1976d2" : "none",
                      "&:hover": {
                        borderColor: "#000",
                      },
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#f3e5f5",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#7b1fa2",
                      fontWeight: 500,
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "#7b1fa2",
                      "&:hover": {
                        backgroundColor: "#7b1fa2",
                        color: "white",
                      },
                    }),
                  }}
                />
              </div>

              {/* SEND EMAIL CHECKBOX */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sendEmail || false}
                    onChange={(e) =>
                      setFormData({ ...formData, sendEmail: e.target.checked })
                    }
                    color="primary"
                  />
                }
                label="Send Email Notification with PDF"
                sx={{ mb: 1 }}
              />
              {!formData.email && formData.sendEmail && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: "block", mb: 2 }}
                >
                  * Please provide an email address to send notifications.
                </Typography>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveMember}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* NOTIFICATION SNACKBAR */}
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

          {/* DELETE CONFIRMATION DIALOG */}
          <Dialog
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            aria-labelledby="delete-dialog-title"
          >
            <DialogTitle id="delete-dialog-title">
              Delete Confirmation
            </DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete "<b>{memberToDelete?.name}</b>
                "? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setConfirmOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteAction}
                variant="contained"
                color="error"
                autoFocus
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
