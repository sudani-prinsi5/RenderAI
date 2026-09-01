"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "./context/ThemeContext";
import Logo from "./components/Logo";
import AboutSection from "./components/AboutSection";
import HowItWorksSection from "./components/HowItWorksSection";
import OurTeamSection from "./components/OurTeamSection";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");
  const { isLight, toggleTheme } = useTheme();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  // Track the section currently in view to highlight the active navbar item
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "how-it-works", "our-team"];
      const scrollPosition = window.scrollY + 140; // Offset for sticky navbar

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main
      className={`min-h-screen flex flex-col relative transition-colors duration-200 ${isLight
        ? "bg-[#F8F9FA] text-slate-800 selection:bg-indigo-100 selection:text-indigo-900"
        : "bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white"
        }`}
    >
      {/* Header/Navbar */}
      <header
        className={`border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center w-full backdrop-blur-md transition-colors ${isLight
          ? "border-slate-200/90 bg-white/85 shadow-sm"
          : "border-slate-800/80 bg-slate-950/75"
          }`}
      >
        <a href="#home" className="flex items-center gap-3 hover:opacity-90 transition">
          <Logo size={36} />
          <span className="text-xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            RenderAI Interior Designer
          </span>
        </a>

        {/* Navigation Menu: Home -> About Us -> How It Works -> Our Team */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
          <a
            href="#home"
            className={`transition-all duration-200 px-3.5 py-1.5 rounded-xl ${activeSection === "home"
              ? isLight
                ? "text-indigo-600 font-semibold bg-indigo-50 shadow-sm"
                : "text-indigo-400 font-semibold bg-indigo-950/70 border border-indigo-800/50 shadow-sm"
              : isLight
                ? "text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                : "text-slate-400 hover:text-indigo-400 hover:bg-slate-900"
              }`}
          >
            Home
          </a>

          <a
            href="#about"
            className={`transition-all duration-200 px-3.5 py-1.5 rounded-xl ${activeSection === "about"
              ? isLight
                ? "text-indigo-600 font-semibold bg-indigo-50 shadow-sm"
                : "text-indigo-400 font-semibold bg-indigo-950/70 border border-indigo-800/50 shadow-sm"
              : isLight
                ? "text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                : "text-slate-400 hover:text-indigo-400 hover:bg-slate-900"
              }`}
          >
            About Us
          </a>

          <a
            href="#how-it-works"
            className={`transition-all duration-200 px-3.5 py-1.5 rounded-xl ${activeSection === "how-it-works"
              ? isLight
                ? "text-indigo-600 font-semibold bg-indigo-50 shadow-sm"
                : "text-indigo-400 font-semibold bg-indigo-950/70 border border-indigo-800/50 shadow-sm"
              : isLight
                ? "text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                : "text-slate-400 hover:text-indigo-400 hover:bg-slate-900"
              }`}
          >
            How It Works
          </a>

          <a
            href="#our-team"
            className={`transition-all duration-200 px-3.5 py-1.5 rounded-xl ${activeSection === "our-team"
              ? isLight
                ? "text-indigo-600 font-semibold bg-indigo-50 shadow-sm"
                : "text-indigo-400 font-semibold bg-indigo-950/70 border border-indigo-800/50 shadow-sm"
              : isLight
                ? "text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                : "text-slate-400 hover:text-indigo-400 hover:bg-slate-900"
              }`}
          >
            Our Team
          </a>
        </nav>

        <div className="flex gap-3 items-center">
          {/* Quick theme toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${isLight
              ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
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
                className={`font-medium px-4 py-2 transition ${isLight ? "text-slate-700 hover:text-slate-900" : "text-slate-300 hover:text-white"
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

      {/* 1. Hero / Home Section (Full-Bleed Edge-to-Edge) */}
      <section id="home" className="w-full relative p-0 m-0 overflow-hidden scroll-mt-20">
        <div className="w-full relative">
          <Image
            src="/home_page_image.png"
            alt="Interior Living Room Design"
            width={1694}
            height={929}
            priority
            className="w-full h-auto object-cover block"
          />

          {/* Action Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-8 sm:pb-14 px-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-2xl hover:scale-105"
                >
                  Open Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition shadow-2xl hover:scale-105 backdrop-blur-sm"
                  >
                    Start Designing Free
                  </Link>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto font-bold px-8 py-4 rounded-xl text-lg transition bg-white/95 hover:bg-white text-slate-900 shadow-2xl hover:scale-105 backdrop-blur-sm"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. About Us Section */}
      <AboutSection isLoggedIn={isLoggedIn} />

      {/* 3. How It Works Section (Directly after About Us) */}
      <HowItWorksSection isLoggedIn={isLoggedIn} />

      {/* 4. Our Team Section (Directly after How It Works) */}
      <OurTeamSection />

      {/* Footer */}
      <footer
        className={`border-t py-10 px-6 text-xs transition-colors ${isLight ? "border-slate-200 bg-white text-slate-500" : "border-slate-800/80 bg-slate-950 text-slate-400"
          }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <Logo size={24} />
            <span>RenderAI Interior Designer</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#home" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Home
            </a>
            <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              About Us
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              How It Works
            </a>
            <a href="#our-team" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Our Team
            </a>
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
              Get Started
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}