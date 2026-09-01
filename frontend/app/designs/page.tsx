"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const API_BASE = "http://127.0.0.1:5000";

interface FurnitureItem {
  id: string;
  label: string;
  size: string;
  color: string;
  description: string;
  length_ft: number;
  width_ft: number;
  position: string;
}

interface Design {
  room_id: number;
  original_image: string;
  generated_image: string | null;
  is_empty_room: boolean;
  room_length: number;
  room_width: number;
  room_height: number;
  status: string;
  furniture_count: number;
  furniture_items: FurnitureItem[];
  created_at: string | null;
}

export default function DesignsPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Design | null>(null);
  const { isLight } = useTheme();

  useEffect(() => {
    const loadDesigns = async () => {
      try {
        let userId: number | undefined;
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            userId = JSON.parse(userStr).user_id;
          } catch {
            /* ignore */
          }
        }

        const params = userId ? { user_id: userId } : {};
        const res = await api.get("/my-designs", { params });
        if (res.data.success) {
          setDesigns(res.data.designs);
        }
      } catch {
        setDesigns([]);
      } finally {
        setLoading(false);
      }
    };

    loadDesigns();
  }, []);

  const openDesign = async (roomId: number) => {
    try {
      const res = await api.get(`/designs/${roomId}`);
      if (res.data.success) {
        setSelected(res.data);
      }
    } catch {
      alert("Could not load design details.");
    }
  };

  const downloadImage = (path: string, name: string) => {
    const link = document.createElement("a");
    link.href = API_BASE + path;
    link.download = name;
    link.target = "_blank";
    link.click();
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-hidden transition-colors duration-200 ${
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

      <Navbar toggleSidebar={() => setIsOpen(!isOpen)} />

      <div className="flex flex-1">
        <Sidebar isOpen={isOpen} />

        <div
          className={`transition-all duration-300 p-6 md:p-8 w-full max-w-7xl mx-auto ${
            isOpen ? "ml-64" : "ml-20"
          }`}
        >
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b pb-6 ${
              isLight ? "border-slate-200" : "border-slate-800/80"
            }`}
          >
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <span>🖼️</span> My Designs
              </h1>
              <p className={`text-sm mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                All saved room transformations, dimensions, and generated furniture layouts.
              </p>
            </div>
            <button
              onClick={() => router.push("/upload")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer text-sm"
            >
              + New Room
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : designs.length === 0 ? (
            <div
              className={`border backdrop-blur-xl rounded-2xl p-12 text-center shadow-xl max-w-xl mx-auto space-y-4 ${
                isLight ? "bg-white/90 border-slate-200" : "bg-slate-900/50 border-slate-800"
              }`}
            >
              <div className="text-5xl">🛋️</div>
              <p className={`text-lg font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                No designs created yet
              </p>
              <p className={`text-xs max-w-sm mx-auto ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Upload a room photo or start a new chat session to generate AI interior layouts.
              </p>
              <button
                onClick={() => router.push("/upload")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition cursor-pointer text-sm"
              >
                Upload Your First Room ➔
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {designs.map((design) => (
                <div
                  key={design.room_id}
                  className={`border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                    isLight
                      ? "bg-white border-slate-200 hover:border-indigo-400"
                      : "bg-slate-900/60 border-slate-800 hover:border-indigo-500/50"
                  }`}
                  onClick={() => openDesign(design.room_id)}
                >
                  <div className="aspect-video bg-black/10 relative overflow-hidden">
                    <img
                      src={
                        API_BASE +
                        (design.generated_image || design.original_image)
                      }
                      alt={`Room ${design.room_id}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {design.furniture_count > 0 && (
                      <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                        {design.furniture_count} items
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-center">
                        <h3 className={`font-bold text-base ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                          Room #{design.room_id}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            design.generated_image
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          }`}
                        >
                          {design.generated_image ? "Designed" : design.status}
                        </span>
                      </div>

                      <p className={`text-xs mt-1 font-mono ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {design.room_length}×{design.room_width}×{design.room_height} ft
                        {design.is_empty_room ? " · Empty room" : ""}
                      </p>

                      {design.furniture_items.length > 0 && (
                        <p className={`text-xs mt-2 line-clamp-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                          {design.furniture_items
                            .map((f) => `${f.label} (${f.size})`)
                            .join(", ")}
                        </p>
                      )}
                    </div>

                    {design.created_at && (
                      <p className={`text-[11px] pt-2 border-t ${isLight ? "border-slate-100 text-slate-400" : "border-slate-800/80 text-slate-500"}`}>
                        {new Date(design.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Design Details Modal */}
          {selected && (
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
              onClick={() => setSelected(null)}
            >
              <div
                className={`border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl space-y-6 cursor-default ${
                  isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`flex justify-between items-center border-b pb-4 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                  <h2 className={`text-2xl font-extrabold ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                    Room #{selected.room_id} Layout
                  </h2>
                  <button
                    onClick={() => setSelected(null)}
                    className={`text-2xl cursor-pointer ${isLight ? "text-slate-400 hover:text-slate-800" : "text-slate-400 hover:text-slate-100"}`}
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-xs font-bold uppercase mb-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Original Photo
                    </p>
                    <div className="rounded-xl overflow-hidden border border-inherit shadow-md aspect-video bg-black/5 flex items-center justify-center">
                      <img
                        src={API_BASE + selected.original_image}
                        alt="Original"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {selected.generated_image && (
                    <div>
                      <p className={`text-xs font-bold uppercase mb-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Generated AI Design
                      </p>
                      <div className="rounded-xl overflow-hidden border-2 border-indigo-500 shadow-md aspect-video bg-black/5 flex items-center justify-center">
                        <img
                          src={API_BASE + selected.generated_image}
                          alt="Generated"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                  Dimensions: <strong>{selected.room_length}×{selected.room_width}×{selected.room_height} ft</strong>
                </p>

                {selected.furniture_items.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className={`font-bold text-sm uppercase tracking-wider ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                      Placed Furniture ({selected.furniture_items.length} items)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selected.furniture_items.map((item) => (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-3.5 space-y-1 ${
                            isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/70 border-slate-800"
                          }`}
                        >
                          <p className={`font-bold text-sm ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                            {item.label} — <span className="font-normal text-xs">{item.size}</span>
                          </p>
                          <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                            Color: <span className="capitalize">{item.color}</span> · Position: <span className="capitalize">{item.position}</span>
                          </p>
                          <p className={`text-xs font-mono ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                            Size: {item.width_ft}×{item.length_ft} ft
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    No custom furniture catalog items placed yet.
                  </p>
                )}

                <div className="flex gap-3 pt-2 flex-wrap">
                  {selected.generated_image && (
                    <button
                      onClick={() =>
                        downloadImage(
                          selected.generated_image!,
                          `design_room_${selected.room_id}.png`
                        )
                      }
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow cursor-pointer"
                    >
                      Download Design
                    </button>
                  )}
                  <button
                    onClick={() => router.push("/chat")}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow cursor-pointer"
                  >
                    Continue in AI Chat ➔
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className={`font-semibold px-5 py-2.5 rounded-xl text-sm transition cursor-pointer border ${
                      isLight
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
