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
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { apiRequest } from "@/config/api";

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
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    window.open(
      `${BASE_URL}/payment/invoice/${paymentId}?token=${token}`,
      "_blank"
    );
  };

  return (
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-6">
      <Card>
        <CardContent className="flex justify-between items-center">
          <Button variant="outlined" onClick={() => router.back()}>
            Back
          </Button>
          <Typography variant="h5" fontWeight={700}>
            Member Details
          </Typography>
          <div style={{ width: 80 }} />
        </CardContent>
      </Card>

      {/* PERSONAL DETAILS */}
      <Card>
        <CardContent>
          <Typography fontWeight={600} mb={2}>
            Personal Information
          </Typography>

          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Detail label="Full Name" value={member.name} />
            <Detail label="Email" value={member.email} />
            <Detail label="Phone" value={member.phone} />
            <Detail label="Status" value={member.status} />
            <Detail label="Address" value={member.address} />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography fontWeight={600} mb={1}>
            Security Documents
          </Typography>

          <div className="flex flex-wrap gap-2">
            {(member.securityDocuments || []).map((doc, i) => (
              <Chip key={i} label={doc} variant="outlined" color="primary" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ASSIGNED CHITS */}
      <Card>
        <CardContent>
          <Typography fontWeight={600} mb={2}>
            Assigned Chits
          </Typography>

          {safeChits.length === 0 ? (
            <Typography color="text.secondary">No chits assigned</Typography>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeChits.map((chit) => (
                <Card key={chit.id} variant="outlined">
                  <CardContent className="space-y-1">
                    <Typography variant="h6" fontWeight={600}>
                      {chit.name}
                    </Typography>

                    <Typography>💰 Amount: ₹{chit.amount}</Typography>
                    <Typography>⏳ Duration: {chit.duration} months</Typography>
                    <Typography>🎟️ Slots: {chit.slots}</Typography>
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: "0.85rem",
                        color: "text.secondary",
                      }}
                    >
                      Monthly: ₹{chit.monthlyPayableAmount} per slot
                    </Typography>
                    <Typography fontWeight={700} sx={{ color: "#059669" }}>
                      Total Monthly: ₹{chit.monthlyPayableAmount * chit.slots}
                    </Typography>
                    <Typography>Status: {chit.status}</Typography>

                    <Button
                      size="small"
                      variant="contained"
                      sx={{ mt: 1 }}
                      onClick={() => handleOpen(chit)}
                    >
                      View Payments
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PAYMENT DIALOG */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle className="flex justify-between items-center">
          <Typography fontWeight={600}>
            {selectedChit?.name} – Payment Details
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {paymentsLoading ? (
            <Box className="py-10 text-center">
              <Typography>Loading payments...</Typography>
            </Box>
          ) : payments.length === 0 ? (
            <Box className="py-10 text-center">
              <Typography variant="h6">No Payments Found</Typography>
              <Typography color="text.secondary">
                No payment records available for this chit.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <table className="min-w-full border text-[12px]">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      "Invoice",
                      "Month",
                      "Payable",
                      "Paid",
                      "Penalty",
                      "Total",
                      "Status",
                      "Payment Date",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="border px-2 py-1 text-left font-semibold whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="border px-2 py-1">{p.invoiceNumber}</td>
                      <td className="border px-2 py-1">{p.paymentMonth}</td>
                      <td className="border px-2 py-1">
                        ₹{p.monthlyPayableAmount}
                      </td>
                      <td className="border px-2 py-1">₹{p.paidAmount}</td>
                      <td className="border px-2 py-1">₹{p.penaltyAmount}</td>
                      <td className="border px-2 py-1 font-semibold">
                        ₹{p.totalPaid}
                      </td>
                      <td className="border px-2 py-1">
                        <span
                          className={`px-2 py-[2px] rounded-full text-[10px] uppercase font-medium ${
                            p.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="border px-2 py-1">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="border px-2 py-1">
                        <Button
                          size="small"
                          sx={{ minWidth: 0, py: 0, fontSize: "10px" }}
                          onClick={() => handleDownloadPDF(p._id)}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={600}>{value || "-"}</Typography>
    </Box>
  );
}
