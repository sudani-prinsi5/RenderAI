"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import Logo from "../components/Logo";
import AboutSection from "../components/AboutSection";

export default function AboutPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { isLight, toggleTheme } = useTheme();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <main
      className={`min-h-screen flex flex-col relative transition-colors duration-200 ${
        isLight
          ? "bg-[#FAF9F6] text-stone-900 selection:bg-amber-100 selection:text-amber-900"
          : "bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white"
      }`}
    >
      {/* Header/Navbar */}
      <header
        className={`border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center w-full backdrop-blur-md transition-colors ${
          isLight
            ? "border-stone-200/90 bg-white/90 shadow-sm"
            : "border-slate-800/80 bg-slate-950/80"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <Logo size={36} />
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            RenderAI Interior Designer
          </span>
        </Link>

        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
          <Link
            href="/"
            className={`transition-all duration-200 px-3.5 py-1.5 rounded-xl ${
              isLight
                ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Home
          </Link>

          <Link
            href="/about"
            className={`transition-all duration-200 px-3.5 py-1.5 rounded-xl ${
              isLight
                ? "text-stone-900 font-semibold bg-stone-100 shadow-sm"
                : "text-white font-semibold bg-slate-800 border border-slate-700 shadow-sm"
            }`}
          >
            About Us
          </Link>

          <Link
            href="/#how-it-works"
            className={`transition-all duration-200 px-3.5 py-1.5 rounded-xl ${
              isLight
                ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            How It Works
          </Link>

          <Link
            href="/#our-team"
            className={`transition-all duration-200 px-3.5 py-1.5 rounded-xl ${
              isLight
                ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            Our Team
          </Link>
        </nav>

        <div className="flex gap-3 items-center">
          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
              isLight
                ? "bg-white hover:bg-stone-100 border-stone-200 text-stone-700"
                : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
            }`}
          >
            {isLight ? "🌙 Dark" : "☀️ Light"}
          </button>

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-md"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`font-medium px-4 py-2 transition ${
                  isLight ? "text-stone-700 hover:text-stone-900" : "text-slate-300 hover:text-white"
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition shadow-md"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main About Section */}
      <AboutSection isLoggedIn={isLoggedIn} />

      {/* Footer */}
      <footer
        className={`border-t py-10 px-6 text-xs transition-colors ${
          isLight ? "border-stone-200 bg-white text-stone-500" : "border-slate-800/80 bg-slate-950 text-slate-400"
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-semibold text-stone-700 dark:text-slate-300">
            <Logo size={24} />
            <span>RenderAI Interior Designer</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-stone-900 dark:hover:text-white transition">
              Home
            </Link>
            <Link href="/about" className="hover:text-stone-900 dark:hover:text-white transition">
              About Us
            </Link>
            <Link href="/#how-it-works" className="hover:text-stone-900 dark:hover:text-white transition">
              How It Works
            </Link>
            <Link href="/#our-team" className="hover:text-stone-900 dark:hover:text-white transition">
              Our Team
            </Link>
            <Link href="/login" className="hover:text-stone-900 dark:hover:text-white transition">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-stone-900 dark:hover:text-white transition">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
