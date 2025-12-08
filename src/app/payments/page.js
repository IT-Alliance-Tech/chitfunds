"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
} from "@mui/material";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";

export default function PaymentsPage() {
  const router = useRouter();

  /* ================= LOAD DATA FROM STORAGE ================= */

  const [chits, setChits] = useState([]);
  const [membersAll, setMembersAll] = useState([]);

  useEffect(() => {
    const storedChits = localStorage.getItem("chits");
    const storedMembers = localStorage.getItem("members");

    if (storedChits) setChits(JSON.parse(storedChits));
    if (storedMembers) setMembersAll(JSON.parse(storedMembers));
  }, []);

  const LOCATIONS = [...new Set(chits.map((c) => c.location))];

  /* ================= FILTER STATES ================= */

  const [selectedChit, setSelectedChit] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  /* ================= PAYMENTS MODAL ================= */

  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const [form, setForm] = useState({
    month: "",
    amount: "",
    interest: "",
    method: "",
    status: "Paid",
  });

  /* ================= FILTER MEMBERS ================= */

  const members = membersAll.filter((m) => {
    return (
      (selectedChit === "" || m.chit === selectedChit) &&
      (selectedLocation === "" || m.location === selectedLocation) &&
      m.name.toLowerCase().includes(searchName.toLowerCase()) &&
      m.phone.includes(searchPhone)
    );
  });

  /* ================= GET MONTHLY AMOUNT FROM CHITS ================= */

  const selectedChitAmount = selectedMember
    ? chits.find((c) => c.name === selectedMember.chit)?.monthlyAmount
    : null;

  /* ================= OPEN PAYMENT MODAL ================= */

  const openPaymentForm = (member) => {
    setSelectedMember(member);
    setForm({
      month: "",
      amount: selectedChitAmount || "",
      interest: "",
      method: "",
      status: "Paid",
    });
    setOpenModal(true);
  };

  /* ================= SAVE PAYMENT ================= */

  const savePayment = () => {
    if (!selectedMember || !form.month || !form.amount || !form.method) return;

    // ✅ You can store payments in localStorage later if needed

    setOpenModal(false);
  };

  /* ================= CLEAR FILTERS ================= */

  const clearAllFilters = () => {
    setSelectedChit("");
    setSelectedLocation("");
    setSearchName("");
    setSearchPhone("");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6 space-y-6">

          {/* ================= HEADER ================= */}
          <Typography
            variant="h4"
            fontWeight={600}
            textAlign="center"
            color="black"
            sx={{ mb: 3 }}
          >
            Payment Management
          </Typography>

          {/* ================= FILTER BAR ================= */}

          <Card>
            <CardContent className="flex gap-4 flex-wrap items-center">

              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Select Chit</InputLabel>
                <Select
                  label="Select Chit"
                  value={selectedChit}
                  onChange={(e) => setSelectedChit(e.target.value)}
                >
                  <MenuItem value="">All Chits</MenuItem>

                  {chits.map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}

                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Select Location</InputLabel>
                <Select
                  label="Select Location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <MenuItem value="">All Locations</MenuItem>

                  {LOCATIONS.map((loc) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))}

                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Member Name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />

              <TextField
                size="small"
                label="Phone"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />

              <Typography
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  color: "#2563eb",
                  "&:hover": { textDecoration: "underline" },
                }}
                onClick={clearAllFilters}
              >
                Clear Filters
              </Typography>

            </CardContent>
          </Card>

          {/* ================= MEMBERS TABLE ================= */}

          <Card>
            <CardContent>

              <Typography mb={2} fontWeight={600}>
                Members ({members.length})
              </Typography>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><b>ID</b></TableCell>
                    <TableCell><b>Name</b></TableCell>
                    <TableCell><b>Phone</b></TableCell>
                    <TableCell><b>Chit</b></TableCell>
                    <TableCell><b>Location</b></TableCell>
                    <TableCell align="center"><b>Action</b></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.id}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.phone}</TableCell>
                      <TableCell>{m.chit}</TableCell>
                      <TableCell>{m.location}</TableCell>

                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openPaymentForm(m)}
                        >
                          Add Payment
                        </Button>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>

            </CardContent>
          </Card>

        </main>
      </div>

      {/* ================= PAYMENT MODAL ================= */}

      <Dialog open={openModal} fullWidth maxWidth="sm">

        <DialogTitle>
         {` Add Payment — `}{selectedMember?.name}
        </DialogTitle>

        <DialogContent>

          <Card sx={{ mb: 3, p: 2, background: "#f3f4f6" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Monthly Chit Amount
            </Typography>

            <Typography variant="h6" fontWeight={600}>
              ₹ {selectedChitAmount ?? "--"}
            </Typography>
          </Card>

          <TextField
            type="month"
            fullWidth
            sx={{ mb: 3 }}
            label="Payment Month"
            InputLabelProps={{ shrink: true }}
            value={form.month}
            onChange={(e) =>
              setForm({ ...form, month: e.target.value })
            }
          />

          <TextField
            type="number"
            fullWidth
            sx={{ mb: 3 }}
            label="Amount Paid"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
          />

          <TextField
            type="number"
            fullWidth
            sx={{ mb: 3 }}
            label="Interest"
            value={form.interest}
            onChange={(e) =>
              setForm({ ...form, interest: e.target.value })
            }
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              label="Payment Method"
              value={form.method}
              onChange={(e) =>
                setForm({ ...form, method: e.target.value })
              }
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              <MenuItem value="Debit Card">Debit Card</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={form.status}
              label="Status"
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </FormControl>

        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>
            Cancel
          </Button>

          <Button variant="contained" onClick={savePayment}>
            Save Payment
          </Button>
        </DialogActions>

      </Dialog>

    </div>
  );
}
