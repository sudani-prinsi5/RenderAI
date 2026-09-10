"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface AboutSectionProps {
  isLoggedIn?: boolean;
}

export default function AboutSection({ isLoggedIn = false }: AboutSectionProps) {
  const { isLight } = useTheme();
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<"side-by-side" | "interactive">("side-by-side");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging && activeTab !== "interactive") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const startDesigningHref = isLoggedIn ? "/upload" : "/register?redirect=/upload";

  return (
    <div id="about" className="scroll-mt-16 w-full">
      {/* =========================================================================
          SECTION 1 — HERO / INTRODUCTION
          ========================================================================= */}
      <section
        className={`py-20 lg:py-28 px-6 lg:px-12 border-t transition-colors duration-200 ${isLight
          ? "bg-[#FAF9F6] text-stone-900 border-stone-200/80"
          : "bg-[#0B0F17] text-slate-100 border-slate-800/80"
          }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">


              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.18] ${isLight ? "text-stone-900" : "text-white"
                  }`}
              >
                Making Interior Design Easier to Visualize
              </h1>

              <div
                className={`space-y-4 text-base sm:text-lg leading-relaxed ${isLight ? "text-stone-600" : "text-slate-300"
                  }`}
              >
                <p>
                  Designing a room is not always easy. Choosing the right furniture, deciding where everything should go, and imagining how the final space will look can take time and effort.
                </p>
                <p className="font-medium text-stone-800 dark:text-slate-200">
                  RenderAI was created to make that process easier.
                </p>
                <p>
                  RenderAI combines interior design with Artificial Intelligence to help users visualize, redesign, and explore their own spaces in a simple and interactive way.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-medium">
                <span
                  className={`px-3 py-1.5 rounded-lg border ${isLight
                    ? "bg-white text-stone-700 border-stone-200"
                    : "bg-slate-900/80 text-slate-300 border-slate-800"
                    }`}
                >
                  ✓ Preserves Room Architecture
                </span>
                <span
                  className={`px-3 py-1.5 rounded-lg border ${isLight
                    ? "bg-white text-stone-700 border-stone-200"
                    : "bg-slate-900/80 text-slate-300 border-slate-800"
                    }`}
                >
                  ✓ Spatial Awareness
                </span>
                <span
                  className={`px-3 py-1.5 rounded-lg border ${isLight
                    ? "bg-white text-stone-700 border-stone-200"
                    : "bg-slate-900/80 text-slate-300 border-slate-800"
                    }`}
                >
                  ✓ Realistic Visualizations
                </span>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="lg:col-span-6 relative">
              <div
                className={`relative rounded-2xl lg:rounded-3xl overflow-hidden border shadow-xl ${isLight
                  ? "border-stone-200/90 shadow-stone-200/50 bg-white"
                  : "border-slate-800 shadow-black/40 bg-slate-900"
                  }`}
              >
                <Image
                  src="/about/hero_livingroom.jpg"
                  alt="Modern Scandinavian living room redesigned with natural daylight and curated furniture"
                  width={1200}
                  height={800}
                  priority
                  className="w-full h-auto object-cover aspect-[4/3] block transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2 — OUR STORY
          ========================================================================= */}
      <section
        className={`py-20 lg:py-28 px-6 lg:px-12 border-t transition-colors duration-200 ${isLight
          ? "bg-white text-stone-900 border-stone-200/80"
          : "bg-slate-950 text-slate-100 border-slate-800/80"
          }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Visual Column */}
            <div className="lg:col-span-6 order-2 lg:order-1 relative">
              <div
                className={`relative rounded-2xl lg:rounded-3xl overflow-hidden border shadow-xl ${isLight
                  ? "border-stone-200/90 shadow-stone-200/50 bg-stone-50"
                  : "border-slate-800 shadow-black/40 bg-slate-900"
                  }`}
              >
                <Image
                  src="/about/story_laptop.png"
                  alt="Designer planning an interior concept with material moodboards and 3D room visualization"
                  width={1200}
                  height={900}
                  className="w-full h-auto object-cover aspect-[4/3] block transition-transform duration-700 hover:scale-[1.02]"
                />
              </div>
            </div>

            {/* Right Story Column */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">


              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.18] ${isLight ? "text-stone-900" : "text-white"
                  }`}
              >
                It Started with a Simple Problem
              </h2>

              <div
                className={`space-y-4 text-base sm:text-lg leading-relaxed ${isLight ? "text-stone-600" : "text-slate-300"
                  }`}
              >
                <p>We started with a simple question:</p>

                {/* Highlighted Quote Callout */}
                <blockquote
                  className={`p-5 rounded-2xl border-l-4 my-4 font-medium italic text-lg sm:text-xl leading-snug transition-colors ${isLight
                    ? "bg-stone-50 border-amber-600 text-stone-800"
                    : "bg-slate-900/80 border-amber-500 text-slate-100"
                    }`}
                >
                  &ldquo;Can technology make it easier to visualize the room we already have?&rdquo;
                </blockquote>

                <p>
                  Traditional interior design can be expensive, time-consuming, and difficult to visualize before making real changes. At the same time, many AI image generators create completely new rooms instead of working with the user&apos;s existing space.
                </p>

                <p className="font-semibold text-stone-900 dark:text-white">
                  That is where RenderAI comes in.
                </p>

                <p>
                  Our project explores how Artificial Intelligence can help users understand their existing room, experiment with furniture and design ideas, and visualize changes before making them in the real world.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — WHY WE BUILT RENDERAI (BEFORE / AFTER)
          ========================================================================= */}
      <section
        className={`py-20 lg:py-28 px-6 lg:px-12 border-t transition-colors duration-200 ${isLight
          ? "bg-[#FAF9F6] text-stone-900 border-stone-200/80"
          : "bg-[#0B0F17] text-slate-100 border-slate-800/80"
          }`}
      >
        <div className="max-w-7xl mx-auto space-y-14">
          {/* Section Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <h2
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.18] ${isLight ? "text-stone-900" : "text-white"
                  }`}
              >
                Every Room Has Possibilities
              </h2>
            </div>

            <div
              className={`lg:col-span-6 space-y-4 text-base sm:text-lg leading-relaxed ${isLight ? "text-stone-600" : "text-slate-300"
                }`}
            >
              <p>
                We believe people should be able to explore interior design ideas without needing to be an interior design expert.
              </p>
              <p>
                You may already have an idea of what you want your room to look like, but turning that idea into something visual is not always easy.
              </p>
              <p className="font-semibold text-stone-900 dark:text-white">
                RenderAI provides a starting point.
              </p>
              <p>
                It helps users experiment with furniture, styles, layouts, and room changes while keeping their existing space at the center of the experience.
              </p>
            </div>
          </div>

          {/* View Toggle Bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-inherit">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-stone-500" : "text-slate-400"}`}>
                Visual Transformation:
              </span>
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Preserving Room Footprint &amp; Dimensions
              </span>
            </div>

            <div className="inline-flex p-1 rounded-xl border bg-stone-100/70 dark:bg-slate-900 border-stone-200 dark:border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab("side-by-side")}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === "side-by-side"
                  ? isLight
                    ? "bg-white text-stone-900 shadow-sm font-semibold"
                    : "bg-slate-800 text-white shadow-sm font-semibold"
                  : isLight
                    ? "text-stone-600 hover:text-stone-900"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                Side by Side
              </button>
              <button
                onClick={() => setActiveTab("interactive")}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === "interactive"
                  ? isLight
                    ? "bg-white text-stone-900 shadow-sm font-semibold"
                    : "bg-slate-800 text-white shadow-sm font-semibold"
                  : isLight
                    ? "text-stone-600 hover:text-stone-900"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                Interactive Slider
              </button>
            </div>
          </div>

          {/* BEFORE / AFTER VISUAL COMPARISON CONTAINER */}
          {activeTab === "side-by-side" ? (
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              {/* LEFT: Before Card */}
              <div
                className={`relative rounded-2xl lg:rounded-3xl overflow-hidden border shadow-lg flex flex-col justify-between ${isLight
                  ? "border-stone-200/90 shadow-stone-200/50 bg-stone-50"
                  : "border-slate-800 shadow-black/40 bg-slate-900"
                  }`}
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <Image
                    src="/about/empty_roomm.jpg"
                    alt="Before: An empty room with original walls and windows before redesign"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {/* Before Badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${isLight
                        ? "bg-stone-900/80 text-white border-white/20"
                        : "bg-black/70 text-slate-100 border-white/10"
                        }`}
                    >
                      Before
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className={`text-base font-bold mb-1 ${isLight ? "text-stone-900" : "text-white"}`}>
                    Original Room Space
                  </h4>
                  <p className={`text-xs leading-relaxed ${isLight ? "text-stone-600" : "text-slate-400"}`}>
                    Clean structural foundation with existing window orientation, walls, and flooring layout.
                  </p>
                </div>
              </div>

              {/* Central Arrow/Transition Badge for Desktop */}
              <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none items-center justify-center">
                <div
                  className={`w-14 h-14 rounded-full border shadow-2xl flex items-center justify-center transition-transform duration-300 hover:scale-110 ${isLight
                    ? "bg-white border-stone-300 text-stone-900 shadow-stone-400/30"
                    : "bg-slate-900 border-slate-700 text-amber-400 shadow-black/80"
                    }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>

              {/* RIGHT: After Card */}
              <div
                className={`relative rounded-2xl lg:rounded-3xl overflow-hidden border shadow-lg flex flex-col justify-between ${isLight
                  ? "border-stone-200/90 shadow-stone-200/50 bg-stone-50"
                  : "border-slate-800 shadow-black/40 bg-slate-900"
                  }`}
              >
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <Image
                    src="/about/furniture_image.jpg"
                    alt="After: The same room redesigned with realistic furniture, lighting, and interior styling"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {/* After Badge */}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${isLight
                        ? "bg-amber-700/90 text-white border-amber-500/30"
                        : "bg-amber-600/90 text-white border-amber-400/30"
                        }`}
                    >
                      After — Redesigned
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className={`text-base font-bold mb-1 ${isLight ? "text-stone-900" : "text-white"}`}>
                    RenderAI Redesigned Living Concept
                  </h4>
                  <p className={`text-xs leading-relaxed ${isLight ? "text-stone-600" : "text-slate-400"}`}>
                    Curated bedroom styling with accurate scale, furniture clearance, harmonious palette, and realistic lighting.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Split Comparison Slider */
            <div
              className={`relative rounded-2xl lg:rounded-3xl overflow-hidden border shadow-2xl select-none cursor-ew-resize aspect-[16/9] max-h-[560px] w-full ${isLight ? "border-stone-200 bg-stone-100" : "border-slate-800 bg-slate-900"
                }`}
              onMouseMove={handleMouseMove}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchMove={handleTouchMove}
            >
              {/* "After" Image (Background) */}
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src="/about/furniture_image.jpg"
                  alt="Redesigned Room"
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-600/90 text-white backdrop-blur-md shadow-md">
                    After
                  </span>
                </div>
              </div>

              {/* "Before" Image (Foreground with Clip Path) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
              >
                <Image
                  src="/about/empty_roomm.jpg"
                  alt="Original Room"
                  fill
                  sizes="100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-900/80 text-white backdrop-blur-md shadow-md">
                    Before
                  </span>
                </div>
              </div>

              {/* Draggable Divider Line */}
              <div
                className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
              >
                <div className="w-1 bg-white h-full shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                <div className="absolute w-10 h-10 rounded-full bg-white text-stone-900 border border-stone-300 shadow-2xl flex items-center justify-center font-bold text-xs">
                  ⇄
                </div>
              </div>

              {/* User Instruction Bar */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-medium pointer-events-none">
                Drag slider or hover to compare
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
