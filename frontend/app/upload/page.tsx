"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function UploadPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const { isLight } = useTheme();

  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [roomLength, setRoomLength] = useState("14");
  const [roomWidth, setRoomWidth] = useState("12");
  const [roomHeight, setRoomHeight] = useState("10");
  const [isEmptyRoom, setIsEmptyRoom] = useState(true);

  const [objects, setObjects] = useState<string[]>([]);
  const [objectCounts, setObjectCounts] = useState<Record<string, number>>({});
  const [totalObjects, setTotalObjects] = useState(0);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const [loading, setLoading] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setObjects([]);
    setObjectCounts({});
    setTotalObjects(0);
    setUploadComplete(false);
    setRoomId(null);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const uploadImage = async () => {
    if (!image) {
      alert("Please select an image.");
      return;
    }
    if (!roomLength || !roomWidth || !roomHeight) {
      alert("Please enter room length, width, and height.");
      return;
    }
    if (Number(roomLength) < 6 || Number(roomWidth) < 6 || Number(roomHeight) < 6) {
      alert("Room dimensions must be at least 6 feet to design properly.");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("room_length", roomLength);
    formData.append("room_width", roomWidth);
    formData.append("room_height", roomHeight);
    formData.append("is_empty_room", String(isEmptyRoom));

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.user_id) formData.append("user_id", String(user.user_id));
      } catch {
        /* ignore */
      }
    }

    try {
      setLoading(true);

      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(res.data.message);

      if (res.data.objects) setObjects(res.data.objects);
      if (res.data.object_counts) setObjectCounts(res.data.object_counts);
      if (res.data.total_objects !== undefined) setTotalObjects(res.data.total_objects);
      if (res.data.room_id) setRoomId(res.data.room_id);

      setUploadComplete(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Upload Failed");
    } finally {
      setLoading(false);
    }
  };

  const canContinue = uploadComplete && roomId !== null;

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

      <Navbar toggleSidebar={() => setIsOpen(!isOpen)} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={isOpen} />

        <main
          className={`transition-all duration-300 p-6 md:p-8 w-full flex-1 overflow-y-auto ${
            isOpen ? "ml-64" : "ml-20"
          }`}
        >
          <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div
            className={`mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${
              isLight ? "border-slate-200" : "border-slate-800/80"
            }`}
          >
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <span>📤</span> Upload Room Image
              </h1>
              <p className={`text-sm mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Upload a photo of your empty room or existing layout and enter room dimensions.
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

          {/* Main Card */}
          <div
            className={`border backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 ${
              isLight
                ? "bg-white/90 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.05)]"
                : "bg-slate-900/50 border-slate-800"
            }`}
          >
            {/* Drag & Drop Upload Zone */}
            <div className="space-y-2">
              <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Upload Room Photo
              </label>

              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 relative ${
                  isDragging
                    ? isLight
                      ? "border-indigo-600 bg-indigo-50/70 scale-[1.01]"
                      : "border-indigo-500 bg-indigo-950/40 scale-[1.01]"
                    : isLight
                    ? "border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50"
                    : "border-slate-700/80 hover:border-indigo-500/50 bg-slate-950/50 hover:bg-slate-900/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform duration-200 ${
                    isDragging ? "scale-110" : ""
                  } ${
                    isLight
                      ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                      : "bg-indigo-950/60 border-indigo-900/60 text-indigo-400"
                  }`}
                >
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>

                <div className="space-y-1">
                  <p className={`text-sm font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                      Click to browse
                    </span>{" "}
                    or drag and drop your room photo here
                  </p>
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Supports high-resolution PNG, JPG, JPEG, WEBP
                  </p>
                </div>

                {image && (
                  <div
                    className={`mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                      isLight
                        ? "bg-white border-slate-200 text-slate-700 shadow-sm"
                        : "bg-slate-900 border-slate-800 text-slate-300"
                    }`}
                  >
                    <span>📷 {image.name}</span>
                    <span className="text-slate-400">({(image.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Room Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 uppercase ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Length (ft)
                </label>
                <input
                  type="number"
                  min="6"
                  step="0.1"
                  value={roomLength}
                  onChange={(e) => setRoomLength(e.target.value)}
                  placeholder="e.g. 14"
                  className={`w-full p-3 rounded-xl border text-sm outline-none transition ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      : "bg-slate-950/80 border-slate-800 text-slate-200 focus:border-indigo-500"
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 uppercase ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Width (ft)
                </label>
                <input
                  type="number"
                  min="6"
                  step="0.1"
                  value={roomWidth}
                  onChange={(e) => setRoomWidth(e.target.value)}
                  placeholder="e.g. 12"
                  className={`w-full p-3 rounded-xl border text-sm outline-none transition ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      : "bg-slate-950/80 border-slate-800 text-slate-200 focus:border-indigo-500"
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 uppercase ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  Height (ft)
                </label>
                <input
                  type="number"
                  min="6"
                  step="0.1"
                  value={roomHeight}
                  onChange={(e) => setRoomHeight(e.target.value)}
                  placeholder="e.g. 10"
                  className={`w-full p-3 rounded-xl border text-sm outline-none transition ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      : "bg-slate-950/80 border-slate-800 text-slate-200 focus:border-indigo-500"
                  }`}
                />
              </div>
            </div>

            {/* Checkbox for empty room */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isEmptyRoom}
                onChange={(e) => setIsEmptyRoom(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded cursor-pointer"
              />
              <span className={`text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                This is an empty room (skip furniture detection)
              </span>
            </label>

            {!isEmptyRoom && (
              <p className="text-xs text-amber-500 font-medium">
                ℹ️ YOLOv8 vision detection will run to identify existing furniture items for add/remove/replace operations.
              </p>
            )}

            {/* Image Preview */}
            {preview && (
              <div className="space-y-2">
                <h3 className={`text-sm font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  Selected Image Preview
                </h3>
                <div className="rounded-xl overflow-hidden border border-inherit shadow-md max-h-96 bg-black flex items-center justify-center">
                  <img src={preview} alt="Selected Room" className="max-h-96 object-contain" />
                </div>
              </div>
            )}

            {/* Detection Results */}
            {uploadComplete && (
              <div
                className={`p-4 rounded-xl border ${
                  isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <h3 className={`text-base font-bold mb-3 ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                  Detection Result
                </h3>

                {isEmptyRoom ? (
                  <p className="text-emerald-500 font-semibold text-sm">
                    ✓ Empty room saved ({roomLength}×{roomWidth}×{roomHeight} ft). Continue to AI Chat to design the room!
                  </p>
                ) : totalObjects > 0 ? (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className={`w-full border text-sm ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                        <thead className={isLight ? "bg-slate-100" : "bg-slate-900"}>
                          <tr>
                            <th className="border p-2.5 text-left font-semibold">Object</th>
                            <th className="border p-2.5 text-center font-semibold">Detected Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(objectCounts).map(([obj, count]) => (
                            <tr key={obj}>
                              <td className="border p-2.5 capitalize">{obj}</td>
                              <td className="border p-2.5 text-center font-bold text-indigo-500">{count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-sm font-bold text-indigo-500">
                      Total Objects Detected: {totalObjects}
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    No existing furniture detected in this room.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={uploadImage}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Processing Room..." : isEmptyRoom ? "Upload Empty Room" : "Upload & Detect"}
              </button>

              {canContinue && (
                <button
                  onClick={() => router.push("/chat")}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-xl transition shadow-md cursor-pointer"
                >
                  Continue with AI Chat →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
);
}
