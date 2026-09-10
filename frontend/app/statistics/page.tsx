"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../context/ThemeContext";
import { FiBarChart2 } from "react-icons/fi";

interface StatisticsData {
  total_rooms: number;
  empty_rooms: number;
  processed_rooms: number;
  total_objects_detected: number;
  designs_with_furniture: number;
  total_budget_spent: number;
  avg_room_area: number;
  furniture_distribution: Record<string, number>;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [error, setError] = useState("");
  const { isLight } = useTheme();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        let userIdParam = "";
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user.user_id) {
              userIdParam = `?user_id=${user.user_id}`;
            }
          } catch {
            /* ignore */
          }
        }

        const res = await api.get(`/statistics${userIdParam}`);
        if (res.data.success) {
          setStats(res.data.statistics);
        } else {
          setError("Failed to load statistics.");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Calculate the max count to scale progress bars
  const maxFurnitureCount = stats
    ? Math.max(...Object.values(stats.furniture_distribution), 1)
    : 1;

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

      <Navbar toggleSidebar={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isOpen} />

        <main
          className={`transition-all duration-300 p-6 md:p-8 w-full flex-1 overflow-y-auto ${
            isOpen ? "ml-64" : "ml-20"
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b pb-6 ${
                isLight ? "border-slate-200" : "border-slate-800/80"
              }`}
            >
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <FiBarChart2 className="w-8 h-8 text-indigo-500 shrink-0" /> Project Statistics
              </h1>
              <p className={`text-sm mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Usage telemetry and AI design analytics for your account.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer border ${
                isLight
                  ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              ← Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div
              className={`p-4 rounded-xl border ${
                isLight ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-rose-950/50 border-rose-800/80 text-rose-300"
              }`}
            >
              {error}
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                  className={`border rounded-2xl p-6 shadow-xl space-y-2 backdrop-blur-xl ${
                    isLight
                      ? "bg-white/90 border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                      : "bg-slate-900/50 border-slate-800"
                  }`}
                >
                  <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Total Uploaded Rooms
                  </div>
                  <div className="text-4xl font-extrabold text-indigo-500">
                    {stats.total_rooms}
                  </div>
                  <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    {stats.empty_rooms} empty · {stats.processed_rooms} with objects
                  </div>
                </div>

                <div
                  className={`border rounded-2xl p-6 shadow-xl space-y-2 backdrop-blur-xl ${
                    isLight
                      ? "bg-white/90 border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                      : "bg-slate-900/50 border-slate-800"
                  }`}
                >
                  <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Custom Designs Created
                  </div>
                  <div className="text-4xl font-extrabold text-emerald-500">
                    {stats.designs_with_furniture}
                  </div>
                  <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Active layout designs with custom items
                  </div>
                </div>

                <div
                  className={`border rounded-2xl p-6 shadow-xl space-y-2 backdrop-blur-xl ${
                    isLight
                      ? "bg-white/90 border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                      : "bg-slate-900/50 border-slate-800"
                  }`}
                >
                  <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Average Room Area
                  </div>
                  <div className="text-4xl font-extrabold text-amber-500">
                    {stats.avg_room_area} <span className="text-lg font-normal">sqft</span>
                  </div>
                  <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Calculated from uploaded room dimensions
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Furniture Distribution list */}
                <div
                  className={`border rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-6 backdrop-blur-xl ${
                    isLight
                      ? "bg-white/90 border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                      : "bg-slate-900/50 border-slate-800"
                  }`}
                >
                  <h2 className={`text-lg font-bold ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                    Furniture Category Distribution
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(stats.furniture_distribution).map(([name, count]) => {
                      const percentage =
                        stats.designs_with_furniture > 0
                          ? (count / maxFurnitureCount) * 100
                          : 0;
                      return (
                        <div key={name} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className={`capitalize font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                              {name}
                            </span>
                            <span className="font-bold text-indigo-500">
                              {count} {count === 1 ? "unit" : "units"}
                            </span>
                          </div>
                          <div className={`w-full rounded-full h-2.5 overflow-hidden ${isLight ? "bg-slate-100" : "bg-slate-800"}`}>
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detections Overview */}
                <div
                  className={`border rounded-2xl p-6 shadow-xl flex flex-col justify-between backdrop-blur-xl ${
                    isLight
                      ? "bg-white/90 border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                      : "bg-slate-900/50 border-slate-800"
                  }`}
                >
                  <div>
                    <h2 className={`text-lg font-bold mb-4 ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                      Vision Overview
                    </h2>
                    <div className="space-y-4 text-sm">
                      <div
                        className={`flex justify-between items-center py-2.5 border-b ${
                          isLight ? "border-slate-100" : "border-slate-800/80"
                        }`}
                      >
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Bounding Boxes</span>
                        <span className="font-bold text-indigo-500">{stats.total_objects_detected}</span>
                      </div>
                      <div
                        className={`flex justify-between items-center py-2.5 border-b ${
                          isLight ? "border-slate-100" : "border-slate-800/80"
                        }`}
                      >
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Empty Rooms</span>
                        <span className="font-bold text-emerald-500">{stats.empty_rooms}</span>
                      </div>
                      <div
                        className={`flex justify-between items-center py-2.5 border-b ${
                          isLight ? "border-slate-100" : "border-slate-800/80"
                        }`}
                      >
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Furnished Rooms</span>
                        <span className="font-bold text-purple-500">{stats.processed_rooms}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`mt-6 p-4 rounded-xl text-xs leading-relaxed border ${
                      isLight
                        ? "bg-indigo-50/80 border-indigo-100 text-indigo-900"
                        : "bg-slate-950/60 border-slate-800 text-slate-400"
                    }`}
                  >
                    ℹ️ YOLOv8 object detection detects standard items on upload, allowing you to selectively replace or remove them using AI Chat.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-center py-12 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
              No statistics data available.
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
