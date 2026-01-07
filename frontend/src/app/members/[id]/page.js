"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Snackbar,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

import { apiRequest, BASE_URL } from "@/config/api";

const getStatusColor = (status) => {
  const s = status?.toLowerCase();
  if (["active", "paid"].includes(s)) return { bg: "#dcfce7", text: "#166534" }; // Green
  if (["inactive", "overdue", "closed", "completed"].includes(s))
    return { bg: "#fee2e2", text: "#991b1b" }; // Red
  if (["partial", "upcoming", "pending"].includes(s))
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

export default function MemberDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selectedChit, setSelectedChit] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  /* ===================== NOTIFICATION STATE ====================== */
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

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const res = await apiRequest(`/member/details/${id}`);
        setMember(res?.data?.member || null);
      } catch (err) {
        showNotification(
          err.message || "Failed to fetch member details",
          "error"
        );
        console.error("Failed to fetch member details", err);
        setMember(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  const handleOpen = async (chit) => {
    setSelectedChit(chit);
    setOpen(true);
    setPayments([]);
    setPaymentsLoading(true);

    try {
      const res = await apiRequest(
        `/payment/history?memberId=${id}&chitId=${chit.id}`
      );
      setPayments(res?.data?.payments || []);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedChit(null);
    setPayments([]);
  };

  if (loading) {
    return (
      <main className="p-10 text-center">
        <Typography>Loading member details...</Typography>
      </main>
    );
  }

  if (!member) {
    return (
      <main className="p-10 text-center">
        <Typography>No member found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.back()}>
          Back
        </Button>
      </main>
    );
  }

  /* ✅ FIXED + SAFE CHIT MAPPING */
  const safeChits = (member.chits || [])
    .map((c) => {
      const chitData = c.chitId;
      if (chitData && typeof chitData === "object") {
        return {
          id: chitData._id || chitData.id,
          name: chitData.chitName,
          amount: chitData.amount,
          duration: chitData.duration,
          membersLimit: chitData.membersLimit,
          status: c.status,
          slots: c.slots || 1,
          monthlyPayableAmount: chitData.monthlyPayableAmount,
        };
      }
      return null;
    })
    .filter(Boolean);

  const handleDownloadPDF = (paymentId) => {
    const token = localStorage.getItem("token");
    window.open(
      `${BASE_URL}/payment/invoice/${paymentId}?token=${token}`,
      "_blank"
    );
  };

  return (
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-6">
      <Box sx={{ position: "relative", mb: 4 }}>
        <Button
          variant="outlined"
          onClick={() => router.back()}
          sx={{
            color: "#64748b",
            borderColor: "#cbd5e1",
            fontWeight: 700,
            borderRadius: "8px",
            "&:hover": { borderColor: "#94a3b8", backgroundColor: "#f8fafc" },
          }}
        >
          BACK
        </Button>
        <Typography
          variant="h4"
          fontWeight={800}
          align="center"
          sx={{
            color: "#1e293b",
            mt: -4,
            textTransform: "capitalize",
          }}
        >
          Member Details
        </Typography>
      </Box>

      {/* PERSONAL DETAILS */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          p: 3,
        }}
      >
        <CardContent>
          <Typography
            fontWeight={700}
            sx={{ color: "#1e293b", mb: 3, fontSize: "1.1rem" }}
          >
            Personal Information
          </Typography>

          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12">
            <Detail label="Full Name" value={member.name} />
            <Detail label="Email" value={member.email} />
            <Detail label="Phone" value={member.phone} />
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  display: "block",
                  mb: 0.5,
                }}
              >
                Status
              </Typography>
              <StatusPill status={member.status} />
            </Box>
            <Detail label="Address" value={member.address} />
          </Box>

          <Divider sx={{ my: 4, borderColor: "#f1f5f9" }} />

          <Typography fontWeight={700} sx={{ color: "#1e293b", mb: 2 }}>
            Security Documents
          </Typography>

          <div className="flex flex-wrap gap-2">
            {(member.securityDocuments || []).map((doc, i) => (
              <Chip
                key={i}
                label={doc}
                variant="outlined"
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  color: "#2563eb",
                  borderColor: "#dbeafe",
                  backgroundColor: "#eff6ff",
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ASSIGNED CHITS */}
      <Box>
        <Typography
          fontWeight={700}
          sx={{ color: "#1e293b", mb: 2, fontSize: "1.1rem" }}
        >
          Assigned Chits
        </Typography>

        {safeChits.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: "16px",
              border: "1px dashed #cbd5e1",
            }}
          >
            <Typography color="text.secondary">No chits assigned</Typography>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeChits.map((chit) => (
              <Card
                key={chit.id}
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  "&:hover": {
                    borderColor: "#2563eb",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
                  },
                  transition: "all 0.2s",
                }}
              >
                <CardContent className="space-y-4">
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    sx={{
                      color: "#1e293b",
                      borderBottom: "2px solid #f1f5f9",
                      pb: 1,
                      mb: 2,
                    }}
                  >
                    {chit.name}
                  </Typography>

                  <div className="space-y-2">
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <MonetizationOnIcon
                        sx={{ color: "#0284c7", fontSize: 20 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#475569" }}
                      >
                        Amount:{" "}
                        <span style={{ color: "#1e293b", fontWeight: 700 }}>
                          ₹{chit.amount?.toLocaleString("en-IN")}
                        </span>
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <CalendarMonthIcon
                        sx={{ color: "#9333ea", fontSize: 20 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#475569" }}
                      >
                        Duration:{" "}
                        <span style={{ color: "#1e293b", fontWeight: 700 }}>
                          {chit.duration} months
                        </span>
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <ConfirmationNumberIcon
                        sx={{ color: "#ea580c", fontSize: 20 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#475569" }}
                      >
                        Slots:{" "}
                        <span style={{ color: "#1e293b", fontWeight: 700 }}>
                          {chit.slots}
                        </span>
                      </Typography>
                    </Box>
                  </div>

                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                      mt: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        color: "#64748b",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Monthly: ₹
                      {chit.monthlyPayableAmount?.toLocaleString("en-IN")} per
                      slot
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#16a34a", fontWeight: 800, mt: 0.5 }}
                    >
                      Total Monthly: ₹
                      {(chit.monthlyPayableAmount * chit.slots).toLocaleString(
                        "en-IN"
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pt: 1,
                    }}
                  >
                    <StatusPill status={chit.status} />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleOpen(chit)}
                      sx={{
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "11px",
                        backgroundColor: "#2563eb",
                        "&:hover": { backgroundColor: "#1e40af" },
                      }}
                    >
                      VIEW PAYMENTS
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Box>

      {/* PAYMENT DIALOG */}
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        sx={{
          "& .MuiPaper-root": {
            borderRadius: "16px",
            padding: "20px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography
            component="span"
            variant="h6"
            fontWeight={800}
            sx={{ color: "#1e293b" }}
          >
            {selectedChit?.name} – Payment History
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: "#64748b" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {paymentsLoading ? (
            <Box className="py-12 text-center">
              <Typography sx={{ color: "#64748b" }}>
                Loading payments...
              </Typography>
            </Box>
          ) : payments.length === 0 ? (
            <Box className="py-12 text-center">
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: "#1e293b" }}
              >
                No Payments Found
              </Typography>
              <Typography sx={{ color: "#64748b" }}>
                No payment records available for this chit.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={tableHeaderSx}>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Month</TableCell>
                    <TableCell align="right">Payable</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Penalty</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow
                      key={p._id}
                      sx={{
                        "&:nth-of-type(even)": { backgroundColor: "#f8fafc" },
                        "&:hover": { backgroundColor: "#f1f5f9" },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: "#1e293b" }}>
                        {p.invoiceNumber}
                      </TableCell>
                      <TableCell sx={{ color: "#475569", fontWeight: 500 }}>
                        {p.paymentMonth}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#475569" }}>
                        ₹{p.monthlyPayableAmount?.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: "#16a34a", fontWeight: 600 }}
                      >
                        ₹{p.paidAmount?.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#dc2626" }}>
                        ₹{p.penaltyAmount?.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700, color: "#1e293b" }}
                      >
                        ₹{p.totalPaid?.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell align="center">
                        <StatusPill status={p.status} />
                      </TableCell>
                      <TableCell sx={{ color: "#64748b", fontSize: "12px" }}>
                        {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleDownloadPDF(p._id)}
                          sx={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#2563eb",
                            borderColor: "#cbd5e1",
                            borderRadius: "6px",
                            minWidth: "50px",
                            "&:hover": {
                              borderColor: "#2563eb",
                              backgroundColor: "#eff6ff",
                            },
                          }}
                        >
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* NOTIFICATION SNACKBAR */}
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
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          color: "#64748b",
          fontWeight: 600,
          textTransform: "uppercase",
          display: "block",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>
        {value || "-"}
      </Typography>
    </Box>
  );
}
