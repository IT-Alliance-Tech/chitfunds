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

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const res = await apiRequest(`/member/details/${id}`);
        setMember(res?.data?.member || null);
      } catch (err) {
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
        `/payment/history?memberId=${member._id}&chitId=${chit.id}`
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
  const safeChits =
    (member.chits || [])
      .map((c) => {
        if (c.chitId && typeof c.chitId === "object") {
          return {
            id: c.chitId._id,
            name: c.chitId.chitName,
            amount: c.chitId.amount,
            duration: c.chitId.duration,
            membersLimit: c.chitId.membersLimit,
            status: c.status,
          };
        }
        return null;
      })
      .filter(Boolean);

  return (
    <main className="p-4 md:p-6 bg-gray-100 min-h-screen space-y-6">

      {/* HEADER */}
      <Card>
        <CardContent className="flex justify-between items-center">
          <Button variant="outlined" onClick={() => router.back()}>
            Back
          </Button>
          <Typography variant="h5" fontWeight={700}>
            Member Details
          </Typography>
          <Box />
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

      {/* ASSIGNED CHITS – ICON CARD DESIGN */}
      <Card>
        <CardContent>
          <Typography fontWeight={600} mb={2}>
            Assigned Chits
          </Typography>

          {safeChits.length === 0 ? (
            <Typography color="text.secondary">
              No chits assigned
            </Typography>
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
                    <Typography>👥 Members Limit: {chit.membersLimit}</Typography>
                    <Typography>✅ Status: {chit.status}</Typography>

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

      {/* PAYMENTS DIALOG */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle className="flex justify-between items-center">
          <Typography fontWeight={600}>
            {selectedChit?.name} – Payment Details
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
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
          "Balance",
          "Total",
          "Mode",
          "Status",
          "Admin",
          "Payment Date",
          "Due Date",
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
          <td className="border px-2 py-1 whitespace-nowrap">
            {p.invoiceNumber}
          </td>

          <td className="border px-2 py-1 whitespace-nowrap">
            {p.paymentMonth}
          </td>

          <td className="border px-2 py-1">
            ₹{p.monthlyPayableAmount}
          </td>

          <td className="border px-2 py-1">
            ₹{p.paidAmount}
          </td>

          <td className="border px-2 py-1">
            ₹{p.penaltyAmount}
          </td>

          <td className="border px-2 py-1">
            ₹{p.balanceAmount}
          </td>

          <td className="border px-2 py-1 font-semibold">
            ₹{p.totalPaid}
          </td>

          <td className="border px-2 py-1 capitalize whitespace-nowrap">
            {p.paymentMode}
          </td>

          <td className="border px-2 py-1 whitespace-nowrap">
            <span
              className={`px-2 py-[2px] rounded-full text-[11px] font-medium ${
                p.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {p.status}
            </span>
          </td>

          <td className="border px-2 py-1 whitespace-nowrap">
            <span
              className={`px-2 py-[2px] rounded-full text-[11px] font-medium ${
                p.isAdminConfirmed
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {p.isAdminConfirmed ? "Yes" : "No"}
            </span>
          </td>

          <td className="border px-2 py-1 whitespace-nowrap">
            {new Date(p.paymentDate).toLocaleDateString()}
          </td>

          <td className="border px-2 py-1 whitespace-nowrap">
            {new Date(p.dueDate).toLocaleDateString()}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</Box>

  )}
</DialogContent>

      </Dialog>
    </main>
  );
}

/* HELPER */
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
