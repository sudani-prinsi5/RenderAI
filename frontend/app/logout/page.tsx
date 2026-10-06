
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";

export default function LogoutPage() {
  const router = useRouter();
  const { isLight } = useTheme();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.user_id) {
          localStorage.removeItem(`room_design_workspace_state_user_${u.user_id}`);
        }
      }
    } catch {}
    localStorage.removeItem("room_design_workspace_state");
    localStorage.removeItem("active_room_id");
    localStorage.removeItem("user");
    router.push("/login");
  }, [router]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${isLight ? "bg-[#F8F9FA] text-slate-800" : "bg-slate-950 text-slate-200"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-semibold">Signing out...</span>
      </div>
    </div>
  );
}