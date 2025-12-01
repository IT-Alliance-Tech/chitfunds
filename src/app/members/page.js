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
  ]);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

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

  // ADD MEMBER
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

  // EDIT MEMBER
  const handleEditMember = () => {
    setIsEdit(true);
    setFormData(selectedMember);
    setOpenModal(true);
    handleMenuClose();
  };

  // SAVE MEMBER (ADD or UPDATE)
  const handleSaveMember = () => {
    if (isEdit) {
      // UPDATE MEMBER
      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMember.id ? formData : m))
      );
    } else {
      // ADD NEW MEMBER
      setMembers((prev) => [
        ...prev,
        { ...formData, id: prev.length + 1 },
      ]);
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
            {/* Total */}
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

            {/* Active */}
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

            {/* Inactive */}
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
                  {members.map((member, index) => (
                    <TableRow key={member.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.chit}</TableCell>

                      {/* STATUS BADGE */}
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold
                            ${
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
            <MenuItem onClick={handleEditMember}>Edit</MenuItem>
            <MenuItem onClick={() => alert("Delete Coming Soon")}>
              Delete
            </MenuItem>
          </Menu>

          {/* MODAL */}
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

    {/* NAME */}
    <div className="flex flex-col gap-1">
      <label className="text-gray-700 font-medium">Name</label>
      <TextField
        fullWidth
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
    </div>

    {/* PHONE */}
    <div className="flex flex-col gap-1">
      <label className="text-gray-700 font-medium">Phone Number</label>
      <TextField
        fullWidth
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
    </div>

    {/* EMAIL */}
    <div className="flex flex-col gap-1">
      <label className="text-gray-700 font-medium">Email ID</label>
      <TextField
        fullWidth
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
    </div>

    {/* ADDRESS */}
    <div className="flex flex-col gap-1">
      <label className="text-gray-700 font-medium">Address</label>
      <TextField
        fullWidth
        multiline
        rows={2}
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      />
    </div>

    {/* ASSIGNED CHIT (ONLY ONE) */}
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

    {/* SECURITY DOCUMENTS */}
    <div className="flex flex-col gap-1">
      <label className="text-gray-700 font-medium">Security Documents</label>

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
                        (item) => item !== doc
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
