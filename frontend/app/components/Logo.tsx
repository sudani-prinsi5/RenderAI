"use client";

import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = "" }: LogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-slate-950 border border-slate-700/40 transition-transform duration-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.jpeg"
        alt="RenderAI Logo"
        width={size}
        height={size}
        className="w-full h-full object-cover"
        priority
      />
    </div>
  );
}
