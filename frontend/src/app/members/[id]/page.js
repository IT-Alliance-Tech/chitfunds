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

  // ✅ hooks
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedChit, setSelectedChit] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const res = await apiRequest(`/member/details/${id}`);
        setMember(res.data.member);
      } catch (err) {
        console.error("Failed to fetch member details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

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

  const handleOpen = (chit) => {
    setSelectedChit(chit);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedChit(null);
    setOpen(false);
  };

    const safeChits =
    (member.chits || [])
      .map((c) => {
        if (typeof c.chitId === "object" && c.chitId?.id) {
          return {
            id: c.chitId.id,
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

      {/* ================= HEADER ================= */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <Button variant="outlined" onClick={() => router.back()}>
            Back
          </Button>

          <Typography variant="h5" fontWeight={700}>
            Member Details
          </Typography>

          <Box />
        </CardContent>
      </Card>

      {/* ================= PERSONAL DETAILS ================= */}
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
            {Array.isArray(member.securityDocuments) &&
              member.securityDocuments.map((doc, index) => (
                <Chip
                  key={`${doc}-${index}`}
                  label={doc}
                  variant="outlined"
                  color="primary"
                />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* ================= ASSIGNED CHIT ================= */}
{/* ================= ASSIGNED CHIT ================= */}
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



      {/* ================= PAYMENT DIALOG ================= */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle className="flex justify-between items-center">
          <Typography fontWeight={600}>
          {selectedChit?.name} {`–`} Payment Details
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box className="py-10 text-center">
            <Typography variant="h6" gutterBottom>
              No Payment Data
            </Typography>
            <Typography color="text.secondary">
              Payment details will appear once the payment module is integrated.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* ================= HELPER ================= */
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
