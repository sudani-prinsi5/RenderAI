"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "../context/ThemeContext";

interface SidebarProps {
  isOpen: boolean;
}

interface User {
  full_name: string;
  email?: string;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const { isLight } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (pathname && pathname.startsWith("/settings")) {
      setIsSettingsOpen(true);
    }
  }, [pathname]);

  // Load logged-in user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error reading user data:", error);
      }
    }
  }, []);

  // Logout
  const logout = () => {
    localStorage.removeItem("user");
    alert("Logout Successful");
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", icon: "🏠", path: "/dashboard" },
    { label: "Upload Room", icon: "📤", path: "/upload" },
    { label: "AI Chat", icon: "🤖", path: "/chat" },
    { label: "My Designs", icon: "🖼", path: "/designs" },
    { label: "Statistics", icon: "📊", path: "/statistics" },
    { label: "Profile", icon: "👤", path: "/profile" },
  ];

  const settingsSubItems = [
    { label: "Change Password", icon: "🔑", path: "/settings?tab=change-password" },
    { label: "Forgot Password", icon: "🔄", path: "/settings?tab=forgot-password" },
    { label: "Theme & Display", icon: "🎨", path: "/settings?tab=appearance" },
  ];

  const toggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  return (
    <div
      className={`h-[calc(100vh-4rem)] fixed top-16 left-0 transition-all duration-300 z-40 flex flex-col justify-between overflow-y-auto ${isOpen ? "w-64" : "w-20"
        } ${isLight
          ? "bg-white/95 backdrop-blur-md text-slate-700 border-r border-slate-200/90 shadow-[2px_0_12px_rgba(0,0,0,0.03)]"
          : "bg-slate-950/95 backdrop-blur-md text-slate-100 border-r border-slate-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.4)]"
        }`}
    >
      <div>
        {/* User Info Card */}
        <div
          className={`flex flex-col items-center py-6 border-b transition-colors ${isLight ? "border-slate-200/80 bg-slate-50/50" : "border-slate-800/80 bg-slate-900/20"
            }`}
        >
          {/* User Avatar */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-extrabold text-white shadow-md">
            {user?.full_name?.charAt(0).toUpperCase() || "P"}
          </div>

          {/* User Details */}
          {isOpen && (
            <div className="text-center px-4 mt-2.5 overflow-hidden w-full">
              <h2
                className={`font-bold text-sm truncate ${isLight ? "text-slate-800" : "text-slate-200"
                  }`}
              >
                {user?.full_name || "User"}
              </h2>

              <p className="text-emerald-500 text-xs flex items-center justify-center gap-1 font-medium mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </p>
            </div>
          )}
        </div>

        {/* Navigation Menu Items */}
        <div className="mt-3 flex flex-col px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 flex items-center gap-3 cursor-pointer group ${isLight
                  ? "hover:bg-indigo-50/90 text-slate-700 hover:text-indigo-600 font-medium"
                  : "hover:bg-slate-900 text-slate-300 hover:text-indigo-400 font-medium"
                }`}
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
              {isOpen && <span className="text-sm tracking-wide">{item.label}</span>}
            </button>
          ))}

          {/* Expandable Settings Menu */}
          <div>
            <button
              onClick={toggleSettings}
              className={`w-full px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 flex items-center justify-between cursor-pointer group ${isLight
                  ? "hover:bg-indigo-50/90 text-slate-700 hover:text-indigo-600 font-medium"
                  : "hover:bg-slate-900 text-slate-300 hover:text-indigo-400 font-medium"
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">⚙</span>
                {isOpen && <span className="text-sm tracking-wide">Settings</span>}
              </div>
              {isOpen && (
                <span
                  className={`text-xs text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 ${
                    isSettingsOpen ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              )}
            </button>

            {/* Settings Submenu */}
            {isOpen && isSettingsOpen && (
              <div
                className={`mt-1 ml-4 pl-3 border-l space-y-1 transition-all duration-200 ${
                  isLight ? "border-slate-200" : "border-slate-800"
                }`}
              >
                {settingsSubItems.map((subItem) => (
                  <button
                    key={subItem.path}
                    onClick={() => router.push(subItem.path)}
                    className={`w-full px-3 py-2 rounded-xl text-left transition-all duration-150 flex items-center gap-2.5 cursor-pointer group ${
                      isLight
                        ? "hover:bg-indigo-50/90 text-slate-600 hover:text-indigo-600 font-medium text-xs"
                        : "hover:bg-slate-900 text-slate-400 hover:text-indigo-400 font-medium text-xs"
                    }`}
                  >
                    <span className="text-sm group-hover:scale-110 transition-transform">{subItem.icon}</span>
                    <span className="truncate">{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout at bottom */}
      <div className="p-3 border-t border-inherit">
        <button
          onClick={logout}
          className={`w-full px-3.5 py-2.5 rounded-xl text-left transition flex items-center gap-3 cursor-pointer ${isLight
              ? "hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-semibold"
              : "hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 font-semibold"
            }`}
        >
          <span className="text-lg">🚪</span>
          {isOpen && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}