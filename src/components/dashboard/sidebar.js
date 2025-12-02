"use client";

import { Box, Divider } from "@mui/material";
import { Home, Users, FileText, Layers, CreditCard } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  return (
    <Box
      sx={{
        width: 260,
        backgroundColor: "#1E1E2F",
        color: "white",
        height: "100vh",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Title */}
      <Box sx={{ fontSize: "24px", fontWeight: "700" }}>Chit Fund</Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

      {/* Navigation */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <SidebarItem href="/dashboard" icon={<Home size={20} />} label="Dashboard" />
        <SidebarItem href="/members" icon={<Users size={20} />} label="Members" />
        <SidebarItem href="/chits" icon={<Layers size={20} />} label="Chit Management" />
        <SidebarItem href="/payments" icon={<CreditCard size={20} />} label="Payments" />
        <SidebarItem href="/reports" icon={<FileText size={20} />} label="Reports" />
      </Box>
    </Box>
  );
}

function SidebarItem({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-gray-700/40 hover:pl-4"
      style={{
        color: "white",
        textDecoration: "none",
        fontSize: "15px",
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
