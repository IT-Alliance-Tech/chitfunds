"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/config/api";

export default function LoginPage() {
  const router = useRouter();

  /* ================= VIEW CONTROL ================= */
  const [view, setView] = useState("login");
  // login | forgot | otp | reset

  /* ================= LOGIN STATE ================= */
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    accessKey: "",
  });

  /* ================= FORGOT FLOW STATE ================= */
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiRequest("/admin/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("admin", JSON.stringify(response.data.admin));

      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEND OTP ================= */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("/admin/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: formData.email }),
      });

      setView("otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("/admin/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          otp,
        }),
      });

      setView("reset");
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= RESET PASSWORD ================= */
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await apiRequest("/admin/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email,
          otp,
          newPassword,
        }),
      });

      alert("Password reset successful");
      setView("login");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="w-full max-w-md rounded-2xl p-8 bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
        <h2 className="text-3xl font-semibold text-center mb-6 text-gray-800">
          {view === "login"
            ? "Login"
            : view === "forgot"
            ? "Forgot Password"
            : view === "otp"
            ? "Verify OTP"
            : "Reset Password"}
        </h2>

        {error && (
          <p className="text-red-600 text-center mb-4">{error}</p>
        )}

        {/* ================= LOGIN ================= */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />

            <Input
              type="text"
              name="accessKey"
              placeholder="Access Key"
              value={formData.accessKey}
              onChange={handleChange}
            />

            <div className="flex justify-end">
              <span
                className="text-sm text-blue-600 cursor-pointer hover:underline"
                onClick={() => setView("forgot")}
              >
                Forgot Password?
              </span>
            </div>

            <PrimaryButton loading={loading} label="Login" />
          </form>
        )}

        {/* ================= FORGOT ================= */}
        {view === "forgot" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              type="email"
              name="email"
              placeholder="Registered Email"
              value={formData.email}
              onChange={handleChange}
            />

            <PrimaryButton loading={loading} label="Send OTP" />

            <BackToLogin onClick={() => setView("login")} />
          </form>
        )}

        {/* ================= OTP ================= */}
        {view === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <PrimaryButton loading={loading} label="Verify OTP" />
          </form>
        )}

        {/* ================= RESET ================= */}
        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <PrimaryButton loading={loading} label="Reset Password" />
          </form>
        )}
      </div>
    </div>
  );
}

/* ================= REUSABLE UI COMPONENTS ================= */

function Input(props) {
  return (
    <input
      {...props}
      required
      className="w-full p-3 rounded-lg border border-gray-300 bg-white
      text-gray-900 placeholder-gray-500
      focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

function PrimaryButton({ label, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-700
      text-white font-semibold transition shadow-md cursor-pointer"
    >
      {loading ? "Please wait..." : label}
    </button>
  );
}

function BackToLogin({ onClick }) {
  return (
    <p
      onClick={onClick}
      className="text-center text-sm text-blue-600 hover:underline cursor-pointer"
    >
      Back to Login
    </p>
  );
}
