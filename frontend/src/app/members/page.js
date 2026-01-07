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
  Divider,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReactSelect from "react-select";
import makeAnimated from "react-select/animated";
import { apiRequest } from "@/config/api";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

const animatedComponents = makeAnimated();

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

const MembersPage = () => {
  /* ===================== STATE ====================== */
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [chits, setChits] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [filterChit, setFilterChit] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Modals & Actions
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    phone: "",
    email: "",
    address: "",
    chitIds: [], // Stores [{ chitId, slots }]
    documents: [],
    status: "Active",
    sendEmail: false,
  });

  const [chitLimitError, setChitLimitError] = useState("");
  const [selectedChitForAdd, setSelectedChitForAdd] = useState(""); // For the dropdown in Modal

  // Notification
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  /* ===================== FETCH DATA ====================== */

  // Fetch Chits (for Dropdowns)
  useEffect(() => {
    const fetchChits = async () => {
      try {
        const res = await apiRequest("/chit/list?limit=100"); // Fetch all/many for dropdown
        const chitsArray = res?.data?.chits || res?.data?.items || [];
        setChits(
          chitsArray.map((c) => ({
            id: c._id || c.id,
            name: c.chitName,
            location: c.location,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch chits", err);
      }
    };
    fetchChits();
  }, []);

  // Debounced Search Terms
  const [debouncedSearchName, setDebouncedSearchName] = useState("");
  const [debouncedSearchPhone, setDebouncedSearchPhone] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchName(searchName);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchPhone(searchPhone);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchPhone]);

  // Fetch Members (with Filters & Pagination)
  useEffect(() => {
    const hasChitsLoaded = chits.length > 0 || filterChit === "";
    // Only fetch if initial chits are loaded or if we don't care about the chit filter
    if (hasChitsLoaded) {
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    rowsPerPage,
    filterChit,
    filterStatus,
    debouncedSearchName,
    debouncedSearchPhone,
    filterLocation,
  ]);
  // Note: searchName and searchPhone might need debouncing in production,
  // but for now direct dependency is fine if user hits enter or types slow.
  // Ideally, add a debounce or a "Search" button. For now, matching "clean" react.

  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Build Query Params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
      });

      // Only use searchPhone if it has actual digits (not just country code like "+91")
      // PhoneInput may set default country code, we don't want that to filter results
      const hasPhoneDigits =
        searchPhone && searchPhone.replace(/[\s\-\+]/g, "").length > 2;
      const querySearch = searchName || (hasPhoneDigits ? searchPhone : "");
      if (querySearch) params.append("search", querySearch);

      if (filterChit) params.append("chitId", filterChit);
      if (filterStatus) params.append("status", filterStatus);

      const res = await apiRequest(`/member/list?${params.toString()}`);

      const membersArray = res?.data?.members || res?.data?.items || [];
      const paginationData = res?.data?.pagination || {};

      setTotalItems(paginationData.totalItems || 0);

      // Format Members (using populated data directly from backend)
      const formattedMembers = membersArray.map((m) => {
        return {
          id: m._id,
          memberId: m.memberId, // Auto-generated ID like MID001
          name: m.name,
          phone: m.phone,
          email: m.email,
          address: m.address,
          status: m.status,
          chitIds: (m.chits || []).map((c) => ({
            chitId: c.chitId?._id || c.chitId,
            slots: c.slots || 1,
          })),
          chitDetails: (m.chits || []).map((c) => ({
            id: c.chitId?._id || c.chitId,
            name: c.chitId?.chitName || "Unknown Chit",
            location: c.chitId?.location,
            totalSlots: c.chitId?.totalSlots,
            slots: c.slots || 1,
          })),
          securityDocuments: m.securityDocuments || [],
        };
      });

      // Filter by location client-side if needed (since backend might not support location filter on members directly yet)
      // Backend doesn't support 'location' in getMembers.
      // So we filter formattedMembers. BUT this only filters the current page.
      // Ideally backend should handle this. For now, I will keep client-side location filter on the fetched page (not ideal but safe refactor).

      let finalMembers = formattedMembers;
      if (filterLocation) {
        finalMembers = finalMembers.filter((m) =>
          m.chitDetails.some((cd) => cd.location === filterLocation)
        );
      }

      setMembers(finalMembers);
    } catch (err) {
      console.error("Failed to fetch members", err);
      showNotification("Failed to load members", "error");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== HANDLERS ====================== */

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleMenuOpen = (e, member) => {
    setAnchorEl(e.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewPDF = () => {
    if (!selectedMember) return;
    const token = localStorage.getItem("token");
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const reportUrl = `${baseUrl}/member/report/${selectedMember.id}?token=${token}`;
    window.open(reportUrl, "_blank");
    handleMenuClose();
  };

  const handleAddMember = () => {
    setIsEdit(false);
    setChitLimitError("");
    setFormData({
      id: null,
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

  const handleEditMember = () => {
    if (!selectedMember) return;
    setIsEdit(true);
    setChitLimitError("");

    setFormData({
      id: selectedMember.id,
      name: selectedMember.name,
      phone: selectedMember.phone,
      email: selectedMember.email,
      address: selectedMember.address,
      chitIds: selectedMember.chitIds || [], // This is now [{ chitId, slots }]
      documents: selectedMember.securityDocuments || [],
      status: selectedMember.status,
      sendEmail: false,
    });
    setOpenModal(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (!selectedMember) return;
    setConfirmOpen(true);
    handleMenuClose();
  };

  const confirmDeleteAction = async () => {
    if (!selectedMember) return;
    try {
      await apiRequest(`/member/delete/${selectedMember.id}`, "DELETE");
      showNotification("Member deleted successfully");
      fetchMembers();
    } catch (err) {
      showNotification(err.message || "Failed to delete member", "error");
    } finally {
      setConfirmOpen(false);
      setSelectedMember(null);
    }
  };

  const handleSaveMember = async () => {
    if (!formData.name || !formData.phone || formData.chitIds.length === 0) {
      showNotification("Name, Phone & at least one Chit required", "warning");
      return;
    }

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
        chitIds: formData.chitIds,
        securityDocuments: formData.documents,
        sendEmail: formData.sendEmail,
      };

      if (isEdit && formData.id) {
        await apiRequest(`/member/update/${formData.id}`, "PUT", payload);
        showNotification("Member updated successfully!");
      } else {
        await apiRequest("/member/create", "POST", payload);
        showNotification("Member created successfully!");
      }

      setOpenModal(false);
      fetchMembers();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save member";
      if (msg.includes("already slots are filled")) {
        setChitLimitError(msg);
      }
      showNotification(msg, "error");
    }
  };

  /* ===================== RENDER ====================== */

  // Extract unique locations from loaded chits for filter (case-insensitive)
  const LOCATIONS = [
    ...new Set(
      chits
        .map((c) => c.location)
        .filter(Boolean)
        .map((loc) => loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase())
    ),
  ].sort();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <main className="flex-1 w-full min-w-0 p-4 sm:p-6">
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            mb: 6,
            gap: 2,
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
            Member Management
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
              onClick={handleAddMember}
              sx={{
                backgroundColor: "#2563eb",
                borderRadius: "8px",
                padding: "10px 24px",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.05em",
                "&:hover": { backgroundColor: "#1d4ed8" },
              }}
            >
              ADD MEMBER
            </Button>
          </Box>
        </Box>

        {/* FILTERS */}
        <Card
          elevation={0}
          className="filter-card-mobile"
          sx={{
            p: 2.5,
            mb: 4,
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div className="flex flex-wrap gap-4 items-center filters-container-mobile">
            <TextField
              size="small"
              placeholder="Search Name/Phone"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              sx={{
                maxWidth: { sm: 220 },
                width: "100%",
                "& .MuiOutlinedInput-root": { borderRadius: "10px" },
              }}
            />

            <Box
              sx={{
                maxWidth: { sm: 220 },
                width: "100%",
                height: 40,
                display: "flex",
                alignItems: "center",
              }}
            >
              <PhoneInput
                defaultCountry="in"
                value={searchPhone}
                onChange={(phone) => setSearchPhone(phone)}
                placeholder="Phone Check"
                style={{
                  "--react-international-phone-height": "40px",
                  width: "100%",
                }}
                inputStyle={{
                  width: "100%",
                  height: "40px",
                  fontSize: "14px",
                  borderRadius: "0 10px 10px 0",
                  borderColor: "#cbd5e1",
                  borderLeft: "none",
                }}
                countrySelectorStyleProps={{
                  buttonStyle: {
                    height: "40px",
                    borderRadius: "10px 0 0 10px",
                    borderColor: "#cbd5e1",
                    padding: "0 8px",
                  },
                }}
              />
            </Box>

            <FormControl
              size="small"
              sx={{ maxWidth: { sm: 200 }, width: "100%" }}
            >
              <Select
                value={filterChit}
                displayEmpty
                onChange={(e) => setFilterChit(e.target.value)}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="">All Chits</MenuItem>
                {chits.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ maxWidth: { sm: 180 }, width: "100%" }}
            >
              <Select
                value={filterLocation}
                displayEmpty
                onChange={(e) => setFilterLocation(e.target.value)}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="">All Locations</MenuItem>
                {LOCATIONS.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ maxWidth: { sm: 150 }, width: "100%" }}
            >
              <Select
                value={filterStatus}
                displayEmpty
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ borderRadius: "10px" }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Typography
              sx={{
                cursor: "pointer",
                color: "#64748b",
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                "&:hover": { color: "#2563eb" },
                ml: "auto",
              }}
              onClick={() => {
                setSearchName("");
                setSearchPhone("");
                setFilterChit("");
                setFilterStatus("");
                setFilterLocation("");
              }}
            >
              Reset Filters
            </Typography>
          </div>
        </Card>

        {/* TABLE */}
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <CardContent className="p-0 table-container-mobile">
            <div className="overflow-x-auto">
              <Table className="min-w-max">
                <TableHead sx={tableHeaderSx}>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>NAME</TableCell>
                    <TableCell>PHONE</TableCell>
                    <TableCell>ADDRESS</TableCell>
                    <TableCell align="center">STATUS</TableCell>
                    <TableCell align="center">ACTIONS</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {members.map((m) => (
                    <TableRow
                      key={m.id}
                      sx={{
                        "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                        "&:hover": { backgroundColor: "#f1f5f9" },
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          color: "#64748b",
                          fontSize: "11px",
                        }}
                      >
                        {m.memberId || `#${m.id.slice(-6).toUpperCase()}`}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                        {m.name}
                      </TableCell>
                      <TableCell sx={{ color: "#475569", fontWeight: 500 }}>
                        {m.phone}
                      </TableCell>
                      <TableCell sx={{ color: "#64748b", fontSize: "13px" }}>
                        {m.address}
                      </TableCell>
                      <TableCell align="center">
                        <StatusPill status={m.status} />
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, m)}
                          sx={{
                            color: "#64748b",
                            "&:hover": {
                              color: "#1e293b",
                              backgroundColor: "#f1f5f9",
                            },
                          }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {members.length === 0 && !loading && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 8, color: "#94a3b8" }}
                      >
                        No members found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Box sx={{ borderTop: 1, borderColor: "divider" }}>
              <TablePagination
                component="div"
                count={totalItems}
                page={page - 1}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </Box>
          </CardContent>
        </Card>

        {/* ACTION MENU */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          elevation={3}
          sx={{
            "& .MuiPaper-root": {
              borderRadius: "12px",
              minWidth: "160px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "1px solid #f1f5f9",
            },
          }}
        >
          <MenuItem
            onClick={() =>
              (window.location.href = `/members/${selectedMember?.id}`)
            }
            sx={{
              fontWeight: 600,
              color: "#1e293b",
              fontSize: "14px",
              py: 1.2,
              gap: 1.5,
            }}
          >
            <VisibilityIcon sx={{ fontSize: 18, color: "#64748b" }} />
            View Details
          </MenuItem>
          <MenuItem
            onClick={handleEditMember}
            sx={{
              fontWeight: 600,
              color: "#1e293b",
              fontSize: "14px",
              py: 1.2,
              gap: 1.5,
            }}
          >
            <EditIcon sx={{ fontSize: 18, color: "#64748b" }} />
            Edit
          </MenuItem>
          <MenuItem
            onClick={handleViewPDF}
            sx={{
              fontWeight: 600,
              color: "#1e293b",
              fontSize: "14px",
              py: 1.2,
              gap: 1.5,
            }}
          >
            <PictureAsPdfIcon sx={{ fontSize: 18, color: "#166534" }} />
            View PDF Report
          </MenuItem>
          <Divider sx={{ my: 0.5, borderColor: "#f1f5f9" }} />
          <MenuItem
            onClick={handleDelete}
            sx={{
              fontWeight: 600,
              color: "#ef4444",
              fontSize: "14px",
              py: 1.2,
              gap: 1.5,
            }}
          >
            <DeleteIcon sx={{ fontSize: 18, color: "#ef4444" }} />
            Delete
          </MenuItem>
        </Menu>

        {/* MODAL */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          fullWidth
          sx={{
            "& .MuiPaper-root": {
              borderRadius: "16px",
              padding: "20px",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, color: "#1e293b", pb: 1 }}>
            {isEdit ? "Edit Member" : "Add Member"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                mb: 3,
                mt: 1,
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
                Important: A valid email address is required for the member to
                receive their welcome PDF report automatically.
              </Typography>
            </Box>
            <TextField
              fullWidth
              sx={{
                mb: 3,
                mt: 1,
                "& .MuiOutlinedInput-root": { borderRadius: "10px" },
              }}
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 0.5,
                  fontWeight: 500,
                  color: "#666",
                  fontSize: "0.75rem",
                }}
              >
                Phone Number
              </Typography>
              <PhoneInput
                defaultCountry="in"
                value={formData.phone}
                onChange={(phone) => setFormData({ ...formData, phone })}
                style={{
                  "--react-international-phone-height": "56px",
                  width: "100%",
                }}
                inputStyle={{
                  width: "100%",
                  height: "56px",
                  fontSize: "16px",
                  borderRadius: "0 10px 10px 0",
                  borderColor: "#cbd5e1",
                  borderLeft: "none",
                }}
                countrySelectorStyleProps={{
                  buttonStyle: {
                    height: "56px",
                    borderRadius: "10px 0 0 10px",
                    borderColor: "#cbd5e1",
                    padding: "0 12px",
                  },
                }}
              />
            </Box>

            <TextField
              fullWidth
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": { borderRadius: "10px" },
              }}
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": { borderRadius: "10px" },
              }}
              placeholder="Physical Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />

            {isEdit && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Select
                  value={formData.status}
                  displayEmpty
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  sx={{ borderRadius: "10px" }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}

            <div className="mb-6">
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "#1e293b" }}
              >
                Assigned Chits
              </Typography>

              {/* Add Chit Row */}
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedChitForAdd}
                    displayEmpty
                    onChange={(e) => setSelectedChitForAdd(e.target.value)}
                    sx={{ borderRadius: "8px" }}
                  >
                    <MenuItem value="">Select a Chit to Add</MenuItem>
                    {chits
                      .filter(
                        (c) =>
                          !formData.chitIds.some(
                            (assignment) => assignment.chitId === c.id
                          )
                      )
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} - {c.location}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (!selectedChitForAdd) return;
                    setFormData({
                      ...formData,
                      chitIds: [
                        ...formData.chitIds,
                        { chitId: selectedChitForAdd, slots: 1 },
                      ],
                    });
                    setSelectedChitForAdd("");
                  }}
                  startIcon={<AddIcon />}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Add
                </Button>
              </Box>

              {/* Assignments Table */}
              {formData.chitIds.length > 0 && (
                <Box
                  sx={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: "12px" }}>
                          CHIT NAME
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, fontSize: "12px" }}
                          align="center"
                        >
                          SLOTS
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, fontSize: "12px" }}
                          align="center"
                        >
                          ACTION
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.chitIds.map((assignment, index) => {
                        const chitData = chits.find(
                          (c) => c.id === assignment.chitId
                        );
                        return (
                          <TableRow key={assignment.chitId}>
                            <TableCell sx={{ fontSize: "13px" }}>
                              <Typography variant="body2" fontWeight={500}>
                                {chitData?.name || "Unknown"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {chitData?.location || ""}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                value={assignment.slots}
                                inputProps={{
                                  min: 1,
                                  style: { textAlign: "center", width: "40px" },
                                }}
                                onChange={(e) => {
                                  const val = Math.max(
                                    1,
                                    parseInt(e.target.value) || 1
                                  );
                                  const newChitIds = [...formData.chitIds];
                                  newChitIds[index].slots = val;
                                  setFormData({
                                    ...formData,
                                    chitIds: newChitIds,
                                  });
                                }}
                                variant="standard"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  const newChitIds = formData.chitIds.filter(
                                    (_, i) => i !== index
                                  );
                                  setFormData({
                                    ...formData,
                                    chitIds: newChitIds,
                                  });
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {chitLimitError && (
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: "error.main", fontWeight: 500 }}
                >
                  {chitLimitError}
                </Typography>
              )}
            </div>

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
                value={formData.documents.map((d) => ({ value: d, label: d }))}
                onChange={(selected) => {
                  setFormData({
                    ...formData,
                    documents: selected ? selected.map((s) => s.value) : [],
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
                }}
              />
            </div>

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.sendEmail}
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

          <DialogActions sx={{ px: 3, pb: 4, gap: 1 }}>
            <Button
              onClick={() => setOpenModal(false)}
              sx={{
                color: "#64748b",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveMember}
              sx={{
                borderRadius: "8px",
                px: 3,
                fontWeight: 700,
                backgroundColor: "#2563eb",
                textTransform: "uppercase",
                "&:hover": { backgroundColor: "#1d4ed8" },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* ALERTS */}
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

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Delete Confirmation</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete &quot;
              <b>{selectedMember?.name}</b>&quot;? This action cannot be undone.
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
  );
};

export default MembersPage;
