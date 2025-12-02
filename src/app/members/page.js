"use client";

import { useState } from "react";
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
  OutlinedInput,
  Chip,
} from "@mui/material";

import { Checkbox } from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Group, CheckCircle, Cancel } from "@mui/icons-material";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";
import CountUp from "react-countup";

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

const chitOptions = ["1,00,000 Chit", "50,000 Chit", "25,000 Chit"];

export default function MembersPage() {
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "Gireeshma Reddy",
      phone: "9876501234",
      chit: "1,00,000 Chit",
      status: "Active",
      email: "gireeshma@gmail.com",
      address: "Hyderabad",
      documents: ["Aadhaar Card", "PAN Card"],
    },
    {
      id: 2,
      name: "Sahana R",
      phone: "9900123456",
      chit: "50,000 Chit",
      status: "Inactive",
      email: "sahana@gmail.com",
      address: "Bangalore",
      documents: ["Electricity Bill"],
    },
  ]);

  /* ---------------- FILTER STATES ---------------- */
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    chit: "",
    status: "",
  });

  const filteredMembers = members.filter((m) => {
    return (
      (filters.name === "" ||
        m.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.phone === "" || m.phone.includes(filters.phone)) &&
      (filters.chit === "" || m.chit === filters.chit) &&
      (filters.status === "" || m.status === filters.status)
    );
  });

  const clearFilters = () => {
    setFilters({
      name: "",
      phone: "",
      chit: "",
      status: "",
    });
  };

  /* ---------------- MENU & DIALOG ---------------- */
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  // NEW VIEW MODAL STATE
  const [viewModal, setViewModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    chit: "",
    documents: [],
    status: "Active",
  });

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddMember = () => {
    setIsEdit(false);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      chit: "",
      documents: [],
      status: "Active",
    });
    setOpenModal(true);
  };

  const handleEditMember = () => {
    setIsEdit(true);
    setFormData(selectedMember);
    setOpenModal(true);
    handleMenuClose();
  };

  const handleSaveMember = () => {
   if (isEdit) {
  setMembers((prev) =>
    prev.map((m) => (m.id === selectedMember.id ? formData : m))
  );
} else {
  setMembers((prev) => [...prev, { ...formData, id: prev.length + 1 }]);
}
setOpenModal(false);

  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h5" fontWeight="600" color="black">
              Member Management
            </Typography>
            <Button variant="contained" onClick={handleAddMember}>
              Add Member
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Group sx={{ fontSize: 35, color: "#1e88e5" }} />
              </div>
              <div>
                <Typography variant="subtitle2">Total Members</Typography>
                <Typography variant="h4" fontWeight="600" color="black">
                  <CountUp end={members.length} duration={1.2} />
                </Typography>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle sx={{ fontSize: 35, color: "green" }} />
              </div>
              <div>
                <Typography variant="subtitle2">Active Members</Typography>
                <Typography variant="h4" fontWeight="600" color="green">
                  <CountUp
                    end={members.filter((m) => m.status === "Active").length}
                    duration={1.2}
                  />
                </Typography>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Cancel sx={{ fontSize: 35, color: "red" }} />
              </div>
              <div>
                <Typography variant="subtitle2">Inactive Members</Typography>
                <Typography variant="h4" fontWeight="600" color="red">
                  <CountUp
                    end={members.filter((m) => m.status === "Inactive").length}
                    duration={1.2}
                  />
                </Typography>
              </div>
            </Card>
          </div>

          {/* ---------------- FILTER BAR ---------------- */}
          <Card className="p-5 mb-6 shadow-sm border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Search Name</label>
                <TextField
                  size="small"
                  placeholder="Enter name"
                  value={filters.name}
                  onChange={(e) =>
                    setFilters({ ...filters, name: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Search Phone</label>
                <TextField
                  size="small"
                  placeholder="Enter phone"
                  value={filters.phone}
                  onChange={(e) =>
                    setFilters({ ...filters, phone: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Chit</label>
                <FormControl size="small">
                  <Select
                    displayEmpty
                    value={filters.chit}
                    onChange={(e) =>
                      setFilters({ ...filters, chit: e.target.value })
                    }
                  >
                    <MenuItem value="">
                      <span className="text-gray-400">All Chits</span>
                    </MenuItem>
                    {chitOptions.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Status</label>
                <FormControl size="small">
                  <Select
                    displayEmpty
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                  >
                    <MenuItem value="">
                      <span className="text-gray-400">All Status</span>
                    </MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </div>

              <div className="flex items-end pb-1">
                <span
                  className="text-[16px] text-red-500 cursor-pointer hover:underline"
                  onClick={clearFilters}
                >
                  Clear
                </span>
              </div>

            </div>
          </Card>

          {/* Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>S.No</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Assigned Chit</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredMembers.map((member, index) => (
                    <TableRow key={member.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.chit}</TableCell>

                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            member.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {member.status}
                        </span>
                      </TableCell>

                      <TableCell>
                        <IconButton onClick={(e) => handleMenuOpen(e, member)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* MENU */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem
              onClick={() => {
                setViewModal(true);
                handleMenuClose();
              }}
            >
              View Member Details
            </MenuItem>

            <MenuItem onClick={handleEditMember}>Edit</MenuItem>

            <MenuItem onClick={() => alert("Delete Coming Soon")}>
              Delete
            </MenuItem>
          </Menu>

          {/* VIEW MEMBER DETAILS MODAL */}
          <Dialog
            open={viewModal}
            onClose={() => setViewModal(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle className="text-xl font-semibold">
              Member Details
            </DialogTitle>

            <DialogContent className="space-y-4 py-4">
              <div>
                <label className="font-semibold">Name:</label>
                <p className="text-gray-700">{selectedMember?.name}</p>
              </div>

              <div>
                <label className="font-semibold">Phone:</label>
                <p className="text-gray-700">{selectedMember?.phone}</p>
              </div>

              <div>
                <label className="font-semibold">Email:</label>
                <p className="text-gray-700">{selectedMember?.email || "—"}</p>
              </div>

              <div>
                <label className="font-semibold">Address:</label>
                <p className="text-gray-700">{selectedMember?.address || "—"}</p>
              </div>

              <div>
                <label className="font-semibold">Assigned Chit:</label>
                <p className="text-gray-700">{selectedMember?.chit}</p>
              </div>

              <div>
                <label className="font-semibold">Status:</label>
                <p 
                  className={`inline-block px-3 py-1 rounded-full text-sm ${
                    selectedMember?.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedMember?.status}
                </p>
              </div>

              <div>
                <label className="font-semibold">Security Documents:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMember?.documents?.length ? (
                    selectedMember.documents.map((doc) => (
                      <span
                        key={doc}
                        className="px-3 py-1 bg-gray-200 rounded-full text-sm"
                      >
                        {doc}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No documents added</p>
                  )}
                </div>
              </div>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setViewModal(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          {/* ADD / EDIT MODAL */}
          <Dialog
            open={openModal}
            onClose={() => setOpenModal(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle className="text-xl font-semibold">
              {isEdit ? "Edit Member" : "Add Member"}
            </DialogTitle>

            <DialogContent className="space-y-4 py-4">
              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Name</label>
                <TextField
                  fullWidth
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Phone Number</label>
                <TextField
                  fullWidth
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Email ID</label>
                <TextField
                  fullWidth
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Address</label>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">Assigned Chit</label>
                <FormControl fullWidth>
                  <Select
                    value={formData.chit}
                    onChange={(e) =>
                      setFormData({ ...formData, chit: e.target.value })
                    }
                    input={<OutlinedInput />}
                  >
                    {chitOptions.map((chit) => (
                      <MenuItem key={chit} value={chit}>
                        {chit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-700 font-medium">
                  Security Documents
                </label>

                <FormControl fullWidth>
                  <Select
                    multiple
                    value={formData.documents}
                    onChange={(e) =>
                      setFormData({ ...formData, documents: e.target.value })
                    }
                    input={<OutlinedInput />}
                    renderValue={(selected) => (
                      <div className="flex flex-wrap gap-2">
                        {selected.map((doc) => (
                          <Chip
                            key={doc}
                            label={doc}
                            onDelete={() =>
                              setFormData({
                                ...formData,
                                documents: formData.documents.filter(
                                  (d) => d !== doc
                                ),
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: { maxHeight: 250 },
                      },
                    }}
                  >
                    {securityDocumentOptions.map((doc) => (
                      <MenuItem key={doc} value={doc}>
                        <Checkbox checked={formData.documents.includes(doc)} />
                        {doc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
