"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import Logo from "../components/Logo";

export default function Login() {
  const router = useRouter();
  const { isLight, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setErrorMsg(null);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = form.email.trim().toLowerCase();
    if (!cleanEmail || !form.password) {
      setErrorMsg("Please enter both Email and Password.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/login", {
        email: cleanEmail,
        password: form.password,
      });

      // Save user session in localStorage
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirect after successful login
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Login failed. Please check your credentials.");
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

      {/* Theme toggle in corner */}
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
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block hover:scale-105 transition-transform mb-1">
            <Logo size={48} className="mx-auto" />
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            Sign in to start designing your spaces
          </p>
        </div>

        {errorMsg && (
          <div
            className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 border ${
              isLight
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-rose-950/50 border-rose-800/80 text-rose-300"
            }`}
          >
            <span className="text-base mt-[-2px]">⚠️</span>
            <span className="flex-1 leading-snug">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="name@example.com"
              className={`w-full p-3.5 rounded-xl transition outline-none border focus:ring-2 ${
                isLight
                  ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20"
                  : "bg-slate-950/80 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30"
              }`}
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-500 hover:text-indigo-600 font-medium transition"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="••••••••"
                className={`w-full p-3.5 pr-12 rounded-xl transition outline-none border focus:ring-2 ${
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
            {loading ? "Signing in..." : "Sign In ➔"}
          </button>
        </form>

        <div className={`text-center text-sm pt-2 border-t ${isLight ? "border-slate-100 text-slate-500" : "border-slate-800/60 text-slate-400"}`}>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-indigo-500 hover:text-indigo-600 font-semibold transition">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}