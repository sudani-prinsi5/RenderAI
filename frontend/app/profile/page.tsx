"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../context/ThemeContext";
import { FiUser } from "react-icons/fi";

interface UserProfile {
  user_id?: number;
  full_name: string;
  email: string;
  phone?: string;
}

export default function Profile() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const { isLight } = useTheme();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Invalid user JSON", e);
      router.push("/login");
    }
  }, [router]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const logout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isLight ? "bg-slate-50 text-slate-700" : "bg-slate-950 text-slate-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen flex flex-col relative overflow-hidden transition-colors duration-200 ${
        isLight ? "bg-[#F8F9FA] text-slate-800" : "bg-slate-950 text-slate-100"
      }`}
    >
      {/* Background Gradients */}
      <div
        className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${
          isLight ? "bg-indigo-200/30" : "bg-indigo-900/10"
        }`}
      />
      <div
        className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none ${
          isLight ? "bg-purple-200/30" : "bg-purple-900/10"
        }`}
      />

      {/* Navbar */}
      <Navbar toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar isOpen={isOpen} />

        {/* Main Content */}
        <main
          className={`transition-all duration-300 p-6 md:p-8 w-full flex-1 overflow-y-auto ${
            isOpen ? "ml-64" : "ml-20"
          }`}
        >
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div
              className={`mb-8 border-b pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isLight ? "border-slate-200" : "border-slate-800/80"
              }`}
            >
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <FiUser className="w-8 h-8 text-indigo-500 shrink-0" /> User Profile
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/settings")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md cursor-pointer"
              >
                ⚙ Settings & Passwords
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div
            className={`border backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-8 ${
              isLight ? "bg-white/90 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.05)]" : "bg-slate-900/50 border-slate-800"
            }`}
          >
            {/* Top User Header */}
            <div
              className={`flex flex-col sm:flex-row items-center gap-6 pb-6 border-b text-center sm:text-left ${
                isLight ? "border-slate-200" : "border-slate-800/80"
              }`}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center text-4xl font-extrabold shadow-xl">
                {user.full_name?.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <h2 className={`text-2xl font-bold ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                  {user.full_name}
                </h2>
                <p className="text-sm font-mono text-indigo-500 font-medium">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${
                      isLight
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Verified Active Account
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border p-4 rounded-xl space-y-1 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800/80"
                }`}
              >
                <p className={`text-xs uppercase font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>User ID</p>
                <p className={`text-base font-mono font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  #{user.user_id || "1"}
                </p>
              </div>

              <div
                className={`border p-4 rounded-xl space-y-1 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800/80"
                }`}
              >
                <p className={`text-xs uppercase font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>Full Name</p>
                <p className={`text-base font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>{user.full_name}</p>
              </div>

              <div
                className={`border p-4 rounded-xl space-y-1 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800/80"
                }`}
              >
                <p className={`text-xs uppercase font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>Email Address</p>
                <p className="text-base font-mono text-indigo-500">{user.email}</p>
              </div>

              <div
                className={`border p-4 rounded-xl space-y-1 ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800/80"
                }`}
              >
                <p className={`text-xs uppercase font-semibold ${isLight ? "text-slate-400" : "text-slate-500"}`}>Phone Number</p>
                <p className={`text-base font-mono ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  {user.phone || "Not provided"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div
              className={`flex flex-wrap gap-4 pt-4 border-t ${
                isLight ? "border-slate-200" : "border-slate-800/80"
              }`}
            >
              <button
                onClick={() => router.push("/settings")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-md"
              >
                Change or Reset Password
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer border ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                Dashboard
              </button>

              <button
                onClick={logout}
                className={`ml-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer border ${
                  isLight
                    ? "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600"
                    : "bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 text-rose-300"
                }`}
              >
                Sign Out
              </button>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}