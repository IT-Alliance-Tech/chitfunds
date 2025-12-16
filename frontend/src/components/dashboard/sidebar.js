"use client";

import { useState } from "react";
import { Box, Divider, IconButton } from "@mui/material";
import { Home, Users, Layers, CreditCard } from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* -------- Desktop Sidebar (UNCHANGED) -------- */}
      <Box
        sx={{
          width: 260,
          backgroundColor: "#1E1E2F",
          color: "white",
          height: "full",
          padding: "24px",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Box sx={{ fontSize: "24px", fontWeight: "700" }}>Chit Fund</Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <SidebarItem
            href="/dashboard"
            icon={<Home size={20} />}
            label="Dashboard"
          />
          <SidebarItem
            href="/members"
            icon={<Users size={20} />}
            label="Members"
          />
          <SidebarItem
            href="/chits"
            icon={<Layers size={20} />}
            label="Chit Management"
          />
          <SidebarItem
            href="/payments"
            icon={<CreditCard size={20} />}
            label="Payments"
          />
        </Box>
      </Box>

      {/* -------- Mobile/Tablet Floating Circular Hamburger Button -------- */}
      <IconButton
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-5 left-5 z-50 bg-gray-900 text-white shadow-xl"
        sx={{
          width: 50,
          height: 50,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          display: { xs: "flex", md: "none" },
        }}
      >
        <div className="flex flex-col gap-1.5">
          <span className="w-5 h-0.5 rounded bg_1E1E2F"></span>
          <span className="w-5 h-0.5 rounded bg_1E1E2F"></span>
          <span className="w-5 h-0.5 rounded bg_1E1E2F"></span>
        </div>
      </IconButton>

      {/* -------- Mobile/Tablet Sidebar Drawer -------- */}
      <Box
        sx={{
          width: 260,
          backgroundColor: "#1E1E2F",
          color: "white",
          height: "100vh",
          padding: "24px",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 40,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
          display: { xs: "flex", md: "none" },
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div className="flex justify-between items-center">
          <Box sx={{ fontSize: "24px", fontWeight: "700" }}>Chit Fund</Box>
          <span onClick={() => setOpen(false)}>Close</span>
        </div>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <SidebarItem
            href="/dashboard"
            onClick={() => setOpen(false)}
            icon={<Home size={20} />}
            label="Dashboard"
          />
          <SidebarItem
            href="/members"
            onClick={() => setOpen(false)}
            icon={<Users size={20} />}
            label="Members"
          />
          <SidebarItem
            href="/chits"
            onClick={() => setOpen(false)}
            icon={<Layers size={20} />}
            label="Chit Management"
          />
          <SidebarItem
            href="/payments"
            onClick={() => setOpen(false)}
            icon={<CreditCard size={20} />}
            label="Payments"
          />
        </Box>
      </Box>

      {/* -------- Overlay for Mobile -------- */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

function SidebarItem({ href, icon, label, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
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
