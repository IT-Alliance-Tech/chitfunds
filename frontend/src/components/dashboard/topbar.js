"use client";

const Topbar = () => {
  const handleLogout = () => {
    // clear auth data
    localStorage.removeItem("token");
    localStorage.removeItem("admin");

    // redirect to login
    window.location.href = "/login";
  };

  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center pl-16 md:pl-6 xl:pl-[320px]">
      <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>

      <button
        className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition"
        onClick={handleLogout}
        suppressHydrationWarning
      >
        Logout
      </button>
    </header>
  );
};

export default Topbar;
