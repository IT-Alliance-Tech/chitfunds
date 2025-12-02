"use client";

export default function Topbar() {
  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>

      <button className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition">
        Logout
      </button>
    </header>
  );
}
