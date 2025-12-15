"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Home, Users, Layers, CreditCard } from "lucide-react";
import Link from "next/link";
import CloseIcon from "@mui/icons-material/Close";


export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const theme = useTheme();
 const isDesktop = useMediaQuery("(min-width:1280px)");


  // 🔑 Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      {isDesktop && (
        <Box
          className="fixed top-0 left-0 z-40"
          sx={{
            width: 300,
            height: "100vh",
            backgroundColor: "#1E1E2F",
            color: "white",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <Box sx={{ fontSize: "24px", fontWeight: "700" }}>Chit Fund</Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <SidebarItem href="/dashboard" icon={<Home size={20} />} label="Dashboard" />
            <SidebarItem href="/members" icon={<Users size={20} />} label="Members" />
            <SidebarItem href="/chits" icon={<Layers size={20} />} label="Chit Management" />
            <SidebarItem href="/payments" icon={<CreditCard size={20} />} label="Payments" />
          </Box>
        </Box>
      )}

      {/* ================= MOBILE HAMBURGER ================= */}
     {!isDesktop && !open && (
  <IconButton
    onClick={() => setOpen(true)}
    sx={{
      position: "fixed",
      top: 90,
      left: 10,
      zIndex: 60,
      width: 50,
      height: 50,
      borderRadius: "50%",
      backgroundColor: "#ffffff",
      border: "1px solid #e5e7eb",
      boxShadow:
        "0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.08)",
      "&:hover": {
        backgroundColor: "#f9fafb",
      },
    }}
  >
    <div className="flex flex-col gap-1.5">
      <span className="w-6 h-0.5 rounded bg-gray-900" />
      <span className="w-6 h-0.5 rounded bg-gray-900" />
      <span className="w-6 h-0.5 rounded bg-gray-900" />
    </div>
  </IconButton>
)}


      {/* ================= MOBILE DRAWER ================= */}
      {!isDesktop && (
        <>
          <Box
            className="fixed top-0 left-0 z-40"
            sx={{
              width: 260,
              height: "100vh",
              backgroundColor: "#1E1E2F",
              color: "white",
              padding: "24px",
              transform: open ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.3s ease-in-out",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div className="flex justify-between items-center">
              <Box sx={{ fontSize: "24px", fontWeight: "700" }}>Chit Fund</Box>
              <IconButton
  onClick={() => setOpen(false)}
  sx={{
    color: "white",
    "&:hover": {
      backgroundColor: "rgba(255,255,255,0.1)",
    },
  }}
>
  <CloseIcon />
</IconButton>

            </div>

            <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <SidebarItem href="/dashboard" icon={<Home size={20} />} label="Dashboard" onClick={() => setOpen(false)} />
              <SidebarItem href="/members" icon={<Users size={20} />} label="Members" onClick={() => setOpen(false)} />
              <SidebarItem href="/chits" icon={<Layers size={20} />} label="Chit Management" onClick={() => setOpen(false)} />
              <SidebarItem href="/payments" icon={<CreditCard size={20} />} label="Payments" onClick={() => setOpen(false)} />
            </Box>
          </Box>

          {/* ================= MOBILE OVERLAY ================= */}
          {open && (
            <div
              className="fixed inset-0 bg-black/40 z-30"
              onClick={() => setOpen(false)}
            />
          )}
        </>
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
