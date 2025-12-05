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
  Checkbox,
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Group, CheckCircle, Cancel } from "@mui/icons-material";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";
import CountUp from "react-countup";

/* ===================== CHITS ====================== */
const MOCK_CHITS = [
  { id: "CHT-001", name: "Silver Chit", location: "Hyderabad" },
  { id: "CHT-002", name: "Gold Chit", location: "Bangalore" },
  { id: "CHT-003", name: "Starter Chit", location: "Chennai" },
  { id: "CHT-004", name: "Bronze Chit", location: "Hyderabad" },
  { id: "CHT-005", name: "Premium Chit", location: "Mumbai" },
];

const LOCATIONS = [
  ...new Set(MOCK_CHITS.map((chit) => chit.location)),
];


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
  /* ===================== MEMBERS ====================== */
 const [members, setMembers] = useState([
  {
    id: 1,
    name: "Gireeshma Reddy",
    email: "gireeshma@gmail.com",
    address: "Banjara Hills, Hyderabad",
    phone: "9876501234",
    chit: "Silver Chit",
    location: "Hyderabad",
    status: "Active",
    documents: ["Aadhaar Card", "PAN Card"],
  },
  {
    id: 2,
    name: "Sahana R",
    email: "sahana@gmail.com",
    address: "Whitefield, Bangalore",
    phone: "9900123456",
    chit: "Gold Chit",
    location: "Bangalore",
    status: "Inactive",
    documents: ["Electricity Bill"],
  },
  {
    id: 3,
    name: "Kiran Kumar",
    email: "kiran@gmail.com",
    address: "Gachibowli, Hyderabad",
    phone: "9988776655",
    chit: "Starter Chit",
    location: "Chennai",
    status: "Active",
    documents: ["Bank Passbook Copy"],
  },
  {
    id: 4,
    name: "Lavanya P",
    email: "lavanya@gmail.com",
    address: "Yelahanka, Bangalore",
    phone: "9123987654",
    chit: "Silver Chit",
    location: "Hyderabad",
    status: "Active",
    documents: ["Aadhaar Card", "Cheque Leaf"],
  },
  {
    id: 5,
    name: "Manoj Shetty",
    email: "manoj@gmail.com",
    address: "Udupi, Karnataka",
    phone: "9001237890",
    chit: "Gold Chit",
    location: "Bangalore",
    status: "Inactive",
    documents: ["Ration Card"],
  },
]);


  /* ===================== STATE ====================== */
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  /* ===================== FILTER STATE ====================== */
/* ===================== FILTER STATE ====================== */
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
  chit: "",
  location: "",
  documents: [],
  status: "Active",
});


/* ===================== MENU ====================== */
  const handleMenuOpen = (e, member) => {
    setAnchorEl(e.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => setAnchorEl(null);

/* ===================== ADD ====================== */
  const handleAddMember = () => {
    setIsEdit(false);
    setFormData({
  name: "",
  phone: "",
  email: "",
  address: "",
  chit: "",
  location: "",
  documents: [],
  status: "Active",
});

    setOpenModal(true);
  };

/* ===================== EDIT ====================== */
  const handleEditMember = () => {
    if (!selectedMember) return;

    setIsEdit(true);
    setFormData(selectedMember);
    setOpenModal(true);
    handleMenuClose();
  };

/* ===================== DELETE ====================== */
  const handleDelete = () => {
    if (!selectedMember) return;

    setMembers((prev) =>
      prev.filter((m) => m.id !== selectedMember.id)
    );

    handleMenuClose();
  };

/* ===================== SAVE ====================== */
  const handleSaveMember = () => {
    if (!formData.name || !formData.phone || !formData.chit) {
      alert("Name, Phone & Chit are required");
      return;
    }

    if (isEdit) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id ? { ...formData, id: m.id } : m
        )
      );
    } else {
      setMembers((prev) => [
        ...prev,
        { ...formData, id: prev.length + 1 },
      ]);
    }

    setOpenModal(false);
  };

const filteredMembers = members.filter((m) => {
  return (
    m.name.toLowerCase().includes(searchName.toLowerCase()) &&
    m.phone.includes(searchPhone) &&
    (filterChit === "" || m.chit === filterChit) &&
    (filterStatus === "" || m.status === filterStatus) &&
    (filterLocation === "" || m.location === filterLocation)
  );
});




  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6">
          {/* HEADER */}
          <div className="flex justify-between mb-6">
           <Typography variant="h5" fontWeight={600} className="text-black">
  Member Management
</Typography>


            <Button variant="contained" onClick={handleAddMember}>
              Add Member
            </Button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <Card className="p-4 flex items-center gap-4">
              <Group sx={{ fontSize: 35, color: "#1e88e5" }} />
              <div>
                <Typography variant="h4" fontWeight={600}>
                  <CountUp end={members.length} duration={1.2} />
                </Typography>
                <Typography> Total Members </Typography>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <CheckCircle sx={{ fontSize: 35, color: "green" }} />
              <div>
                <Typography
                  variant="h4"
                  fontWeight={600}
                  color="green"
                >
                  <CountUp
                    end={
                      members.filter((m) => m.status === "Active").length
                    }
                    duration={1.2}
                  />
                </Typography>
                <Typography> Active Members </Typography>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <Cancel sx={{ fontSize: 35, color: "red" }} />
              <div>
                <Typography
                  variant="h4"
                  fontWeight={600}
                  color="red"
                >
                  <CountUp
                    end={
                      members.filter((m) => m.status === "Inactive").length
                    }
                    duration={1.2}
                  />
                </Typography>
                <Typography> Inactive Members </Typography>
              </div>
            </Card>
          </div>
{/* ===================== FILTER BAR ====================== */}
<Card
  sx={{
    mb: 3,
    p: 2,
    borderRadius: 3,
    background:
      "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
    border: "1px solid #e5e7eb",
  }}
>
  <div className="flex flex-wrap gap-4 items-center">

    {/* NAME SEARCH */}
    <TextField
      size="small"
      label="Search Name"
      value={searchName}
      onChange={(e) => setSearchName(e.target.value)}
      sx={{ minWidth: 200 }}
    />

    {/* PHONE SEARCH */}
    <TextField
      size="small"
      label="Phone Number"
      value={searchPhone}
      onChange={(e) => setSearchPhone(e.target.value)}
      sx={{ minWidth: 180 }}
    />

    {/* CHIT FILTER */}
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel>Chit</InputLabel>
      <Select
        label="Chit"
        value={filterChit}
        onChange={(e) => setFilterChit(e.target.value)}
      >
        <MenuItem value="">All</MenuItem>
        {MOCK_CHITS.map((chit) => (
          <MenuItem key={chit.id} value={chit.name}>
            {chit.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* LOCATION FILTER */}
<FormControl size="small" sx={{ minWidth: 180 }}>
  <InputLabel>Location</InputLabel>
  <Select
    label="Location"
    value={filterLocation}
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


    {/* STATUS FILTER */}
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel>Status</InputLabel>
      <Select
        label="Status"
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="Active">Active</MenuItem>
        <MenuItem value="Inactive">Inactive</MenuItem>
      </Select>
    </FormControl>


    {/* CLEAR TEXT LINK */}
    <Typography
      sx={{
        color: "#2563eb",
        cursor: "pointer",
        fontWeight: 600,
        ml: "auto",
        "&:hover": {
          textDecoration: "underline",
        },
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



          {/* TABLE */}
          <Card>
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Assigned Chit</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredMembers.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.id}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.phone}</TableCell>
                      <TableCell>{m.chit}</TableCell>
                      <TableCell>{m.location}</TableCell>

                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
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
            </CardContent>
          </Card>

          {/* ACTION MENU */}
        <Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleMenuClose}
>
  <MenuItem
    disabled={!selectedMember}
    onClick={() => {
      if (!selectedMember) return;
      window.location.href = `/dashboard/members/${selectedMember.id}`;
      handleMenuClose();
    }}
  >
    View
  </MenuItem>

  <MenuItem
    disabled={!selectedMember}
    onClick={() => {
      if (!selectedMember) return;
      handleEditMember();
    }}
  >
    Edit
  </MenuItem>

  <MenuItem
    sx={{ color: "red" }}
    disabled={!selectedMember}
    onClick={() => {
      if (!selectedMember) return;
      handleDelete();
    }}
  >
    Delete
  </MenuItem>
</Menu>




          {/* ADD / EDIT MODAL */}
          <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth>
            <DialogTitle>
              {isEdit ? "Edit Member" : "Add Member"}
            </DialogTitle>

            <DialogContent>
              <TextField fullWidth sx={{ mb: 3 }} label="Name" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <TextField fullWidth sx={{ mb: 3 }} label="Phone" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <TextField fullWidth sx={{ mb: 3 }} label="Email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

              
              {/* LOCATION */}
<FormControl fullWidth sx={{ mb: 3 }}>
  <InputLabel>Location</InputLabel>
  <Select
    label="Location"
    value={formData.location}
    onChange={(e) =>
      setFormData({ ...formData, location: e.target.value })
    }
  >
    {LOCATIONS.map((loc) => (
      <MenuItem key={loc} value={loc}>
        {loc}
      </MenuItem>
    ))}
  </Select>
</FormControl>


              {/* ASSIGN CHIT */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Assigned Chit</InputLabel>
                <Select
                  label="Assigned Chit"
                  value={formData.chit}
                  onChange={(e) =>
                    setFormData({ ...formData, chit: e.target.value })
                  }
                >
                  {MOCK_CHITS.map((chit) => (
                    <MenuItem key={chit.id} value={chit.name}>
                      {chit.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* DOCUMENTS */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Security Documents</InputLabel>

                <Select
                  multiple
                  value={formData.documents}
                  input={<OutlinedInput label="Security Documents" />}
                  onChange={(e) =>
                    setFormData({ ...formData, documents: e.target.value })
                  }
                  renderValue={(selected) => (
                    <div className="flex flex-wrap gap-2">
                      {selected.map((doc) => (
                        <Chip
                          key={doc}
                          label={doc}
                          onDelete={() =>
                            setFormData({
                              ...formData,
                              documents: formData.documents.filter((d) => d !== doc),
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                >
                  {securityDocumentOptions.map((doc) => (
                    <MenuItem key={doc} value={doc}>
                      <Checkbox checked={formData.documents.includes(doc)} />
                      {doc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* STATUS (EDIT ONLY) */}
              {isEdit && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}
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
