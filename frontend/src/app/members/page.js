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

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await apiRequest("/member/list", { method: "GET" });

      const membersArray = res?.data?.members || res?.data?.items || [];

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
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

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
  });

  // Debug formData changes
  useEffect(() => {
    console.log("💾 FORM DATA UPDATED:", formData);
  }, [formData]);

  /* MENU ACTIONS */
  const handleMenuOpen = (e, member) => {
    setAnchorEl(e.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => setAnchorEl(null);

  /* ADD */
  const handleAddMember = () => {
    setIsEdit(false);

    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      chitIds: [],
      documents: [],
      status: "Active",
    });

    setOpenModal(true);
  };

  /* EDIT */
  const handleEditMember = () => {
    setIsEdit(true);

    console.log("📝 SELECTED MEMBER RAW:", selectedMember);
    console.log("📝 SELECTED MEMBER CHIT IDS:", selectedMember.chitIds);
    console.log("📝 SELECTED MEMBER CHIT DETAILS:", selectedMember.chitDetails);

    // Ensure chitIds are strings
    const cleanChitIds = (selectedMember.chitIds || [])
      .map(id => {
        if (typeof id === 'object') {
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
    };

    console.log("📝 CLEAN EDIT DATA:", editData);
    setFormData(editData);

    setOpenModal(true);
    handleMenuClose();
  };

  /* DELETE */
  const handleDelete = async () => {
    if (!selectedMember) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedMember.name}?`
    );

    if (!confirmDelete) return;

    try {
      await apiRequest(`/member/delete/${selectedMember.id}`, {
        method: "DELETE",
      });

      await fetchMembers();
      handleMenuClose();
    } catch (err) {
      alert(err.message || "Failed to delete member");
    }
  };

  /* SAVE MEMBER */
  const handleSaveMember = async () => {
    console.log("🔍 FORM DATA BEFORE SAVE:", formData);
    console.log("🔍 CHIT IDS:", formData.chitIds);
    console.log("🔍 DOCUMENTS:", formData.documents);

    if (!formData.name || !formData.phone || formData.chitIds.length === 0) {
      alert("Name, Phone & at least one Chit required");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        chitIds: formData.chitIds.filter(Boolean),
        securityDocuments: formData.documents.filter(Boolean),
      };

      console.log("📤 PAYLOAD BEING SENT:", payload);

      let response;
      if (isEdit) {
        response = await apiRequest(`/member/update/${formData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        response = await apiRequest("/member/create", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      console.log("✅ BACKEND RESPONSE:", response);

      await fetchMembers();
      setOpenModal(false);
      setIsEdit(false);
      alert("Member saved successfully!");
    } catch (err) {
      console.error("❌ ERROR:", err);
      alert(err.message || "Failed to save member");
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

              <Button variant="contained" onClick={handleAddMember}>
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
                startIcon={<AddIcon />}
                <Button variant="contained" onClick={handleAddMember}>
                  Add Member
                </Button>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="max-w-[820px] mx-auto sm:mx-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-3 md:gap-2 mb-6 justify-items-center sm:justify-items-start">
              {/* TOTAL MEMBERS */}
              {/* <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
                <div className="flex items-center gap-3 w-full">
                  <Group
                    sx={{ fontSize: { xs: 30, sm: 34 }, color: "#1e88e5" }}
                  />
                  <div>
                    <Typography variant="h6" fontWeight={600}>
                      <CountUp end={members.length} />
                    </Typography>
                    <Typography variant="body2">Total Members</Typography>
                  </div>
                </div>
              </Card> */}

              {/* ACTIVE */}
              {/* <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
                <div className="flex items-center gap-3 w-full">
                  <CheckCircle
                    sx={{ fontSize: { xs: 30, sm: 34 }, color: "green" }}
                  />
                  <div>
                    <Typography variant="h6" color="green" fontWeight={600}>
                      <CountUp
                        end={
                          members.filter((m) => m.status === "Active").length
                        }
                      />
                    </Typography>
                    <Typography variant="body2">Active</Typography>
                  </div>
                </div>
              </Card> */}

              {/* INACTIVE */}
              {/* <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
                <div className="flex items-center gap-3 w-full">
                  <Cancel
                    sx={{ fontSize: { xs: 30, sm: 34 }, color: "red" }}
                  />
                  <div>
                    <Typography variant="h6" color="red" fontWeight={600}>
                      <CountUp
                        end={
                          members.filter((m) => m.status === "Inactive").length
                        }
                      />
                    </Typography>
                    <Typography variant="body2">Inactive</Typography>
                  </div>
                </div>
              </Card> */}
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
            <CardContent>
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
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
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

              {/* ASSIGNED CHITS - REACT SELECT */}
              <div className="mb-6">
                <Typography
                  variant="body2"
                  sx={{ mb: 1, fontWeight: 500, color: "#666" }}
                >
                  Assigned Chits *
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
                    console.log("🔄 CHITS CHANGED:", newChitIds);
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
                      boxShadow: state.isFocused
                        ? "0 0 0 1px #1976d2"
                        : "none",
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
                      boxShadow: state.isFocused
                        ? "0 0 0 1px #1976d2"
                        : "none",
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
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveMember}>
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </main>
      </div>
    </div>
  );
}