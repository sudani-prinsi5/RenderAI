"use client";

import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import Logo from "./Logo";

interface NavbarProps {
  toggleSidebar: () => void;
}

interface User {
  full_name: string;
  email?: string;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const { isLight, toggleTheme } = useTheme();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Invalid user JSON in Navbar", e);
      }
    }
  }, []);

  return (
    <header
      className={`h-16 shrink-0 border-b px-6 flex justify-between items-center transition-colors duration-200 sticky top-0 z-40 backdrop-blur-md ${isLight
        ? "bg-white/90 border-slate-200 shadow-sm"
        : "bg-slate-950/90 border-slate-800/80"
        }`}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className={`text-2xl p-1.5 rounded-lg transition ${isLight
            ? "hover:text-indigo-600 hover:bg-slate-100 text-slate-700"
            : "hover:text-indigo-400 hover:bg-slate-900 text-slate-200"
            }`}
        >
          ☰
        </button>

        <div className="flex items-center gap-3">
          <Logo size={30} />
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent hidden sm:block">
            RenderAI Interior Designer
          </h1>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Quick Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isLight ? "Midnight Dark" : "Daylight Light"} Theme`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${isLight
            ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900"
            : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            }`}
        >
          <span className="text-sm">{isLight ? "🌙" : "☀️"}</span>
          <span className="hidden md:inline">{isLight ? "Dark Mode" : "Light Mode"}</span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
            {user?.full_name?.charAt(0).toUpperCase() || "P"}
          </div>

          <div className="hidden md:block text-left">
            <p className={`font-semibold text-sm leading-tight ${isLight ? "text-slate-800" : "text-slate-200"}`}>
              {user?.full_name || "User"}
            </p>

            <p className="text-xs text-emerald-500 flex items-center gap-1 font-medium mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}