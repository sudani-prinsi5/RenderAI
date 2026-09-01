"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import Logo from "../components/Logo";

export default function ForgotPassword() {
  const router = useRouter();
  const { isLight, toggleTheme } = useTheme();

  // Multi-step Flow: 1 = Enter Registered Email, 2 = Verify 6-digit OTP & Set New Password, 3 = Reset Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Resend Timer Countdown
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: any;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Step 1: Send 6-digit Verification Code to Email
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setStatusMsg({ type: "error", text: "Please provide a valid registered email address." });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/forgot-password/send-code", {
        email: cleanEmail,
      });

      setStatusMsg({
        type: "info",
        text: res.data.message || `Verification code sent to ${cleanEmail}. Please check your inbox.`,
      });
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to send reset code. Please check that this email is registered.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Verification Code
  const handleResendCode = async () => {
    if (!canResend || loading) return;
    setStatusMsg(null);

    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.post("/forgot-password/send-code", {
        email: cleanEmail,
      });

      setStatusMsg({
        type: "info",
        text: res.data.message || `New verification code sent to ${cleanEmail}.`,
      });
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to resend code. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setStatusMsg({ type: "error", text: "Please enter the 6-digit verification code." });
      return;
    }

    if (!newPassword) {
      setStatusMsg({ type: "error", text: "Please enter a new password." });
      return;
    }

    if (!passwordRegex.test(newPassword)) {
      setStatusMsg({
        type: "error",
        text: "Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 number, and 1 special symbol (@$!%*?&).",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      const res = await api.post("/forgot-password/reset", {
        email: cleanEmail,
        verification_code: cleanCode,
        new_password: newPassword,
      });

      setStep(3);
      setStatusMsg({
        type: "success",
        text: res.data.message || "Password reset successful! Your new password has been sent to your email address.",
      });

      // Clear fields
      setVerificationCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to reset password. Please check your verification code.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden px-4 transition-colors duration-200 ${
        isLight
          ? "bg-[#F8F9FA] text-slate-800 selection:bg-indigo-100 selection:text-indigo-900"
          : "bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white"
      }`}
    >
      {/* Background Glows */}
      <div
        className={`absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none ${
          isLight ? "bg-indigo-200/40" : "bg-indigo-900/15"
        }`}
      />
      <div
        className={`absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none ${
          isLight ? "bg-purple-200/40" : "bg-purple-900/15"
        }`}
      />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
          isLight
            ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
            : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
        }`}
      >
        {isLight ? "🌙 Dark" : "☀️ Light"}
      </button>

      <div
        className={`border backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 space-y-6 ${
          isLight ? "bg-white/95 border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.06)]" : "bg-slate-900/60 border-slate-800"
        }`}
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block hover:scale-105 transition-transform mb-1">
            <Logo size={48} className="mx-auto" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {step === 3 ? "Reset Complete" : step === 2 ? "Verify & Set Password" : "Reset Password"}
          </h1>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {step === 3
              ? "Your password has been successfully updated"
              : step === 2
              ? `Enter the 6-digit code sent to ${email}`
              : "Enter your registered email to receive an OTP code"}
          </p>
        </div>

        {/* Step Indicator */}
        {step !== 3 && (
          <div className={`flex items-center justify-center gap-3 text-xs font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                step === 1
                  ? isLight
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-indigo-950/80 border-indigo-500 text-indigo-300"
                  : isLight
                  ? "bg-slate-100 border-slate-200 text-slate-400"
                  : "bg-slate-800/40 border-slate-700 text-slate-400"
              }`}
            >
              <span>1</span>
              <span>Request OTP</span>
            </div>
            <div className={`w-6 h-[1px] ${isLight ? "bg-slate-300" : "bg-slate-700"}`} />
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                step === 2
                  ? isLight
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-indigo-950/80 border-indigo-500 text-indigo-300"
                  : isLight
                  ? "bg-slate-100 border-slate-200 text-slate-400"
                  : "bg-slate-800/40 border-slate-700 text-slate-500"
              }`}
            >
              <span>2</span>
              <span>Verify & Reset</span>
            </div>
          </div>
        )}

        {/* Status Alert */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-sm border flex items-start gap-2.5 transition-all ${
              statusMsg.type === "success"
                ? isLight
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-emerald-950/50 border-emerald-800/80 text-emerald-300"
                : statusMsg.type === "info"
                ? isLight
                  ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                  : "bg-indigo-950/50 border-indigo-800/80 text-indigo-300"
                : isLight
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-rose-950/50 border-rose-800/80 text-rose-300"
            }`}
          >
            <span className="text-base mt-[-2px]">
              {statusMsg.type === "success" ? "✅" : statusMsg.type === "info" ? "📬" : "⚠️"}
            </span>
            <span className="flex-1 leading-snug">{statusMsg.text}</span>
          </div>
        )}

        {/* STEP 1: EMAIL INPUT */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Registered Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className={`w-full p-3.5 rounded-xl transition outline-none border focus:ring-2 ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                    : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                }`}
              />
              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                A 6-digit OTP verification code will be sent to this email address.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold p-3.5 rounded-xl transition shadow-md transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? "Sending Verification Code..." : "Send Verification Code ➔"}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY OTP & ENTER NEW PASSWORD */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div
              className={`p-3 rounded-xl border text-center space-y-1 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"
              }`}
            >
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Verification code sent to:</p>
              <p className="font-semibold text-indigo-500 font-mono text-sm">{email}</p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`text-[11px] underline pt-1 block mx-auto cursor-pointer ${
                  isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Change Email Address
              </button>
            </div>

            {/* 6-Digit OTP */}
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider block text-center ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="• • • • • •"
                className={`w-full p-3.5 rounded-xl text-center text-2xl font-mono tracking-[8px] outline-none border-2 focus:ring-2 ${
                  isLight
                    ? "bg-white border-indigo-400 text-slate-900 focus:border-indigo-600 focus:ring-indigo-500/20"
                    : "bg-slate-950 border-indigo-500/50 text-white focus:border-indigo-400 focus:ring-indigo-500/40"
                }`}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
              />

              <div className={`flex items-center justify-between text-xs px-1 pt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                <span>
                  {countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={!canResend || loading}
                      className="text-indigo-600 hover:text-indigo-500 font-semibold underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </span>
                <span className={isLight ? "text-slate-400" : "text-slate-500"}>Valid for 10 mins</span>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="8+ chars with uppercase, number & symbol"
                  className={`w-full p-3.5 pr-12 rounded-xl transition outline-none border focus:ring-2 ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                      : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                  }`}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-sm p-1 cursor-pointer ${
                    isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
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
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password"
                  className={`w-full p-3.5 pr-12 rounded-xl transition outline-none border focus:ring-2 ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                      : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-sm p-1 cursor-pointer ${
                    isLight ? "text-slate-400 hover:text-slate-600" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {confirmPassword && (
                <p
                  className={`text-xs ${
                    newPassword === confirmPassword ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length < 6 || !newPassword || newPassword !== confirmPassword}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold p-3.5 rounded-xl transition shadow-md transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? "Resetting Password..." : "Verify Code & Reset Password ✓"}
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 3 && (
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
                <span className="text-indigo-600 font-mono font-semibold">{email}</span>.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold p-3.5 rounded-xl transition shadow-md"
              >
                Sign In With New Password ➔
              </Link>
            </div>
          </div>
        )}

        {step !== 3 && (
          <div className={`text-center text-sm pt-2 border-t ${isLight ? "border-slate-100 text-slate-500" : "border-slate-800/60 text-slate-400"}`}>
            Remembered your password?{" "}
            <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-semibold transition">
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
