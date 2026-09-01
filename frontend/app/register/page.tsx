"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import Logo from "../components/Logo";

export default function Register() {
  const router = useRouter();
  const { isLight, toggleTheme } = useTheme();

  // Form State
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Flow State: 1 = Details, 2 = Enter Verification Code, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setStatusMsg(null);
  };

  // Step 1: Validate details and send verification code to user's Gmail
  const handleSendVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusMsg(null);

    // Validate Full Name
    if (!form.full_name.trim() || form.full_name.trim().length < 3) {
      setStatusMsg({ type: "error", text: "Full name must be at least 3 characters." });
      return;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = form.email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      setStatusMsg({ type: "error", text: "Please enter a valid email address (e.g. yourname@gmail.com)." });
      return;
    }

    // Validate Phone (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(form.phone.trim())) {
      setStatusMsg({ type: "error", text: "Phone number must contain exactly 10 digits." });
      return;
    }

    // Validate Password Strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setStatusMsg({
        type: "error",
        text: "Password must be 8+ chars and contain: 1 uppercase, 1 lowercase, 1 number, and 1 special symbol (@$!%*?&).",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/send-verification-code", {
        full_name: form.full_name.trim(),
        email: cleanEmail,
        phone: form.phone.trim(),
      });

      setStatusMsg({
        type: "info",
        text: res.data.message || `Verification code sent to ${cleanEmail}. Please check your Gmail inbox.`,
      });
      setStep(2);
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send verification email. Please verify details.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code and Complete Registration
  const handleVerifyAndRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusMsg(null);

    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setStatusMsg({ type: "error", text: "Please enter the 6-digit verification code sent to your email." });
      return;
    }

    try {
      setLoading(true);
      const cleanEmail = form.email.trim().toLowerCase();

      const res = await api.post("/verify-and-register", {
        full_name: form.full_name.trim(),
        email: cleanEmail,
        phone: form.phone.trim(),
        password: form.password,
        verification_code: cleanCode,
      });

      // Successful Registration
      setStep(3);
      setStatusMsg({
        type: "success",
        text: res.data.message || "Registration Successful! Welcome message sent to your Gmail.",
      });

      // Auto redirect to login after 3.5 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Verification failed. Please check the code and try again.";
      setStatusMsg({ type: "error", text: msg });
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
      {/* Ambient Background Glows */}
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
            {step === 3 ? "Registration Successful" : step === 2 ? "Verify Email Address" : "Create Account"}
          </h1>
        </div>

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-sm border flex items-start gap-2.5 transition-all ${
              statusMsg.type === "success"
                ? isLight
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-emerald-950/50 border-emerald-800/60 text-emerald-300"
                : statusMsg.type === "info"
                ? isLight
                  ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                  : "bg-indigo-950/50 border-indigo-800/60 text-indigo-300"
                : isLight
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-rose-950/50 border-rose-800/60 text-rose-300"
            }`}
          >
            <span className="text-base mt-[-2px]">
              {statusMsg.type === "success" ? "✅" : statusMsg.type === "info" ? "📬" : "⚠️"}
            </span>
            <span className="flex-1 leading-snug">{statusMsg.text}</span>
          </div>
        )}

        {/* STEP 1: ACCOUNT DETAILS FORM */}
        {step === 1 && (
          <form onSubmit={handleSendVerificationCode} className="space-y-4">
            <div className="space-y-1">
              <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="John Doe"
                className={`w-full p-3 rounded-xl transition outline-none border focus:ring-2 ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                    : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                }`}
                value={form.full_name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="yourname@gmail.com"
                className={`w-full p-3 rounded-xl transition outline-none border focus:ring-2 ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                    : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                }`}
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Phone Number (10 Digits)
              </label>
              <input
                type="tel"
                name="phone"
                required
                maxLength={10}
                placeholder="9876543210"
                className={`w-full p-3 rounded-xl transition outline-none border focus:ring-2 ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                    : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                }`}
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  placeholder="8+ chars (Upper, lower, digit, symbol)"
                  className={`w-full p-3 pr-12 rounded-xl transition outline-none border focus:ring-2 ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                      : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
                  }`}
                  value={form.password}
                  onChange={handleChange}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold p-3.5 rounded-xl transition shadow-md transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
            >
              {loading ? "Sending Verification Code..." : "Send Verification Code ➔"}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFICATION OTP CODE FORM */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-5">
            <div
              className={`p-3.5 rounded-xl border text-center space-y-1 ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"
              }`}
            >
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>A 6-digit verification code was sent to:</p>
              <p className="font-semibold text-indigo-500 font-mono text-sm">{form.email}</p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`text-[11px] underline pt-1 block mx-auto cursor-pointer ${
                  isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Change details / email
              </button>
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-wider block text-center ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Enter 6-Digit Code
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
                    `Resend code in ${countdown}s`
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendVerificationCode()}
                      disabled={!canResend || loading}
                      className="text-indigo-600 hover:text-indigo-500 font-semibold underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </span>
                <span className={isLight ? "text-slate-400" : "text-slate-500"}>Expires in 10 mins</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold p-3.5 rounded-xl transition shadow-md transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? "Verifying & Registering..." : "Verify Code & Complete Account ✓"}
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 3 && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-emerald-500">Welcome to AI Interior Designer!</h3>
              <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                Your email has been verified and your account is active.
              </p>
              <p className={`text-xs pt-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>Redirecting you to login in a moment...</p>
            </div>
            <Link
              href="/login"
              className="inline-block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold p-3.5 rounded-xl transition shadow-md"
            >
              Go to Sign In Now ➔
            </Link>
          </div>
        )}

        {step !== 3 && (
          <div className={`text-center text-sm pt-2 border-t ${isLight ? "border-slate-100 text-slate-500" : "border-slate-800/60 text-slate-400"}`}>
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-semibold transition">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}