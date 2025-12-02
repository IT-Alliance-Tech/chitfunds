"use client";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";

import {
  Card,
  CardContent,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Paper,
  Chip,
} from "@mui/material";

export default function MemberDetailsPage() {
  // Dummy Design Data
  const member = {
    name: "Lavanya",
    phone: "9876543210",
    address: "Hyderabad, Telangana",
    securityDocs: ["Aadhaar Card", "PAN Card", "Electricity Bill"],

    assignedChit: "CHIT-2000",
    totalPaidChits: 8,
    pendingChits: 2,
    totalPaidAmount: 8000,
    pendingPayment: 2000,
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6">
          <Card className="shadow-lg">
            <CardContent>
              <Typography variant="h5" className="font-semibold mb-4">
                Member Details
              </Typography>

              <Divider className="mb-4" />

              {/* ========== PERSONAL DETAILS ========== */}
              <Typography variant="h6" className="font-semibold mb-2">
                Personal Information
              </Typography>

              <TableContainer component={Paper} className="shadow-sm mb-6">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell>{member.name}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Phone</strong></TableCell>
                      <TableCell>{member.phone}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Address</strong></TableCell>
                      <TableCell>{member.address}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Security Documents</strong></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {member.securityDocs.length ? (
                            member.securityDocs.map((doc) => (
                              <Chip key={doc} label={doc} />
                            ))
                          ) : (
                            <span className="text-gray-500">No documents added</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* ========== CHIT DETAILS ========== */}
              <Typography variant="h6" className="font-semibold mb-2">
                Chit Information
              </Typography>

              <TableContainer component={Paper} className="shadow-sm">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell><strong>Assigned Chit</strong></TableCell>
                      <TableCell>{member.assignedChit}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Total Paid Chits</strong></TableCell>
                      <TableCell>{member.totalPaidChits}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Pending Chits</strong></TableCell>
                      <TableCell>{member.pendingChits}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Total Paid Amount</strong></TableCell>
                      <TableCell>₹ {member.totalPaidAmount}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell><strong>Pending Payment</strong></TableCell>
                      <TableCell>
                        {member.pendingPayment > 0
                          ? `₹ ${member.pendingPayment}`
                          : "No pending payment"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outlined" color="secondary">
                  Back
                </Button>

                <Button variant="contained" color="primary">
                  Add Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
