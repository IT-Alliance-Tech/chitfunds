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
  OutlinedInput,
  Chip,
  Checkbox,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Group, CheckCircle, Cancel } from "@mui/icons-material";
import CountUp from "react-countup";
import { apiRequest } from "@/config/api";


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

    const chitsArray =
      res?.data?.chits ||           // preferred
      res?.data?.items ||           // fallback
      [];                            // safety

    const formattedChits = chitsArray.map((c) => ({
      id: c._id || c.id,
      name: c.chitName,
      location: c.location,
    }));

    setChits(formattedChits);
  } catch (err) {
    console.error("Failed to fetch chits", err);
    setChits([]); // prevent crash
  }
};



  useEffect(() => {
  console.log("CHITS DATA 👉", chits);
}, [chits]);


  const LOCATIONS = [...new Set(chits.map((c) => c.location))];

  /* ===================== MEMBERS ====================== */
 const [members, setMembers] = useState([]);


  /* SAVE MEMBERS IN LOCAL STORAGE */
 useEffect(() => {
  fetchMembers();
}, []);

const fetchMembers = async () => {
  try {
    const res = await apiRequest("/member/list", { method: "GET" });

    const membersArray =
      res?.data?.members ||         // preferred
      res?.data?.items ||           // fallback
      [];                            // safety

 const formattedMembers = membersArray.map((m) => {
  const safeChitIds =
    (m.chits || [])
      .map((c) => {
        // CASE 1: chitId is populated object
        if (typeof c.chitId === "object" && c.chitId?.id) {
          return c.chitId.id;
        }

        // CASE 2: chitId is string
        if (typeof c.chitId === "string") {
          return c.chitId;
        }

        // CASE 3: null / invalid
        return null;
      })
      .filter(Boolean); // 🔥 removes nulls

  return {
    id: m._id,
    name: m.name,
    phone: m.phone,
    email: m.email,
    address: m.address,
    status: m.status,
    chitIds: safeChitIds,            // ✅ ALWAYS string[]
    chits: m.chits || [],
    documents: m.securityDocuments || [],
  };
});


    setMembers(formattedMembers);
  } catch (err) {
    console.error("Failed to fetch members", err);
    setMembers([]); // prevent UI crash
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
  chitIds: [],          // ✅ MULTIPLE
  documents: [],
  status: "Active",
});



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
  chitIds: [],        // 🔥 REQUIRED
  documents: [],
  status: "Active",
});

    setOpenModal(true);
  };

  /* EDIT */
const handleEditMember = () => {
  setIsEdit(true);

  setFormData({
    id: selectedMember.id,
    name: selectedMember.name,
    phone: selectedMember.phone,
    email: selectedMember.email,
    address: selectedMember.address,
    chitIds: selectedMember.chitIds || [], // 🔥 already normalized
    documents: selectedMember.documents || [],
    status: selectedMember.status,
  });

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

    await fetchMembers();   // refresh list from backend
    handleMenuClose();
  } catch (err) {
    alert(err.message || "Failed to delete member");
  }
};


  /* MAP CHIT CHANGE */
// const handleChitChange = (chitId) => {
//   const selectedChit = chits.find((c) => c.id === chitId);
//   if (!selectedChit) return;

//   setFormData((prev) => ({
//     ...prev,
//     chitId: selectedChit.id,        // backend
//     chit: selectedChit.name,        // UI display
//     monthlyAmount: selectedChit.monthlyAmount,
//     location: selectedChit.location,
//   }));
// };



  /* SAVE MEMBER */
const handleSaveMember = async () => {
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
  chitIds: (formData.chitIds || []).filter(Boolean), // 🔥 CRITICAL
  securityDocuments: formData.documents,
};


    if (isEdit) {
      await apiRequest(`/member/update/${formData.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiRequest("/member/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await fetchMembers();
    setOpenModal(false);
    setIsEdit(false);
  } catch (err) {
    alert(err.message || "Failed to save member");
  }
};




  /* FILTERED MEMBERS */
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
        onClick={handleAddMember}
      >
        Add Member
      </Button>
    </div>
  </div>
</div>


          {/* STATS */}
{/* ===================== STATS CARDS ===================== */}
<div className="max-w-[820px] mx-auto sm:mx-0">
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-3 md:gap-2 mb-6 justify-items-center sm:justify-items-start">

    {/* TOTAL MEMBERS */}
    <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
      <div className="flex items-center gap-3 w-full">
        <Group sx={{ fontSize: { xs: 30, sm: 34 }, color: "#1e88e5" }} />
        <div>
          <Typography variant="h6" fontWeight={600}>
            <CountUp end={members.length} />
          </Typography>
          <Typography variant="body2">Total Members</Typography>
        </div>
      </div>
    </Card>

    {/* ACTIVE */}
    <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
      <div className="flex items-center gap-3 w-full">
        <CheckCircle sx={{ fontSize: { xs: 30, sm: 34 }, color: "green" }} />
        <div>
          <Typography variant="h6" color="green" fontWeight={600}>
            <CountUp end={members.filter((m) => m.status === "Active").length} />
          </Typography>
          <Typography variant="body2">Active</Typography>
        </div>
      </div>
    </Card>

    {/* INACTIVE */}
    <Card className="p-3 bg-white flex items-center w-full max-w-[240px] h-[88px]">
      <div className="flex items-center gap-3 w-full">
        <Cancel sx={{ fontSize: { xs: 30, sm: 34 }, color: "red" }} />
        <div>
          <Typography variant="h6" color="red" fontWeight={600}>
            <CountUp end={members.filter((m) => m.status === "Inactive").length} />
          </Typography>
          <Typography variant="body2">Inactive</Typography>
        </div>
      </div>
    </Card>

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

    {/* Chit */}
    {/* <FormControl fullWidth size="small" sx={{ maxWidth: { sm: 220 } }}>
      <InputLabel>Chit</InputLabel>
   <Select
  value={formData.chitId}
  label="Assigned Chit"
  onChange={(e) => handleChitChange(e.target.value)}
>
 {chits.map((c) => (
  <MenuItem key={c.id} value={c.id}>
    {c.name}
  </MenuItem>
))}

</Select>


    </FormControl> */}

    {/* Location */}
    <FormControl fullWidth size="small" sx={{ maxWidth: { sm: 220 } }}>
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
    <FormControl fullWidth size="small" sx={{ maxWidth: { sm: 220 } }}>
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


          {/* ===================== TABLE WITH MOBILE SCROLL ===================== */}
          <Card>
            <CardContent>
              <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                <Table className="min-w-max">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Chit</TableCell>
                      <TableCell>Monthly</TableCell>
                      <TableCell>Address</TableCell>
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
                        <TableCell>₹{m.monthlyAmount || 0}</TableCell>
                       <TableCell>{m.address}</TableCell>


                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold
                              ${
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
                sx={{ mb: 3 }}
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

<FormControl fullWidth sx={{ mb: 3 }}>
  <InputLabel>Assigned Chits</InputLabel>

  <Select
    multiple
    value={formData.chitIds}
    input={<OutlinedInput label="Assigned Chits" />}
    onChange={(e) =>
      setFormData({ ...formData,  chitIds: (e.target.value || []).map(String), })
    }
    renderValue={(selected) => (
      <div className="flex flex-wrap gap-2">
        {selected.map((id) => {
          const chit = chits.find((c) => c.id === id);
          return <Chip key={id} label={chit?.name || id} />;
        })}
      </div>
    )}
  >
    {chits.map((c) => (
      <MenuItem key={c.id} value={c.id}>
        <Checkbox
  checked={Array.isArray(formData.chitIds) && formData.chitIds.includes(c.id)}
/>

        {c.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>


              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.location || ""}
                  label="Location"
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
                      {selected.map((d) => (
                        <Chip key={d} label={d} />
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
