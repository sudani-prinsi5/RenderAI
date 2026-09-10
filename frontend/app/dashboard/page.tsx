"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../context/ThemeContext";

import {
  FiHome,
  FiUploadCloud,
  FiLayers,
  FiMessageSquare,
  FiBarChart2,
  FiUser,
  FiSettings,
} from "react-icons/fi";

export default function Dashboard() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const { isLight } = useTheme();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const cards = [
    {
      title: "Upload Room",
      desc: "Upload a photo of your bedroom and set room constraints for analysis.",
      icon: FiUploadCloud,
      btnText: "Upload Photo",
      path: "/upload",
    },
    {
      title: "My Designs",
      desc: "View and manage all previous room layouts and furniture configurations.",
      icon: FiLayers,
      btnText: "View Designs",
      path: "/designs",
    },
    {
      title: "AI Chat",
      desc: "Interactively prompt AI to place, shift, or replace furniture items.",
      icon: FiMessageSquare,
      btnText: "Start Chatting",
      path: "/chat",
    },
    {
      title: "Statistics",
      desc: "View usage statistics, detected category metrics, and AI design telemetry.",
      icon: FiBarChart2,
      btnText: "View Analytics",
      path: "/statistics",
    },
    {
      title: "Profile",
      desc: "Update and manage your account details and contact preferences.",
      icon: FiUser,
      btnText: "Open Profile",
      path: "/profile",
    },
    {
      title: "Settings",
      desc: "Configure security, switch between Light and Dark themes, and view app details.",
      icon: FiSettings,
      btnText: "Open Settings",
      path: "/settings",
    },
  ];

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
          <div className="mb-8">
            <h1
              className={`text-3xl font-extrabold mb-2 flex items-center gap-3 ${
                isLight
                  ? "text-slate-900"
                  : "bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent"
              }`}
            >
              <FiHome className="w-8 h-8 text-indigo-500 shrink-0" />
              Welcome 👋
            </h1>

            <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              Manage your AI Interior Designer project, explore layouts, and personalize your experience.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`border backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between h-72 group ${
                    isLight
                      ? "bg-white/90 border-slate-200/90 hover:border-indigo-400 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)]"
                      : "bg-slate-900/50 border-slate-800 hover:border-indigo-500/40"
                  }`}
                >
                  <div>
                    <div
                      className={`p-3 w-14 h-14 rounded-xl flex items-center justify-center border mb-4 shadow-sm group-hover:scale-105 transition-transform ${
                        isLight
                          ? "bg-indigo-50/80 border-indigo-100 text-indigo-600"
                          : "bg-slate-950/60 border-slate-800/80 text-indigo-400"
                      }`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${isLight ? "text-slate-900" : "text-slate-100"}`}>
                      {card.title}
                    </h2>
                    <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {card.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(card.path)}
                    className="w-full sm:w-auto mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition text-center shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
                  >
                    {card.btnText}
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}