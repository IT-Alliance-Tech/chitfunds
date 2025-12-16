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
  OutlinedInput,
  MenuItem as MUIMenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CountUp from "react-countup";

const STATUS_OPTIONS = ["Active", "Closed", "Upcoming"];

const statCardClass =
  "p-3 bg-white flex items-center gap-3 w-full max-w-[250px] mx-auto sm:max-w-none h-[96px]";



/* ******** BADGE COLORS ******** */
const getStatusColor = (status) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Closed":
      return "bg-gray-200 text-gray-600";
    case "Upcoming":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100";
  }
};

export default function ChitsPage() {
  const router = useRouter();

  const [chits, setChits] = useState([
    {
      id: "CHT-001",
      name: "Silver Chit",
      amount: 50000,
      monthlyAmount: 4150,
      durationMonths: 12,
      membersLimit: 50,
      membersCount: 24,
      startDate: "2025-01-10",
      cycleDay: 10,
      status: "Active",
      location: "Hyderabad",
    },
    {
      id: "CHT-002",
      name: "Gold Chit",
      amount: 100000,
      monthlyAmount: 8200,
      durationMonths: 24,
      membersLimit: 30,
      membersCount: 5,
      startDate: "2025-06-01",
      cycleDay: 1,
      status: "Upcoming",
      location: "Bangalore",
    },
    {
      id: "CHT-003",
      name: "Starter Chit",
      amount: 25000,
      monthlyAmount: 2500,
      durationMonths: 6,
      membersLimit: 40,
      membersCount: 40,
      startDate: "2024-08-15",
      cycleDay: 15,
      status: "Closed",
      location: "Chennai",
    },
    {
      id: "CHT-004",
      name: "Bronze Chit",
      amount: 45000,
      monthlyAmount: 4500,
      durationMonths: 10,
      membersLimit: 45,
      membersCount: 20,
      startDate: "2025-03-01",
      cycleDay: 5,
      status: "Active",
      location: "Hyderabad",
    },
    {
      id: "CHT-005",
      name: "Premium Chit",
      amount: 150000,
      monthlyAmount: 12500,
      durationMonths: 36,
      membersLimit: 25,
      membersCount: 8,
      startDate: "2025-09-01",
      cycleDay: 1,
      status: "Upcoming",
      location: "Mumbai",
    },
  ]);

  useEffect(() => {
    localStorage.setItem("chits", JSON.stringify(chits));
  }, [chits]);

  /* FILTER STATE */
  const [filters, setFilters] = useState({
    name: "",
    duration: "",
    members: "",
    startDate: "",
    status: "",
    location: "",
  });

  /* APPLY FILTERS - SAFE VERSION (NO CRASH) */
  const filteredChits = chits.filter((chit) => {
    return (
      (filters.name === "" ||
        (chit.name || "").toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.duration === "" ||
        chit.durationMonths === Number(filters.duration)) &&
      (filters.members === "" ||
        chit.membersCount === Number(filters.members)) &&
      (filters.startDate === "" || chit.startDate === filters.startDate) &&
      (filters.status === "" || chit.status === filters.status) &&
      (filters.location === "" ||
        (chit.location || "")
          .toLowerCase()
          .includes(filters.location.toLowerCase()))
    );
  });

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

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedChit, setSelectedChit] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    amount: "",
    monthlyAmount: "",
    durationMonths: "",
    membersLimit: "",
    membersCount: 0,
    startDate: "",
    cycleDay: "",
    status: "Active",
    location: "",
  });

  /* ACTION HANDLERS */
  const openActions = (event, chit) => {
    setSelectedChit(chit);
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => setAnchorEl(null);

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({
      id: "",
      name: "",
      amount: "",
      durationMonths: "",
      membersLimit: "",
      membersCount: 0,
      startDate: "",
      cycleDay: "",
      status: "Active",
      location: "",
    });
    setOpenModal(true);
  };

  const openEditModal = (chit) => {
    if (!chit) return;
    setIsEditMode(true);
    setFormData({ ...chit });
    setOpenModal(true);
    closeActions();
  };

  const handleSaveChit = () => {
    if (!formData.name || !formData.amount || !formData.durationMonths) {
      alert("Please fill required fields");
      return;
    }

    if (isEditMode) {
      setChits((prev) =>
        prev.map((c) => (c.id === formData.id ? { ...formData } : c))
      );
    } else {
      const newId = `CHT-${Math.floor(Math.random() * 900 + 100)}`;
      setChits((prev) => [{ ...formData, id: newId }, ...prev]);
    }

    setOpenModal(false);
  };

  const handleDelete = (chit) => {
    if (!chit) return;
    if (!confirm(`Delete chit "${chit.name}"?`)) return;
    setChits((prev) => prev.filter((c) => c.id !== chit.id));
    closeActions();
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
  <div className="flex-1 w-full min-w-0">
    <main className="p-6">

          {/* HEADER */}
<div className="relative mb-6">
  {/* MOBILE VIEW */}
  <div className="flex flex-col items-center gap-3 sm:hidden">
    <Typography variant="h5" fontWeight={600} textAlign="center">
      Chit Management
    </Typography>

    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={openAddModal}
    >
      Add Chit
    </Button>
  </div>

  {/* TABLET & DESKTOP VIEW */}
  <div className="hidden sm:flex items-center justify-center px-16">
    <Typography
  variant="h4"
  fontWeight={600}
  sx={{
    whiteSpace: "nowrap",
    textAlign: "center",
    color: "text.primary", // black (theme-safe)
  }}
>
  Chit Management
</Typography>


    <div className="absolute right-0">
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={openAddModal}
      >
        Add Chit
      </Button>
    </div>
  </div>
</div>


          {/* TOP CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 justify-items-center">

  <Card elevation={3} className={statCardClass}>
    <div className="p-3 bg-blue-100 rounded-full">
      <GroupsIcon sx={{ fontSize: 26, color: "#1e88e5" }} />
    </div>
    <div>
      <Typography variant="subtitle2">Total Chits</Typography>
      <Typography variant="h4" fontWeight="600">
        <CountUp end={chits.length} duration={1.4} />
      </Typography>
    </div>
  </Card>

  <Card elevation={3} className={statCardClass}>
    <div className="p-3 bg-green-100 rounded-full">
      <CheckCircleIcon sx={{ fontSize: 26, color: "green" }} />
    </div>
    <div>
      <Typography variant="subtitle2">Active</Typography>
      <Typography variant="h4" color="green" fontWeight="600">
        <CountUp
          end={chits.filter((c) => c.status === "Active").length}
          duration={1.4}
        />
      </Typography>
    </div>
  </Card>

  <Card elevation={3} className={statCardClass}>
    <div className="p-3 bg-gray-300 rounded-full">
      <CancelIcon sx={{ fontSize: 26, color: "gray" }} />
    </div>
    <div>
      <Typography variant="subtitle2">Closed</Typography>
      <Typography variant="h4" color="gray" fontWeight="600">
        <CountUp
          end={chits.filter((c) => c.status === "Closed").length}
          duration={1.4}
        />
      </Typography>
    </div>
  </Card>

  <Card elevation={3} className={statCardClass}>
    <div className="p-3 bg-yellow-100 rounded-full">
      <AccessTimeIcon sx={{ fontSize: 26, color: "#d4a919" }} />
    </div>
    <div>
      <Typography variant="subtitle2">Upcoming</Typography>
      <Typography variant="h4" color="#d4a919" fontWeight="600">
        <CountUp
          end={chits.filter((c) => c.status === "Upcoming").length}
          duration={1.4}
        />
      </Typography>
    </div>
  </Card>
</div>


          {/* FILTERS */}
          <Card className="p-4 mb-6 bg-white" elevation={2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <TextField
               fullWidth
                label="Chit Name"
                size="small"
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
              />

              <TextField
               fullWidth
                label="Duration"
                type="number"
                size="small"
                value={filters.duration}
                onChange={(e) =>
                  setFilters({ ...filters, duration: e.target.value })
                }
              />

              <TextField
               fullWidth
                label="Members"
                type="number"
                size="small"
                value={filters.members}
                onChange={(e) =>
                  setFilters({ ...filters, members: e.target.value })
                }
              />

              <TextField
               fullWidth
                label="Start Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />

              <TextField
               fullWidth
                label="Location"
                size="small"
                value={filters.location}
                onChange={(e) =>
                  setFilters({ ...filters, location: e.target.value })
                }
              />

              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                  label="Status"
                >
                  <MUIMenuItem value="">
                    <em>All</em>
                  </MUIMenuItem>
                  {STATUS_OPTIONS.map((s) => (
                    <MUIMenuItem key={s} value={s}>
                      {s}
                    </MUIMenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

           <div className="mt-3 text-right">
              <span
                onClick={clearFilters}
                className="text-[#2563eb] text-[16px] cursor-pointer hover:underline"
              >
                Clear filters
              </span>
            </div>
          </Card>

          {/* TABLE */}
          <Card elevation={2}>
  <CardContent className="p-0">
    {/* SCROLL CONTAINER */}
    <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
      <Table className="min-w-max">
        <TableHead>
          <TableRow>
            <TableCell><strong>ID</strong></TableCell>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Amount</strong></TableCell>
            <TableCell><strong>Monthly</strong></TableCell>
            <TableCell><strong>Duration</strong></TableCell>
            <TableCell><strong>Members</strong></TableCell>
            <TableCell><strong>Start Date</strong></TableCell>
            <TableCell><strong>Location</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {filteredChits.map((chit) => (
            <TableRow key={chit.id}>
              <TableCell>{chit.id}</TableCell>
              <TableCell>{chit.name}</TableCell>
              <TableCell>₹{chit.amount}</TableCell>
              <TableCell>₹{chit.monthlyAmount}</TableCell>
              <TableCell>{chit.durationMonths}</TableCell>
              <TableCell>{chit.membersCount}</TableCell>
              <TableCell>{chit.startDate}</TableCell>
              <TableCell>{chit.location}</TableCell>

              <TableCell>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    chit.status
                  )}`}
                >
                  {chit.status}
                </span>
              </TableCell>

              <TableCell>
                <IconButton onClick={(e) => openActions(e, chit)}>
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
            onClose={closeActions}
          >
            <MenuItem
              disabled={!selectedChit}
              onClick={() => {
                if (!selectedChit) return;

                // ✅ Store selected chit
                localStorage.setItem(
                  "selectedChit",
                  JSON.stringify(selectedChit)
                );

                router.push(`/chits/${selectedChit.id}`);
                closeActions();
              }}
            >
              View
            </MenuItem>

            <MenuItem onClick={() => openEditModal(selectedChit)}>
              Edit
            </MenuItem>
            <MenuItem onClick={() => handleDelete(selectedChit)}>
              Delete
            </MenuItem>
          </Menu>

          {/* MODAL */}
          <Dialog
            open={openModal}
            onClose={() => setOpenModal(false)}
            fullWidth
            maxWidth="sm"
            sx={{
              "& .MuiPaper-root": {
                width: "520px",
                borderRadius: "12px",
                padding: "10px",
              },
            }}
          >
            <DialogTitle>{isEditMode ? "Edit Chit" : "Add Chit"}</DialogTitle>

            <DialogContent className="space-y-6 pt-4">
              <TextField
                label="Chit Name"
                fullWidth
                margin="normal"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <TextField
                label="Location"
                fullWidth
                margin="normal"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />

              <TextField
                label="Amount"
                type="number"
                fullWidth
                margin="normal"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: Number(e.target.value) })
                }
              />

              <TextField
                label="Monthly Payable Amount"
                type="number"
                fullWidth
                margin="normal"
                value={formData.monthlyAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyAmount: Number(e.target.value),
                  })
                }
              />

              <TextField
                label="Duration (Months)"
                type="number"
                fullWidth
                margin="normal"
                value={formData.durationMonths}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMonths: e.target.value,
                  })
                }
              />

              <TextField
                label="Members Limit"
                type="number"
                fullWidth
                margin="normal"
                value={formData.membersLimit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    membersLimit: e.target.value,
                  })
                }
              />

              <TextField
                label="Start Date"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />

              <TextField
                label="Cycle Day"
                type="number"
                fullWidth
                margin="normal"
                value={formData.cycleDay}
                onChange={(e) =>
                  setFormData({ ...formData, cycleDay: e.target.value })
                }
              />
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenModal(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveChit}>
                {isEditMode ? "Save Changes" : "Create Chit"}
              </Button>
            </DialogActions>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
