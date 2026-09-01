"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

interface UserProfile {
  user_id?: number;
  full_name: string;
  email: string;
  phone?: string;
}

export default function Settings() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const { theme, setTheme, isLight, isDark } = useTheme();

  // Active Tab: "security" | "profile" | "appearance" | "about"
  const [activeTab, setActiveTab] = useState<"security" | "profile" | "appearance" | "about">("security");

  // Sub-option under Security: "change" | "forgot"
  const [securityMode, setSecurityMode] = useState<"change" | "forgot">("change");

  // ----------------------------------------
  // Change Password Form State
  // ----------------------------------------
  const [changeForm, setChangeForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeStatus, setChangeStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // ----------------------------------------
  // Forgot Password (in Settings) State
  // ----------------------------------------
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [forgotCountdown, setForgotCountdown] = useState(60);
  const [canResendForgot, setCanResendForgot] = useState(false);

  // Load user session
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setForgotEmail(parsed.email || "");
    } catch (err) {
      console.error("Invalid user data:", err);
      router.push("/login");
    }
  }, [router]);

  // Forgot password OTP countdown timer
  useEffect(() => {
    let timer: any;
    if (forgotStep === 2 && forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown((prev) => prev - 1);
      }, 1000);
    } else if (forgotCountdown === 0) {
      setCanResendForgot(true);
    }
    return () => clearInterval(timer);
  }, [forgotStep, forgotCountdown]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const logout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Password validation regex
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // ----------------------------------------
  // Handle Change Password Submit
  // ----------------------------------------
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeStatus(null);

    if (!changeForm.new_password) {
      setChangeStatus({ type: "error", text: "Please enter a new password." });
      return;
    }

    if (!passwordRegex.test(changeForm.new_password)) {
      setChangeStatus({
        type: "error",
        text: "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special symbol (@$!%*?&).",
      });
      return;
    }

    if (changeForm.new_password !== changeForm.confirm_password) {
      setChangeStatus({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      setChangeLoading(true);
      const res = await api.post("/change-password", {
        user_id: user?.user_id,
        email: user?.email,
        current_password: changeForm.current_password,
        new_password: changeForm.new_password,
      });

      setChangeStatus({
        type: "success",
        text: res.data.message || "Password changed successfully! Your newly created password has been sent to your registered email address.",
      });

      // Clear input fields
      setChangeForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err: any) {
      setChangeStatus({
        type: "error",
        text: err.response?.data?.message || "Failed to change password. Please verify current password and try again.",
      });
    } finally {
      setChangeLoading(false);
    }
  };

  // ----------------------------------------
  // Handle Forgot Password - Send Code (Settings)
  // ----------------------------------------
  const handleSendForgotCode = async () => {
    const targetEmail = (forgotEmail || user?.email || "").trim().toLowerCase();
    if (!targetEmail) {
      setForgotStatus({ type: "error", text: "Registered email address is required." });
      return;
    }

    try {
      setForgotLoading(true);
      setForgotStatus(null);

      const res = await api.post("/forgot-password/send-code", {
        email: targetEmail,
      });

      setForgotStatus({
        type: "info",
        text: res.data.message || `Verification code sent to ${targetEmail}. Please check your Gmail inbox.`,
      });
      setForgotStep(2);
      setForgotCountdown(60);
      setCanResendForgot(false);
    } catch (err: any) {
      setForgotStatus({
        type: "error",
        text: err.response?.data?.message || "Failed to send reset code. Please ensure this email is registered.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  // ----------------------------------------
  // Handle Forgot Password - Reset Password Submit
  // ----------------------------------------
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setForgotStatus({ type: "error", text: "Please enter the complete 6-digit verification code." });
      return;
    }

    if (!forgotNewPass) {
      setForgotStatus({ type: "error", text: "Please enter a new password." });
      return;
    }

    if (!passwordRegex.test(forgotNewPass)) {
      setForgotStatus({
        type: "error",
        text: "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special symbol (@$!%*?&).",
      });
      return;
    }

    if (forgotNewPass !== forgotConfirmPass) {
      setForgotStatus({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      setForgotLoading(true);
      const targetEmail = (forgotEmail || user?.email || "").trim().toLowerCase();

      const res = await api.post("/forgot-password/reset", {
        email: targetEmail,
        verification_code: cleanOtp,
        new_password: forgotNewPass,
      });

      setForgotStep(3);
      setForgotStatus({
        type: "success",
        text: res.data.message || "Password reset successful! Your new password has been sent to your registered email address.",
      });

      // Clear fields
      setForgotOtp("");
      setForgotNewPass("");
      setForgotConfirmPass("");
    } catch (err: any) {
      setForgotStatus({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password. Please check your verification code.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isLight ? "bg-slate-50 text-slate-700" : "bg-slate-950 text-slate-300"
          }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-200 ${isLight
        ? "bg-[#F8F9FA] text-slate-800 selection:bg-indigo-100 selection:text-indigo-900"
        : "bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white"
        }`}
    >
      {/* Ambient background glows */}
      <div
        className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${isLight ? "bg-indigo-200/30" : "bg-indigo-900/10"
          }`}
      />
      <div
        className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${isLight ? "bg-purple-200/30" : "bg-purple-900/10"
          }`}
      />

      {/* Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar isOpen={isOpen} />

        {/* Main Content */}
        <main
          className={`transition-all duration-300 p-6 md:p-8 w-full max-w-7xl mx-auto ${isOpen ? "ml-64" : "ml-20"
            }`}
        >
          {/* Header Title */}
          <div
            className={`mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${isLight ? "border-slate-200" : "border-slate-800/80"
              }`}
          >
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <span>⚙</span> Account & Security Settings
              </h1>
              <p className={`text-sm mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Manage your credentials, password security, email verifications, and interface theme.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer border ${isLight
                  ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white"
                  }`}
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>

          {/* Settings Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Nav Menu */}
            <div className="lg:col-span-4 space-y-4">
              <div
                className={`border rounded-2xl p-4 shadow-xl space-y-1.5 backdrop-blur-xl ${isLight
                  ? "bg-white/90 border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                  : "bg-slate-900/50 border-slate-800/80"
                  }`}
              >
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer ${activeTab === "security"
                    ? isLight
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm"
                      : "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/40 shadow-lg"
                    : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                >
                  <span className="text-lg">🔐</span>
                  <div className="flex-1">
                    <div>Password & Security</div>
                    <div className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      Change Password & Forgot Password
                    </div>
                  </div>
                  {activeTab === "security" && <span className="text-indigo-500 font-bold">●</span>}
                </button>

                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer ${activeTab === "profile"
                    ? isLight
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm"
                      : "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/40 shadow-lg"
                    : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                >
                  <span className="text-lg">👤</span>
                  <div className="flex-1">
                    <div>Account Profile</div>
                    <div className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      View personal details & email
                    </div>
                  </div>
                  {activeTab === "profile" && <span className="text-indigo-500 font-bold">●</span>}
                </button>

                <button
                  onClick={() => setActiveTab("appearance")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer ${activeTab === "appearance"
                    ? isLight
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm"
                      : "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/40 shadow-lg"
                    : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                >
                  <span className="text-lg">🎨</span>
                  <div className="flex-1">
                    <div>Theme & Display</div>
                    <div className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      Light & Dark interface themes
                    </div>
                  </div>
                  {activeTab === "appearance" && <span className="text-indigo-500 font-bold">●</span>}
                </button>

                <button
                  onClick={() => setActiveTab("about")}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition text-left cursor-pointer ${activeTab === "about"
                    ? isLight
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm"
                      : "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-indigo-300 border border-indigo-500/40 shadow-lg"
                    : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                >
                  <span className="text-lg">ℹ️</span>
                  <div className="flex-1">
                    <div>About System</div>
                    <div className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      Application version & details
                    </div>
                  </div>
                  {activeTab === "about" && <span className="text-indigo-500 font-bold">●</span>}
                </button>
              </div>

              {/* User Quick Info Box */}
              <div
                className={`border rounded-2xl p-5 text-sm space-y-3 ${isLight ? "bg-white/80 border-slate-200" : "bg-slate-900/30 border-slate-800/60"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`font-semibold truncate ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                      {user.full_name}
                    </p>
                    <p className={`text-xs font-mono truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {user.email}
                    </p>
                  </div>
                </div>
                <div
                  className={`pt-2 border-t flex items-center justify-between text-xs ${isLight ? "border-slate-200 text-slate-500" : "border-slate-800/80 text-slate-400"
                    }`}
                >
                  <span>Account Status:</span>
                  <span className="text-emerald-500 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active & Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Right Tab Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* ==================================================== */}
              {/* TAB 1: PASSWORD & SECURITY                           */}
              {/* ==================================================== */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* Switcher between Change Password and Forgot Password */}
                  <div
                    className={`p-1.5 rounded-2xl flex gap-2 border ${isLight ? "bg-slate-100 border-slate-200" : "bg-slate-900/60 border-slate-800"
                      }`}
                  >
                    <button
                      onClick={() => {
                        setSecurityMode("change");
                        setChangeStatus(null);
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${securityMode === "change"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : isLight
                          ? "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                    >
                      <span>🔑</span> Change Password
                    </button>

                    <button
                      onClick={() => {
                        setSecurityMode("forgot");
                        setForgotStatus(null);
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${securityMode === "forgot"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                        : isLight
                          ? "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                    >
                      <span>🔄</span> Forgot Password (OTP Reset)
                    </button>
                  </div>

                  {/* ---------------------------------------------------- */}
                  {/* OPTION A: CHANGE PASSWORD                            */}
                  {/* ---------------------------------------------------- */}
                  {securityMode === "change" && (
                    <div
                      className={`border backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 ${isLight
                        ? "bg-white/90 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.05)]"
                        : "bg-slate-900/50 border-slate-800"
                        }`}
                    >
                      <div className={`border-b pb-4 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                        <h2 className={`text-xl font-bold flex items-center gap-2 ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                          <span>🔑</span> Change Account Password
                        </h2>
                      </div>

                      {/* Status Message Alert */}
                      {changeStatus && (
                        <div
                          className={`p-4 rounded-xl text-sm border flex items-start gap-3 transition-all ${changeStatus.type === "success"
                            ? isLight
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-emerald-950/50 border-emerald-800/80 text-emerald-300"
                            : changeStatus.type === "info"
                              ? isLight
                                ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                                : "bg-indigo-950/50 border-indigo-800/80 text-indigo-300"
                              : isLight
                                ? "bg-rose-50 border-rose-200 text-rose-800"
                                : "bg-rose-950/50 border-rose-800/80 text-rose-300"
                            }`}
                        >
                          <span className="text-lg mt-[-2px]">
                            {changeStatus.type === "success" ? "✅" : changeStatus.type === "info" ? "📬" : "⚠️"}
                          </span>
                          <span className="flex-1 leading-relaxed">{changeStatus.text}</span>
                        </div>
                      )}

                      <form onSubmit={handleChangePassword} className="space-y-5">
                        {/* Current Password */}
                        <div className="space-y-1.5">
                          <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPass ? "text" : "password"}
                              required
                              placeholder="Enter your current password"
                              className={`w-full p-3.5 pr-12 rounded-xl transition outline-none border focus:ring-2 ${isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                                : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                                }`}
                              value={changeForm.current_password}
                              onChange={(e) => setChangeForm({ ...changeForm, current_password: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-sm p-1 ${isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                              {showCurrentPass ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-1.5">
                          <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPass ? "text" : "password"}
                              required
                              placeholder="8+ chars with uppercase, lowercase, number & symbol"
                              className={`w-full p-3.5 pr-12 rounded-xl transition outline-none border focus:ring-2 ${isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                                : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                                }`}
                              value={changeForm.new_password}
                              onChange={(e) => setChangeForm({ ...changeForm, new_password: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-sm p-1 ${isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                              {showNewPass ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>

                          {/* Live validation helper */}
                          <div className={`grid grid-cols-2 gap-2 text-[11px] pt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                            <span className={changeForm.new_password.length >= 8 ? "text-emerald-500 font-medium" : "opacity-60"}>
                              ✓ At least 8 characters
                            </span>
                            <span className={/[A-Z]/.test(changeForm.new_password) ? "text-emerald-500 font-medium" : "opacity-60"}>
                              ✓ 1 Uppercase letter
                            </span>
                            <span className={/[0-9]/.test(changeForm.new_password) ? "text-emerald-500 font-medium" : "opacity-60"}>
                              ✓ 1 Number digit
                            </span>
                            <span className={/[@$!%*?&]/.test(changeForm.new_password) ? "text-emerald-500 font-medium" : "opacity-60"}>
                              ✓ 1 Special symbol (@$!%*?&)
                            </span>
                          </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-1.5">
                          <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPass ? "text" : "password"}
                              required
                              placeholder="Re-enter your new password"
                              className={`w-full p-3.5 pr-12 rounded-xl transition outline-none border focus:ring-2 ${isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                                : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                                }`}
                              value={changeForm.confirm_password}
                              onChange={(e) => setChangeForm({ ...changeForm, confirm_password: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                              className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-sm p-1 ${isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                              {showConfirmPass ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                          {changeForm.confirm_password && (
                            <p
                              className={`text-xs ${changeForm.new_password === changeForm.confirm_password ? "text-emerald-500" : "text-rose-500"
                                }`}
                            >
                              {changeForm.new_password === changeForm.confirm_password ? "✓ Passwords match" : "✗ Passwords do not match"}
                            </p>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={changeLoading || !changeForm.new_password || changeForm.new_password !== changeForm.confirm_password}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold p-3.5 rounded-xl transition shadow-lg transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                        >
                          {changeLoading ? "Updating Password..." : "Update Password & Send Email ➔"}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* ---------------------------------------------------- */}
                  {/* OPTION B: FORGOT PASSWORD (OTP RESET IN SETTINGS)    */}
                  {/* ---------------------------------------------------- */}
                  {securityMode === "forgot" && (
                    <div
                      className={`border backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 ${isLight
                        ? "bg-white/90 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.05)]"
                        : "bg-slate-900/50 border-slate-800"
                        }`}
                    >
                      <div className={`border-b pb-4 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                        <h2 className={`text-xl font-bold flex items-center gap-2 ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                          <span>🔄</span> Reset Password via Email Verification
                        </h2>
                      </div>

                      {/* Status Message Alert */}
                      {forgotStatus && (
                        <div
                          className={`p-4 rounded-xl text-sm border flex items-start gap-3 transition-all ${forgotStatus.type === "success"
                            ? isLight
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-emerald-950/50 border-emerald-800/80 text-emerald-300"
                            : forgotStatus.type === "info"
                              ? isLight
                                ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                                : "bg-indigo-950/50 border-indigo-800/80 text-indigo-300"
                              : isLight
                                ? "bg-rose-50 border-rose-200 text-rose-800"
                                : "bg-rose-950/50 border-rose-800/80 text-rose-300"
                            }`}
                        >
                          <span className="text-lg mt-[-2px]">
                            {forgotStatus.type === "success" ? "✅" : forgotStatus.type === "info" ? "📬" : "⚠️"}
                          </span>
                          <span className="flex-1 leading-relaxed">{forgotStatus.text}</span>
                        </div>
                      )}

                      {/* STEP 1: SEND RESET CODE */}
                      {forgotStep === 1 && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                              Registered Email Address
                            </label>
                            <input
                              type="email"
                              required
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="yourname@gmail.com"
                              className={`w-full p-3.5 rounded-xl transition outline-none border focus:ring-2 ${isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                                : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                                }`}
                            />
                            <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                              A 6-digit one-time verification code will be sent to this email address.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleSendForgotCode}
                            disabled={forgotLoading || !forgotEmail}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold p-3.5 rounded-xl transition shadow-lg transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                          >
                            {forgotLoading ? "Sending Verification Code..." : "Send Verification Code ➔"}
                          </button>
                        </div>
                      )}

                      {/* STEP 2: VERIFY OTP & ENTER NEW PASSWORD */}
                      {forgotStep === 2 && (
                        <form onSubmit={handleForgotReset} className="space-y-5">
                          <div
                            className={`border p-4 rounded-xl text-center space-y-1.5 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"
                              }`}
                          >
                            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Verification code dispatched to:</p>
                            <p className="font-semibold text-indigo-500 font-mono text-sm">{forgotEmail}</p>
                            <button
                              type="button"
                              onClick={() => setForgotStep(1)}
                              className={`text-[11px] underline pt-1 block mx-auto cursor-pointer ${isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-slate-200"
                                }`}
                            >
                              Edit Email Address
                            </button>
                          </div>

                          {/* 6-Digit OTP Input */}
                          <div className="space-y-1.5">
                            <label className={`text-xs font-semibold uppercase tracking-wider block text-center ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                              Enter 6-Digit Verification Code
                            </label>
                            <input
                              type="text"
                              maxLength={6}
                              autoFocus
                              placeholder="• • • • • •"
                              className={`w-full p-3.5 rounded-xl text-center text-2xl font-mono tracking-[8px] outline-none border-2 focus:ring-2 ${isLight
                                ? "bg-white border-indigo-400 text-slate-900 focus:border-indigo-600 focus:ring-indigo-500/20"
                                : "bg-slate-950 border-indigo-500/50 text-white focus:border-indigo-400 focus:ring-indigo-500/40"
                                }`}
                              value={forgotOtp}
                              onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ""))}
                            />

                            <div className={`flex items-center justify-between text-xs px-1 pt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                              <span>
                                {forgotCountdown > 0 ? (
                                  `Resend in ${forgotCountdown}s`
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleSendForgotCode}
                                    disabled={!canResendForgot || forgotLoading}
                                    className="text-indigo-600 hover:text-indigo-500 font-semibold underline cursor-pointer"
                                  >
                                    Resend Code
                                  </button>
                                )}
                              </span>
                              <span className={isLight ? "text-slate-400" : "text-slate-500"}>Valid for 10 minutes</span>
                            </div>
                          </div>

                          {/* New Password */}
                          <div className="space-y-1.5">
                            <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                              New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showForgotPass ? "text" : "password"}
                                required
                                placeholder="8+ chars with uppercase, number & symbol"
                                className={`w-full p-3.5 pr-12 rounded-xl transition outline-none border focus:ring-2 ${isLight
                                  ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                                  : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                                  }`}
                                value={forgotNewPass}
                                onChange={(e) => setForgotNewPass(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowForgotPass(!showForgotPass)}
                                className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-sm p-1 ${isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-400 hover:text-slate-200"
                                  }`}
                              >
                                {showForgotPass ? "👁️" : "👁️‍🗨️"}
                              </button>
                            </div>
                          </div>

                          {/* Confirm New Password */}
                          <div className="space-y-1.5">
                            <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <input
                                type={showForgotConfirmPass ? "text" : "password"}
                                required
                                placeholder="Re-enter new password"
                                className={`w-full p-3.5 pr-12 rounded-xl transition outline-none border focus:ring-2 ${isLight
                                  ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                                  : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                                  }`}
                                value={forgotConfirmPass}
                                onChange={(e) => setForgotConfirmPass(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                                className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-sm p-1 ${isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-400 hover:text-slate-200"
                                  }`}
                              >
                                {showForgotConfirmPass ? "👁️" : "👁️‍🗨️"}
                              </button>
                            </div>
                            {forgotConfirmPass && (
                              <p
                                className={`text-xs ${forgotNewPass === forgotConfirmPass ? "text-emerald-500" : "text-rose-500"
                                  }`}
                              >
                                {forgotNewPass === forgotConfirmPass ? "✓ Passwords match" : "✗ Passwords do not match"}
                              </p>
                            )}
                          </div>

                          {/* Security Notice */}
                          <div
                            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs border ${isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-slate-950/40 border-slate-800/80 text-slate-400"
                              }`}
                          >
                            <span className="text-amber-500 text-base">🔒</span>
                            <span>
                              Upon successful reset, your new password will be sent directly to <strong>{forgotEmail}</strong>.
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={forgotLoading || forgotOtp.length < 6 || !forgotNewPass || forgotNewPass !== forgotConfirmPass}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold p-3.5 rounded-xl transition shadow-lg transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                          >
                            {forgotLoading ? "Resetting Password..." : "Verify Code & Reset Password ✓"}
                          </button>
                        </form>
                      )}

                      {/* STEP 3: SUCCESS CONFIRMATION */}
                      {forgotStep === 3 && (
                        <div className="text-center space-y-4 py-4">
                          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-3xl">
                            🎉
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-2xl font-bold text-emerald-500">Password Reset Completed!</h3>
                            <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                              Your password has been successfully updated.
                            </p>
                            <p className={`text-xs pt-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                              A confirmation email containing your newly created password has been sent to{" "}
                              <span className="text-indigo-600 font-mono font-semibold">{forgotEmail}</span>.
                            </p>
                          </div>

                          <div className="pt-3 flex gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setForgotStep(1);
                                setSecurityMode("change");
                                setForgotStatus(null);
                              }}
                              className={`flex-1 font-semibold p-3 rounded-xl transition text-sm cursor-pointer ${isLight
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                }`}
                            >
                              Back to Security Settings
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push("/dashboard")}
                              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold p-3 rounded-xl transition text-sm shadow cursor-pointer"
                            >
                              Go to Dashboard ➔
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 2: ACCOUNT PROFILE OVERVIEW                      */}
              {/* ==================================================== */}
              {activeTab === "profile" && (
                <div
                  className={`border backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 ${isLight ? "bg-white/90 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.05)]" : "bg-slate-900/50 border-slate-800"
                    }`}
                >
                  <div>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                      <span>👤</span> Personal Profile & Credentials
                    </h2>
                    <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Your registered account details in the AI Interior Designer system.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`border p-4 rounded-xl space-y-1 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800/80"
                        }`}
                    >
                      <p className={`text-xs uppercase font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>User ID</p>
                      <p className={`text-base font-mono font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                        {user.user_id || "N/A"}
                      </p>
                    </div>

                    <div
                      className={`border p-4 rounded-xl space-y-1 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800/80"
                        }`}
                    >
                      <p className={`text-xs uppercase font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>Full Name</p>
                      <p className={`text-base font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>{user.full_name}</p>
                    </div>

                    <div
                      className={`border p-4 rounded-xl space-y-1 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800/80"
                        }`}
                    >
                      <p className={`text-xs uppercase font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>Registered Email</p>
                      <p className="text-base font-mono text-indigo-500">{user.email}</p>
                    </div>

                    <div
                      className={`border p-4 rounded-xl space-y-1 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800/80"
                        }`}
                    >
                      <p className={`text-xs uppercase font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>Phone Number</p>
                      <p className={`text-base font-mono ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                        {user.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-4">
                    <button
                      onClick={() => router.push("/profile")}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-md"
                    >
                      View Full Profile Page
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("security");
                        setSecurityMode("change");
                      }}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer border ${isLight
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                        }`}
                    >
                      Change Password ➔
                    </button>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 3: THEME & DISPLAY                               */}
              {/* ==================================================== */}
              {activeTab === "appearance" && (
                <div
                  className={`border backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 ${isLight ? "bg-white/90 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.05)]" : "bg-slate-900/50 border-slate-800"
                    }`}
                >
                  <div className={`border-b pb-4 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                      <span>🎨</span> Theme & Appearance
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Midnight Dark Theme Card */}
                    <div
                      onClick={() => setTheme("dark")}
                      className={`p-5 rounded-2xl relative transition-all duration-200 cursor-pointer group border-2 flex items-center justify-between ${isDark
                        ? "border-indigo-500 bg-slate-950 shadow-[0_0_20px_rgba(99,102,241,0.25)] ring-2 ring-indigo-500/20"
                        : isLight
                          ? "border-slate-200 bg-slate-900/90 text-white hover:border-indigo-400 hover:shadow-md"
                          : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl text-indigo-400">
                          🌙
                        </div>
                        <div>
                          <h3 className={`font-bold text-base ${isDark ? "text-slate-100" : "text-white"}`}>
                            Midnight Dark
                          </h3>
                          <p className="text-xs text-indigo-400 font-medium">Dark obsidian aesthetic</p>
                        </div>
                      </div>

                      {isDark ? (
                        <div className="text-xs bg-indigo-600 text-white font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          ACTIVE
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-slate-200 transition font-medium">
                          Select ➔
                        </span>
                      )}
                    </div>

                    {/* Daylight Light Theme Card */}
                    <div
                      onClick={() => setTheme("light")}
                      className={`p-5 rounded-2xl relative transition-all duration-200 cursor-pointer group border-2 flex items-center justify-between ${isLight
                        ? "border-amber-500 bg-white shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-2 ring-amber-500/20 text-slate-900"
                        : "border-slate-800 bg-slate-900/40 hover:border-amber-500/60 hover:bg-slate-900/80 text-slate-200"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl ${isLight
                            ? "bg-amber-50 border-amber-200 text-amber-500"
                            : "bg-slate-950/60 border-slate-800 text-amber-400"
                            }`}
                        >
                          ☀️
                        </div>
                        <div>
                          <h3 className={`font-bold text-base ${isLight ? "text-slate-900" : "text-slate-200"}`}>
                            Daylight Light
                          </h3>
                          <p className={`text-xs font-medium ${isLight ? "text-amber-600" : "text-slate-400"}`}>
                            Warm ivory studio
                          </p>
                        </div>
                      </div>

                      {isLight ? (
                        <div className="text-xs bg-amber-500 text-slate-900 font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse"></span>
                          ACTIVE
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 group-hover:text-slate-200 transition font-medium">
                          Select ➔
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 4: ABOUT                                         */}
              {/* ==================================================== */}
              {activeTab === "about" && (
                <div
                  className={`border backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 ${isLight ? "bg-white/90 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.05)]" : "bg-slate-900/50 border-slate-800"
                    }`}
                >
                  <div className={`border-b pb-4 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                    <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                      About AI Interior Designer
                    </h2>
                    <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      High-performance AI-driven interior space transformation & object detection platform.
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div
                      className={`flex justify-between py-2 border-b ${isLight ? "border-slate-200" : "border-slate-800/80"
                        }`}
                    >
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>Application Name:</span>
                      <span className={`font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                        AI Interior Designer
                      </span>
                    </div>
                    <div
                      className={`flex justify-between py-2 border-b ${isLight ? "border-slate-200" : "border-slate-800/80"
                        }`}
                    >
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>System Version:</span>
                      <span className="font-mono text-indigo-500 font-semibold">1.1.0 (Production Release)</span>
                    </div>
                    <div
                      className={`flex justify-between py-2 border-b ${isLight ? "border-slate-200" : "border-slate-800/80"
                        }`}
                    >
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>AI Vision Engine:</span>
                      <span className={isLight ? "text-slate-800 font-medium" : "text-slate-200 font-medium"}>
                        Ultralytics YOLOv8 Custom Furniture Detection
                      </span>
                    </div>
                    <div
                      className={`flex justify-between py-2 border-b ${isLight ? "border-slate-200" : "border-slate-800/80"
                        }`}
                    >
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>Theme Engine:</span>
                      <span className="text-amber-500 font-medium">Daylight Light & Midnight Dark Dual Engine</span>
                    </div>
                    <div
                      className={`flex justify-between py-2 border-b ${isLight ? "border-slate-200" : "border-slate-800/80"
                        }`}
                    >
                      <span className={isLight ? "text-slate-500" : "text-slate-400"}>Email Delivery:</span>
                      <span className="text-emerald-500 font-medium">Active (Gmail SMTP TLS)</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={logout}
                      className={`font-semibold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer border ${isLight
                        ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                        : "bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 text-rose-300"
                        }`}
                    >
                      🚪 Sign Out of Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}