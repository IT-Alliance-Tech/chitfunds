"use client";

import { usePathname } from "next/navigation";
import Topbar from "@/components/dashboard/topbar";
import Sidebar from "@/components/dashboard/sidebar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // hide layout on login page
  const hideLayout = pathname === "/login";

  return (
    <>
      {!hideLayout && (
        <>
          <Topbar />
          <Sidebar />
        </>
      )}

      <main className={`w-full ${!hideLayout ? "xl:pl-[300px]" : ""}`}>
        {children}
      </main>
    </>
  );
}
