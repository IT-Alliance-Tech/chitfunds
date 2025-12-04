"use client";

import { useParams, useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
} from "@mui/material";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";

/* ================= MOCK MEMBERS ================= */
const MEMBERS = [
  {
    id: "1",
    name: "Gireeshma Reddy",
    email: "gireeshma@gmail.com",
    address: "Banjara Hills, Hyderabad",
    phone: "9876501234",
    status: "Active",
    documents: ["Aadhaar Card", "PAN Card"],
    chits: ["Silver Chit", "Gold Chit"],
  },
  {
    id: "2",
    name: "Sahana R",
    email: "sahana@gmail.com",
    address: "Whitefield, Bangalore",
    phone: "9900123456",
    status: "Inactive",
    documents: ["Electricity Bill"],
    chits: ["Starter Chit"],
  },
];

/* ================= MOCK CHITS ================= */
const CHITS = [
  { name: "Silver Chit", amount: "₹50,000", duration: "12 Months", members: 50 },
  { name: "Gold Chit", amount: "₹1,00,000", duration: "24 Months", members: 30 },
  { name: "Starter Chit", amount: "₹25,000", duration: "6 Months", members: 40 },
];

/* ================= PAYMENT DUMMY ================= */
const PAYMENT_SUMMARY = [
  {
    chit: "Silver Chit",
    total: "12",
    monthly: "₹4,150",
    paid: "5",
    balance: "₹29,500",
    nextDue: "15 Dec 2025",
  },
  {
    chit: "Gold Chit",
    total: "24",
    monthly: "₹4,200",
    paid: "10",
    balance: "₹58,000",
    nextDue: "20 Dec 2025",
  },
];

export default function MemberDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const member = MEMBERS.find((m) => m.id === id);
  if (!member) return null;

  const memberChits = CHITS.filter((c) =>
    member.chits.includes(c.name)
  );

  const row = (label, value) => (
    <Grid item xs={12}>
      <div className="flex justify-between border-b py-2">
        <Typography fontWeight={500}>{label}</Typography>
        <Typography color="text.secondary">{value}</Typography>
      </div>
    </Grid>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6 space-y-6">
{/* ================= HEADER ================= */}
<div className="relative flex items-center mb-4">

  {/* BACK BUTTON */}
  <Button variant="outlined" onClick={() => router.back()}>
    Back
  </Button>

  {/* CENTERED TITLE */}
  <Typography
    variant="h4"
    fontWeight={600}
    color="black"
    className="absolute left-1/2 -translate-x-1/2"
  >
    Member Details
  </Typography>

</div>


          {/* ================= PERSONAL + DOCUMENTS ================= */}
<Card>
  <CardContent>
    <div className="space-y-3">

      <div>
        <Typography variant="caption">Full Name</Typography>
        <Typography fontWeight={500}>{member.name}</Typography>
      </div>

      <div>
        <Typography variant="caption">Email Address</Typography>
        <Typography fontWeight={500}>{member.email}</Typography>
      </div>

      <div>
        <Typography variant="caption">Phone Number</Typography>
        <Typography fontWeight={500}>{member.phone}</Typography>
      </div>

      <div>
        <Typography variant="caption">Status</Typography>
        <Typography fontWeight={500}>{member.status}</Typography>
      </div>

      <div>
        <Typography variant="caption">Address</Typography>
        <Typography fontWeight={500}>{member.address}</Typography>
      </div>

    </div>

    <Divider sx={{ my: 3 }} />

    {/* ================= SECURITY DOCUMENTS ================= */}
    <Typography fontWeight={600} mb={2}>
      Security Documents
    </Typography>

    <div className="flex flex-wrap gap-2">
      {member.documents.map((doc) => (
        <Chip key={doc} label={doc} />
      ))}
    </div>

  </CardContent>
</Card>


          {/* ================= ASSIGNED CHITS ================= */}
          <Card>
            <CardContent>

              <Typography fontWeight={600} mb={2}>
                Assigned Chits
              </Typography>

              <Table>

                <TableHead>
                  <TableRow>
                    <TableCell>Chit Name</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Members Limit</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {memberChits.map((chit) => (
                    <TableRow key={chit.name}>
                      <TableCell>{chit.name}</TableCell>
                      <TableCell>{chit.amount}</TableCell>
                      <TableCell>{chit.duration}</TableCell>
                      <TableCell>{chit.members}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>

              </Table>

            </CardContent>
          </Card>

          {/* ================= PAYMENT SUMMARY ================= */}
          <Card>
            <CardContent>

              <Typography fontWeight={600} mb={2}>
                Payment Summary
              </Typography>

              <Table>

                <TableHead>
                  <TableRow>
                    <TableCell>Chit</TableCell>
                    <TableCell>Total Installments</TableCell>
                    <TableCell>Monthly Amount</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Next Due</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {PAYMENT_SUMMARY.map((pay) => (
                    <TableRow key={pay.chit}>
                      <TableCell>{pay.chit}</TableCell>
                      <TableCell>{pay.total}</TableCell>
                      <TableCell>{pay.monthly}</TableCell>
                      <TableCell>{pay.paid}</TableCell>
                      <TableCell>{pay.balance}</TableCell>
                      <TableCell>{pay.nextDue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>

              </Table>

            </CardContent>
          </Card>

        </main>

      </div>
    </div>
  );
}
