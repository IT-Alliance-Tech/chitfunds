"use client";

// (paste the same component you already shared)

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
