"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/config/api";
import { Snackbar, Alert } from "@mui/material";

/* ================= REUSABLE UI COMPONENTS ================= */

const Input = (props) => (
  <input
    {...props}
    required
    className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    suppressHydrationWarning
  />
);

const PrimaryButton = ({ label, loading }) => (
  <button
    type="submit"
    disabled={loading}
    className="w-full p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-md cursor-pointer"
    suppressHydrationWarning
  >
    {loading ? "Please wait..." : label}
  </button>
);

const BackToLogin = ({ onClick }) => (
  <p
    onClick={onClick}
    className="text-center text-sm text-blue-600 hover:underline cursor-pointer"
  >
    Back to Login
  </p>
);

/* ================= LOGIN PAGE COMPONENT ================= */

const LoginPage = () => {
  const router = useRouter();

  // View State: login | forgot | otp | reset
  const [view, setView] = useState("login");

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    accessKey: "",
  });

  // Forgot Password State
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Timer State
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimerActive, setIsTimerActive] = useState(false);

  /* ================= HELPERS ================= */

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    let timer;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft]);

  /* ================= HANDLERS ================= */

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiRequest("/admin/login", "POST", formData);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("admin", JSON.stringify(response.data.admin));

      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("/admin/forgot-password", "POST", {
        email: formData.email,
      });
      setView("otp");
      setTimeLeft(120);
      setIsTimerActive(true);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("/admin/verify-otp", "POST", {
        email: formData.email,
        otp,
      });
      setView("reset");
    } catch (err) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await apiRequest("/admin/reset-password", "POST", {
        email: formData.email,
        otp,
        newPassword,
      });

      showNotification("Password reset successful");
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

  /* ================= RENDER ================= */

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

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

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

        {view === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <div className="flex flex-col items-center space-y-3">
              {isTimerActive ? (
                <p className="text-sm text-gray-500">
                  Resend OTP in{" "}
                  <span className="font-mono text-blue-600">
                    {formatTime(timeLeft)}
                  </span>
                </p>
              ) : (
                <span
                  className="text-sm text-blue-600 cursor-pointer hover:underline font-medium"
                  onClick={handleSendOtp}
                >
                  Resend OTP
                </span>
              )}

              <PrimaryButton loading={loading} label="Verify OTP" />
            </div>

            <BackToLogin onClick={() => setView("login")} />
          </form>
        )}

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

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LoginPage;
