"use client";

import Image from "next/image";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  phone?: string;
  email?: string;
  linkedin?: string;
  bio: string;
  responsibilities: string[];
}

const teamMembers: TeamMember[] = [
  {
    id: "prinsi",
    name: "Prinsi Sudani",
    role: "Frontend Developer & Computer Vision Developer",
    image: "/prinsi_photo.jpeg",
    phone: "8160366674",
    email: "sudaniprinsi5@gmail.com",
    linkedin: "https://www.linkedin.com/in/prinsi-sudani-b54179311",
    bio: "Focuses on building modern, responsive user interfaces and integrating YOLO-based computer vision for automated room object detection.",
    responsibilities: [
      "Frontend development",
      "UI/UX implementation",
      "Computer Vision",
      "YOLO-based object detection",
      "AI room/furniture visualization integration",
    ],
  },
  {
    id: "sneha",
    name: "Sneha",
    role: "Backend Developer",
    image: "/sneha_photo.png",
    phone: "7046612465",
    email: "snehamecwan75@gmail.com",
    linkedin: "https://www.linkedin.com/in/sneha",
    bio: "Focuses on backend server architecture, scalable API endpoints, secure data management, and seamless pipeline communication.",
    responsibilities: [
      "Backend development",
      "API development",
      "Database integration",
      "Server-side functionality",
      "Integration between frontend and AI services",
    ],
  },
  {
    id: "devanshi",
    name: "Devanshi",
    role: "AI / Machine Learning Developer",
    image: "/devanshi_photo.jpg",
    phone: "9727232610",
    email: "devasnhi@gmail.com",
    linkedin: "https://www.linkedin.com/in/devanshi",
    bio: "Focuses on machine learning models, intelligent recommendation engines, and generative spatial interior design transformations.",
    responsibilities: [
      "AI/ML integration",
      "Machine learning functionality",
      "Model integration",
      "AI-based room design features",
      "Supporting intelligent recommendations and automation",
    ],
  },
];

export default function OurTeamSection() {
  const { isLight } = useTheme();
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedMemberId((prev) => (prev === id ? null : id));
  };

  const hasValidLinkedin = (url?: string) => {
    return !!url && url.trim() !== "" && !url.includes("ADD_");
  };

  return (
    <section
      id="our-team"
      className={`scroll-mt-20 border-t py-20 px-6 z-10 transition-colors duration-200 ${
        isLight ? "bg-slate-50/70 border-slate-200" : "bg-slate-950 border-slate-800/60"
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${
              isLight
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
            }`}
          >
            👥 Core Contributors
          </div>

          <h2
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              isLight
                ? "text-slate-900"
                : "bg-gradient-to-r from-indigo-200 via-purple-200 to-slate-100 bg-clip-text text-transparent"
            }`}
          >
            Our Team
          </h2>

          <p className={`text-base sm:text-lg leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Meet the people behind our vision
          </p>
        </div>

        {/* 3 Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {teamMembers.map((member) => {
            const isExpanded = expandedMemberId === member.id;
            const validLinkedin = hasValidLinkedin(member.linkedin);

            return (
              <div
                key={member.id}
                className={`rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                  isLight
                    ? "bg-white border-slate-200/90 shadow-sm hover:border-indigo-300 hover:shadow-md"
                    : "bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40 shadow-lg"
                }`}
              >
                {/* Profile Photo */}
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-950">
                  <Image
                    src={member.image}
                    alt={`${member.name} - ${member.role}`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-top transition-transform duration-500 hover:scale-105"
                  />
                  {validLinkedin && (
                    <div className="absolute top-3 right-3">
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name}'s LinkedIn profile`}
                        className="w-8 h-8 rounded-lg bg-black/60 hover:bg-[#0A66C2] text-white flex items-center justify-center backdrop-blur-sm transition-colors shadow-md"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Main Info */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h3 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                      {member.name}
                    </h3>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider leading-snug">
                      {member.role}
                    </p>
                    <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {member.bio}
                    </p>
                  </div>

                  {/* Know More Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => toggleExpand(member.id)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isExpanded
                          ? isLight
                            ? "bg-slate-100 border-slate-300 text-slate-900"
                            : "bg-slate-800 border-slate-700 text-white"
                          : isLight
                          ? "bg-indigo-50/80 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                          : "bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-800/60 text-indigo-300"
                      }`}
                    >
                      <span>{isExpanded ? "Show Less" : "Know More"}</span>
                      <span className="text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </button>
                  </div>

                  {/* Expandable Details Area */}
                  {isExpanded && (
                    <div
                      className={`pt-5 mt-4 border-t space-y-4 transition-all duration-300 ${
                        isLight ? "border-slate-100" : "border-slate-800"
                      }`}
                    >
                      {/* Responsibilities */}
                      <div className="space-y-2">
                        <p
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isLight ? "text-slate-700" : "text-slate-300"
                          }`}
                        >
                          Key Responsibilities:
                        </p>
                        <ul className="space-y-1.5 text-xs">
                          {member.responsibilities.map((resp, idx) => (
                            <li
                              key={idx}
                              className={`flex items-start gap-2 ${
                                isLight ? "text-slate-600" : "text-slate-400"
                              }`}
                            >
                              <span className="text-indigo-500 font-bold mt-0.5">•</span>
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Contact Links (Only rendered if actual details exist) */}
                      {(member.phone || member.email || validLinkedin) && (
                        <div
                          className={`pt-3 border-t space-y-2 ${
                            isLight ? "border-slate-100" : "border-slate-800"
                          }`}
                        >
                          <p
                            className={`text-[11px] font-bold uppercase tracking-wider ${
                              isLight ? "text-slate-500" : "text-slate-400"
                            }`}
                          >
                            Contact Details:
                          </p>

                          <div className="flex flex-col gap-2">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className={`inline-flex items-center gap-2 text-xs font-medium transition ${
                                  isLight
                                    ? "text-indigo-600 hover:text-indigo-800"
                                    : "text-indigo-400 hover:text-indigo-300"
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                                <span>{member.email}</span>
                              </a>
                            )}

                            {member.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className={`inline-flex items-center gap-2 text-xs font-medium transition ${
                                  isLight
                                    ? "text-indigo-600 hover:text-indigo-800"
                                    : "text-indigo-400 hover:text-indigo-300"
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                                <span>{member.phone}</span>
                              </a>
                            )}

                            {validLinkedin && (
                              <a
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs font-medium text-[#0A66C2] hover:underline"
                              >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                                </svg>
                                <span>LinkedIn Profile</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
