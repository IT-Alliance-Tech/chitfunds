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
  Chip
} from "@mui/material";

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

const chitOptions = [
  "1,00,000 Chit",
  "50,000 Chit",
  "25,000 Chit",
];

export default function MembersPage() {
const [members, setMembers] = useState([
  {
    id: 1,
    name: "Gireeshma Reddy",
    phone: "9876501234",
    chit: "1,00,000 Chit",
    status: "Active",
    documents: ["Aadhaar Card", "PAN Card"],
  },
  {
    id: 2,
    name: "Sahana R",
    phone: "9900123456",
    chit: "50,000 Chit",
    status: "Inactive",
    documents: ["Electricity Bill"],
  },
  {
    id: 3,
    name: "Kiran Kumar",
    phone: "9988776655",
    chit: "25,000 Chit",
    status: "Active", 
    documents: ["Bank Passbook Copy"],
  },
  {
    id: 4,
    name: "Lavanya P",
    phone: "9123987654",
    chit: "1,00,000 Chit",
    status: "Active",
    documents: ["Aadhaar Card", "Cheque Leaf"],
  },
  {
    id: 5,
    name: "Manoj Shetty",
    phone: "9001237890",
    chit: "50,000 Chit",
    status: "Inactive",
    documents: ["Ration Card"],
  },
]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const [openModal, setOpenModal] = useState(false);
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

  const handleSaveMember = () => {
    console.log("Saving member:", formData);
    setOpenModal(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6">

          {/* PAGE TITLE + ADD BUTTON */}
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h5" fontWeight="600" color="black">
              Member Management
            </Typography>

            <Button variant="contained" onClick={handleAddMember}>
              Add Member
            </Button>
          </div>

          {/* ======= MEMBER STATS CARDS WITH ICONS ======= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">

            {/* TOTAL MEMBERS */}
            <Card elevation={3} className="p-4 bg-white flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Group sx={{ fontSize: 35, color: "#1e88e5" }} />
              </div>
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Members
                </Typography>
                <Typography variant="h4" fontWeight="600" color="black">
                  <CountUp end={members.length} duration={1.5} />
                </Typography>
              </div>
            </Card>

            {/* ACTIVE MEMBERS */}
            <Card elevation={3} className="p-4 bg-white flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle sx={{ fontSize: 35, color: "green" }} />
              </div>
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  Active Members
                </Typography>
                <Typography variant="h4" fontWeight="600" color="green">
                  <CountUp
                    end={members.filter((m) => m.status === "Active").length}
                    duration={1.5}
                  />
                </Typography>
              </div>
            </Card>

            {/* INACTIVE MEMBERS */}
            <Card elevation={3} className="p-4 bg-white flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Cancel sx={{ fontSize: 35, color: "red" }} />
              </div>
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  Inactive Members
                </Typography>
                <Typography variant="h4" fontWeight="600" color="red">
                  <CountUp
                    end={members.filter((m) => m.status === "Inactive").length}
                    duration={1.5}
                  />
                </Typography>
              </div>
            </Card>

          </div>

          {/* ======= TABLE ======= */}
          <Card elevation={2}>
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
                  {members.map((member, index) => (
                    <TableRow key={member.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.chit}</TableCell>
                      <TableCell>{member.status}</TableCell>

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

          {/* ACTION MENU */}
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => { alert("View Member Coming Soon"); handleMenuClose(); }}>
              View
            </MenuItem>
            <MenuItem onClick={() => { setOpenModal(true); handleMenuClose(); }}>
              Edit
            </MenuItem>
            <MenuItem onClick={() => { alert("Delete Coming Soon"); handleMenuClose(); }}>
              Delete
            </MenuItem>
          </Menu>

          {/* ADD & EDIT MODAL */}
          <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
            <DialogTitle>Add / Edit Member</DialogTitle>

            <DialogContent className="space-y-4">

              <TextField
                label="Name"
                fullWidth
                value={formData.name}
                sx={{ mt: 1 }}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <TextField
                label="Phone Number"
                fullWidth
                value={formData.phone}
                sx={{ mt: 1 }}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <TextField
                label="Email ID"
                fullWidth
                value={formData.email}
                sx={{ mt: 1 }}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={formData.address}
                sx={{ mt: 1 }}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              {/* CHIT DROPDOWN */}
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Assigned Chit</InputLabel>
                <Select
                  value={formData.chit}
                  onChange={(e) => setFormData({ ...formData, chit: e.target.value })}
                  input={<OutlinedInput label="Assigned Chit" />}
                >
                  {chitOptions.map((chit) => (
                    <MenuItem key={chit} value={chit}>{chit}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* MULTI SELECT SECURITY DOCUMENTS */}
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Security Documents</InputLabel>
                <Select
                  multiple
                  value={formData.documents}
                  onChange={(e) =>
                    setFormData({ ...formData, documents: e.target.value })
                  }
                  input={<OutlinedInput label="Security Documents" />}
                  renderValue={(selected) => (
                    <div className="flex flex-wrap gap-1">
                      {selected.map((doc) => (
                        <Chip key={doc} label={doc} />
                      ))}
                    </div>
                  )}
                >
                  {securityDocumentOptions.map((doc) => (
                    <MenuItem key={doc} value={doc}>
                      {doc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

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
