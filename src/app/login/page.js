"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Login Submitted:", formData);
      router.push("/dashboard");
    } catch (err) {
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white">
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-800">
          Login
        </h2>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-gray-900 mb-1">Email</label>
            <input
              type="email"
              name="email"
              className="w-full p-3 rounded-lg border border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-900 mb-1">Password</label>
            <input
              type="password"
              name="password"
              className="w-full p-3 rounded-lg border border-gray-300 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end -mt-3">
            <span
              className="text-sm text-blue-600 cursor-pointer hover:underline"
              onClick={() => router.push("/forgot-password")}
            >
             {` Forgot Password?`}
            </span>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white font-semibold p-3 rounded-lg shadow-md"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
