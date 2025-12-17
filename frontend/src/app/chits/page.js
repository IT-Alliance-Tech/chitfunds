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
import { apiRequest } from "@/config/api";


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



useEffect(() => {
  const fetchChits = async () => {
    try {
      const response = await apiRequest("/chit/list", {
        method: "GET",
      });

      // ✅ IMPORTANT FIX: use response.data.items
      const formattedChits = response.data.items.map((chit) => ({
        id: chit.id,
        name: chit.chitName,
        amount: chit.amount,
        monthlyAmount: chit.monthlyPayableAmount,
        durationMonths: chit.duration,
        membersLimit: chit.membersLimit,
        membersCount: chit.membersCount || 0,
        startDate: chit.startDate
          ? chit.startDate.split("T")[0]
          : "",
        cycleDay: chit.cycleDay,
        status: chit.status,
        location: chit.location,
      }));

      setChits(formattedChits);

    } catch (error) {
      console.error("Fetch chits failed:", error);
      alert(error.message || "Failed to fetch chits");
    }
  };

  fetchChits();
}, []);


const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

  const [chits, setChits] = useState([]);

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
  chitName: "",
  location: "",
  amount: "",
  monthlyPayableAmount: "",
  duration: "",
  membersLimit: "",
  startDate: "",
  cycleDay: "",
  status: "Upcoming",
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

  setFormData({
    chitName: chit.name,
    location: chit.location,
    amount: chit.amount,
    monthlyPayableAmount: chit.monthlyAmount,
    duration: chit.durationMonths,
    membersLimit: chit.membersLimit,
    startDate: chit.startDate,
    cycleDay: chit.cycleDay,
    status: chit.status,
    id: chit.id, // ✅ VERY IMPORTANT
  });

  setOpenModal(true);
  closeActions();
};


const handleSaveChit = async () => {
  if (!formData.chitName || !formData.amount || !formData.duration) {
    alert("Please fill required fields");
    return;
  }

  try {
    const payload = {
      chitName: formData.chitName,
      location: formData.location,
      amount: Number(formData.amount),
      monthlyPayableAmount: Number(formData.monthlyPayableAmount),
      duration: Number(formData.duration),
      membersLimit: Number(formData.membersLimit),
      startDate: formData.startDate,
      cycleDay: Number(formData.cycleDay),
      status: formData.status,
    };

    let response;

    if (isEditMode) {
      // 🟡 EDIT API
      response = await apiRequest(`/chit/update/${formData.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // 🔁 Update table row
      setChits((prev) =>
        prev.map((c) =>
          c.id === formData.id
            ? {
                ...c,
                name: payload.chitName,
                location: payload.location,
                amount: payload.amount,
                monthlyAmount: payload.monthlyPayableAmount,
                durationMonths: payload.duration,
                membersLimit: payload.membersLimit,
                startDate: payload.startDate,
                cycleDay: payload.cycleDay,
                status: payload.status,
              }
            : c
        )
      );

      alert("Chit updated successfully");

    } else {
      // 🟢 CREATE (your existing logic)
      response = await apiRequest("/chit/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setChits((prev) => [
        {
          id: response.data.chit.id,
          name: response.data.chit.chitName,
          amount: response.data.chit.amount,
          monthlyAmount: response.data.chit.monthlyPayableAmount,
          durationMonths: response.data.chit.duration,
          membersLimit: response.data.chit.membersLimit,
          membersCount: 0,
          startDate: response.data.chit.startDate.split("T")[0],
          cycleDay: response.data.chit.cycleDay,
          status: response.data.chit.status,
          location: response.data.chit.location,
        },
        ...prev,
      ]);

      alert("Chit created successfully");
    }

    setOpenModal(false);

  } catch (error) {
    alert(error.message || "Operation failed");
  }
};




 const handleDelete = async (chit) => {
  if (!chit) return;

  const confirmDelete = window.confirm(
    `Are you sure you want to delete "${chit.name}"?`
  );
  if (!confirmDelete) return;

  try {
    await apiRequest(`/chit/delete/${chit.id}`, {
      method: "DELETE",
    });

    // ✅ Remove from UI immediately
    setChits((prev) => prev.filter((c) => c.id !== chit.id));

    alert("Chit deleted successfully");

  } catch (error) {
    alert(error.message || "Failed to delete chit");
  } finally {
    closeActions();
  }
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
                   {mounted && (
  <Card className="p-4 mb-6 bg-white" elevation={2}>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
      {/* TextFields here */}
    </div>
  </Card>
)}

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
          <TableRow key={`${chit.id}-${chit.startDate}`}>
              <TableCell>{chit.id}</TableCell>
              <TableCell>{chit.name}</TableCell>
              <TableCell>₹{chit.amount}</TableCell>
              <TableCell>₹{chit.monthlyAmount}</TableCell>
              <TableCell>{chit.durationMonths}</TableCell>
              <TableCell> {chit.membersLimit}</TableCell>
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
               value={formData.chitName}
onChange={(e) =>
  setFormData({ ...formData, chitName: e.target.value })
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
                value={formData.monthlyPayableAmount}
onChange={(e) =>
  setFormData({
    ...formData,
    monthlyPayableAmount: e.target.value,
  })
}

              />

              <TextField
                label="Duration (Months)"
                type="number"
                fullWidth
                margin="normal"
                value={formData.duration}
onChange={(e) =>
  setFormData({ ...formData, duration: e.target.value })
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
