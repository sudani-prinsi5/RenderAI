"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

interface HowItWorksSectionProps {
  isLoggedIn?: boolean;
}

export default function HowItWorksSection({ isLoggedIn = false }: HowItWorksSectionProps) {
  const { isLight } = useTheme();
  const startDesigningHref = isLoggedIn ? "/upload" : "/register?redirect=/upload";

  return (
    <div id="how-it-works" className="scroll-mt-16 w-full">
      {/* =========================================================================
          PART 1 — HOW RENDERAI HELPS (4-STEP PROCESS)
          ========================================================================= */}
      <section
        className={`py-20 lg:py-28 px-6 lg:px-12 border-t transition-colors duration-200 ${
          isLight
            ? "bg-[#FAF9F6] text-stone-900 border-stone-200/80"
            : "bg-[#0B0F17] text-slate-100 border-slate-800/80"
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section Header */}
          <div className="max-w-3xl space-y-4">
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] border ${
                isLight
                  ? "bg-stone-100/90 text-stone-700 border-stone-200"
                  : "bg-slate-900 text-slate-300 border-slate-800"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
              How RenderAI Helps
            </div>

            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.18] ${
                isLight ? "text-stone-900" : "text-white"
              }`}
            >
              A Simple Process, Better Ideas
            </h2>

            <p
              className={`text-base sm:text-lg leading-relaxed ${
                isLight ? "text-stone-600" : "text-slate-300"
              }`}
            >
              RenderAI is designed to make room redesign simple. Start with your existing space, tell the AI what you want, and visualize the possibilities.
            </p>
          </div>

          {/* 4-Step Horizontal Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 01 */}
            <div
              className={`p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${
                isLight
                  ? "bg-white border-stone-200 shadow-sm hover:shadow-md hover:border-amber-600/40"
                  : "bg-slate-900/60 border-slate-800 shadow-md hover:shadow-xl hover:border-amber-500/40"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                      isLight
                        ? "bg-stone-100 border-stone-200 text-stone-800 group-hover:bg-amber-50 group-hover:text-amber-700"
                        : "bg-slate-800 border-slate-700 text-slate-200 group-hover:bg-amber-950/40 group-hover:text-amber-400"
                    }`}
                  >
                    {/* Camera / Upload Icon */}
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                      isLight
                        ? "bg-stone-50 border-stone-200 text-stone-600"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    01
                  </span>
                </div>

                <div>
                  <h3
                    className={`text-lg font-bold tracking-tight uppercase mb-2 ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    Start with Your Room
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isLight ? "text-stone-600" : "text-slate-400"
                    }`}
                  >
                    Upload a photo of your existing room and begin with the space you already have.
                  </p>
                </div>
              </div>

              <div
                className={`pt-5 mt-6 border-t text-[11px] font-medium ${
                  isLight ? "border-stone-100 text-stone-500" : "border-slate-800 text-slate-500"
                }`}
              >
                No need to recreate 3D blueprints
              </div>
            </div>

            {/* Step 02 */}
            <div
              className={`p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${
                isLight
                  ? "bg-white border-stone-200 shadow-sm hover:shadow-md hover:border-amber-600/40"
                  : "bg-slate-900/60 border-slate-800 shadow-md hover:shadow-xl hover:border-amber-500/40"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                      isLight
                        ? "bg-stone-100 border-stone-200 text-stone-800 group-hover:bg-amber-50 group-hover:text-amber-700"
                        : "bg-slate-800 border-slate-700 text-slate-200 group-hover:bg-amber-950/40 group-hover:text-amber-400"
                    }`}
                  >
                    {/* Chat Bubble Icon */}
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                      isLight
                        ? "bg-stone-50 border-stone-200 text-stone-600"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    02
                  </span>
                </div>

                <div>
                  <h3
                    className={`text-lg font-bold tracking-tight uppercase mb-2 ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    Tell Us What You Want
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isLight ? "text-stone-600" : "text-slate-400"
                    }`}
                  >
                    Continue through the AI chat and describe your preferences, furniture requirements, room dimensions, style, and budget naturally through conversation.
                  </p>
                </div>
              </div>

              <div
                className={`pt-5 mt-6 border-t text-[11px] font-medium ${
                  isLight ? "border-stone-100 text-stone-500" : "border-slate-800 text-slate-500"
                }`}
              >
                Intuitive natural language prompts
              </div>
            </div>

            {/* Step 03 */}
            <div
              className={`p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${
                isLight
                  ? "bg-white border-stone-200 shadow-sm hover:shadow-md hover:border-amber-600/40"
                  : "bg-slate-900/60 border-slate-800 shadow-md hover:shadow-xl hover:border-amber-500/40"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                      isLight
                        ? "bg-stone-100 border-stone-200 text-stone-800 group-hover:bg-amber-50 group-hover:text-amber-700"
                        : "bg-slate-800 border-slate-700 text-slate-200 group-hover:bg-amber-950/40 group-hover:text-amber-400"
                    }`}
                  >
                    {/* Spatial Detection / Scan Icon */}
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                      isLight
                        ? "bg-stone-50 border-stone-200 text-stone-600"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    03
                  </span>
                </div>

                <div>
                  <h3
                    className={`text-lg font-bold tracking-tight uppercase mb-2 ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    Understand Your Space
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isLight ? "text-stone-600" : "text-slate-400"
                    }`}
                  >
                    RenderAI uses AI to understand the room and identify existing furniture and objects before suggesting or modifying the design.
                  </p>
                </div>
              </div>

              <div
                className={`pt-5 mt-6 border-t text-[11px] font-medium ${
                  isLight ? "border-stone-100 text-stone-500" : "border-slate-800 text-slate-500"
                }`}
              >
                Object recognition &amp; spatial bounds
              </div>
            </div>

            {/* Step 04 */}
            <div
              className={`p-7 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${
                isLight
                  ? "bg-white border-stone-200 shadow-sm hover:shadow-md hover:border-amber-600/40"
                  : "bg-slate-900/60 border-slate-800 shadow-md hover:shadow-xl hover:border-amber-500/40"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
                      isLight
                        ? "bg-stone-100 border-stone-200 text-stone-800 group-hover:bg-amber-50 group-hover:text-amber-700"
                        : "bg-slate-800 border-slate-700 text-slate-200 group-hover:bg-amber-950/40 group-hover:text-amber-400"
                    }`}
                  >
                    {/* Photorealistic Render / Sparkle Icon */}
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                      isLight
                        ? "bg-stone-50 border-stone-200 text-stone-600"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    04
                  </span>
                </div>

                <div>
                  <h3
                    className={`text-lg font-bold tracking-tight uppercase mb-2 ${
                      isLight ? "text-stone-900" : "text-white"
                    }`}
                  >
                    Visualize Your Design
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      isLight ? "text-stone-600" : "text-slate-400"
                    }`}
                  >
                    Get a redesigned visualization of your room and explore how different furniture and design choices can work in your existing space.
                  </p>
                </div>
              </div>

              <div
                className={`pt-5 mt-6 border-t text-[11px] font-medium ${
                  isLight ? "border-stone-100 text-stone-500" : "border-slate-800 text-slate-500"
                }`}
              >
                Photorealistic lighting &amp; textures
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PART 2 — WHAT WE'RE WORKING TOWARDS
          ========================================================================= */}
      <section
        className={`py-20 lg:py-28 px-6 lg:px-12 border-t transition-colors duration-200 ${
          isLight
            ? "bg-white text-stone-900 border-stone-200/80"
            : "bg-slate-950 text-slate-100 border-slate-800/80"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.2em] border ${
                  isLight
                    ? "bg-stone-100/90 text-stone-700 border-stone-200"
                    : "bg-slate-900 text-slate-300 border-slate-800"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
                What We&apos;re Working Towards
              </div>

              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.18] ${
                  isLight ? "text-stone-900" : "text-white"
                }`}
              >
                Your Space. Your Ideas. Your Way.
              </h2>

              <div
                className={`space-y-4 text-base sm:text-lg leading-relaxed ${
                  isLight ? "text-stone-600" : "text-slate-300"
                }`}
              >
                <p>
                  RenderAI is built around a simple idea: technology should make it easier to explore the choices we make in our everyday spaces.
                </p>
                <p>
                  By combining AI with interior design, we want to give people a more practical way to visualize their ideas before turning them into reality.
                </p>
                <p className="font-semibold text-stone-900 dark:text-white">
                  It is not about replacing creativity.
                </p>
                <p>
                  It is about giving your ideas a place to start.
                </p>
              </div>

              {/* Call to Action Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  href={startDesigningHref}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-stone-900 to-stone-800 hover:from-stone-800 hover:to-stone-700 dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Start Designing</span>
                  <span className="text-lg">→</span>
                </Link>

                <p className={`text-xs ${isLight ? "text-stone-500" : "text-slate-400"}`}>
                  Begin with a photo of your existing room.
                </p>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="lg:col-span-6 relative">
              <div
                className={`relative rounded-2xl lg:rounded-3xl overflow-hidden border shadow-xl ${
                  isLight
                    ? "border-stone-200/90 shadow-stone-200/50 bg-white"
                    : "border-slate-800 shadow-black/40 bg-slate-900"
                }`}
              >
                <Image
                  src="/about/process_showcase.jpg"
                  alt="Interior design project workspace with furniture palettes, layout previews, and material options"
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover aspect-[4/3] block transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
