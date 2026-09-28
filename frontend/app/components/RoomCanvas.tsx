"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  FiTrash2,
  FiMaximize2,
  FiDownload,
  FiRotateCcw,
  FiMove,
  FiCheck,
  FiGrid,
  FiLayers,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import { DatasetFurnitureItem } from "../services/datasetCatalog";

export interface PlacedItem {
  id: string;
  datasetId?: string;
  name: string;
  label: string;
  category: string;
  price: number;
  image_url: string;
  pos_x: number; // 0 - 100%
  pos_y: number; // 0 - 100%
  scale: number; // 0.6 - 2.0
  rotation?: number; // degrees
  dimensions?: {
    length_ft: number;
    width_ft: number;
    height_ft?: number;
  };
}

interface RoomCanvasProps {
  roomImage: string | null;
  placedItems: PlacedItem[];
  onDropItem: (item: DatasetFurnitureItem, posX: number, posY: number) => void;
  onUpdateItemPosition: (id: string, posX: number, posY: number) => void;
  onUpdateItemScale: (id: string, scale: number) => void;
  onUpdateItemRotation?: (id: string, rotation: number) => void;
  onRemoveItem: (id: string) => void;
  onClearAll?: () => void;
  isLight?: boolean;
  onZoomPreview?: (url: string) => void;
  selectedItemId?: string | null;
  onSelectItem?: (id: string | null) => void;
}

export default function RoomCanvas({
  roomImage,
  placedItems,
  onDropItem,
  onUpdateItemPosition,
  onUpdateItemScale,
  onUpdateItemRotation,
  onRemoveItem,
  onClearAll,
  isLight = true,
  onZoomPreview,
  selectedItemId: controlledSelectedItemId,
  onSelectItem,
}: RoomCanvasProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalSelectedItemId, setInternalSelectedItemId] = useState<string | null>(null);

  const selectedItemId = controlledSelectedItemId !== undefined ? controlledSelectedItemId : internalSelectedItemId;
  const setSelectedItemId = (id: string | null) => {
    if (onSelectItem) {
      onSelectItem(id);
    }
    setInternalSelectedItemId(id);
  };

  // Moving existing placed item on canvas
  const [draggingPlacedId, setDraggingPlacedId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle external furniture drag over dropzone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    let itemData: DatasetFurnitureItem | null = null;
    try {
      const raw = e.dataTransfer.getData("application/json");
      if (raw) {
        itemData = JSON.parse(raw);
      }
    } catch (err) {
      console.error("Failed to parse dropped furniture item:", err);
    }

    if (!itemData || !canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const dropX = Math.max(10, Math.min(90, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const dropY = Math.max(15, Math.min(88, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

    onDropItem(itemData, dropX, dropY);
    setSelectedItemId(itemData.id);
  };

  // Mouse drag logic for repositioning placed items on canvas
  const handleMouseDownItem = (e: React.MouseEvent, item: PlacedItem) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItemId(item.id);
    setDraggingPlacedId(item.id);

    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const currentPxX = (item.pos_x / 100) * rect.width;
      const currentPxY = (item.pos_y / 100) * rect.height;
      setDragOffset({
        x: e.clientX - rect.left - currentPxX,
        y: e.clientY - rect.top - currentPxY,
      });
    }
  };


  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!draggingPlacedId || !canvasContainerRef.current) return;

    const rect = canvasContainerRef.current.getBoundingClientRect();
    const newPxX = e.clientX - rect.left - dragOffset.x;
    const newPxY = e.clientY - rect.top - dragOffset.y;

    const newPercentX = Math.max(5, Math.min(95, Math.round((newPxX / rect.width) * 100)));
    const newPercentY = Math.max(10, Math.min(92, Math.round((newPxY / rect.height) * 100)));

    onUpdateItemPosition(draggingPlacedId, newPercentX, newPercentY);
  };

  const handleMouseUpCanvas = () => {
    if (draggingPlacedId) {
      setDraggingPlacedId(null);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setDraggingPlacedId(null);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const totalCost = placedItems.reduce((acc, it) => acc + (it.price || 0), 0);
  const selectedItem = placedItems.find((it) => it.id === selectedItemId);

  // Download snapshot
  const handleDownloadSnapshot = () => {
    if (!roomImage) return;
    const link = document.createElement("a");
    link.href = roomImage;
    link.download = "interior_design_workspace.png";
    link.click();
  };

  return (
    <div
      className={`rounded-2xl border flex flex-col overflow-hidden transition-all duration-300 shadow-xl ${
        isLight
          ? "bg-white/95 border-stone-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          : "bg-slate-900/95 border-slate-800/90 shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
      }`}
    >
      {/* Canvas Top Bar */}
      <div
        className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          isLight ? "border-stone-200/80 bg-stone-50/50" : "border-slate-800/80 bg-slate-950/40"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <FiLayers className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`font-bold text-sm leading-tight ${isLight ? "text-stone-800" : "text-stone-100"}`}>
              Room Design Workspace
            </h2>
            <p className={`text-[11px] ${isLight ? "text-stone-500" : "text-stone-400"}`}>
              {placedItems.length === 0
                ? "Original room photo · Drag & drop furniture from the designer"
                : `${placedItems.length} custom piece${placedItems.length > 1 ? "s" : ""} placed · Total: ₹${totalCost.toLocaleString("en-IN")}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {placedItems.length > 0 && onClearAll && (
            <button
              suppressHydrationWarning
              onClick={onClearAll}
              title="Clear placed furniture from canvas"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                isLight
                  ? "bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border-stone-200 hover:border-rose-200"
                  : "bg-slate-800 hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border-slate-700 hover:border-rose-700/50"
              }`}
            >
              <FiRotateCcw className="text-xs" /> Reset
            </button>
          )}

          {roomImage && (
            <>
              <button
                suppressHydrationWarning
                onClick={handleDownloadSnapshot}
                title="Download design image"
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                  isLight
                    ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                    : "bg-slate-800 hover:bg-slate-700 text-stone-200 border-slate-700"
                }`}
              >
                <FiDownload className="text-xs" /> Download
              </button>

              {onZoomPreview && (
                <button
                  suppressHydrationWarning
                  onClick={() => onZoomPreview(roomImage)}
                  title="Fullscreen zoom"
                  className={`p-1.5 rounded-lg border text-xs font-medium transition flex items-center justify-center cursor-pointer ${
                    isLight
                      ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200"
                      : "bg-slate-800 hover:bg-slate-700 text-stone-200 border-slate-700"
                  }`}
                >
                  <FiMaximize2 className="text-xs" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Visual Canvas Area */}
      <div
        ref={canvasContainerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onClick={() => setSelectedItemId(null)}
        className={`relative w-full aspect-[16/10] sm:aspect-[16/9] md:aspect-[16/9.5] overflow-hidden select-none transition-colors ${
          isLight ? "bg-stone-100" : "bg-slate-950"
        } ${isDragOver ? "ring-4 ring-indigo-500/40" : ""}`}
      >
        {/* Base Background Image: Uploaded Room Photo */}
        {roomImage ? (
          <img
            src={roomImage}
            alt="Uploaded Room Workspace"
            referrerPolicy="no-referrer"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className="w-full h-full object-cover pointer-events-none select-none transition-opacity duration-300"
            style={{ userSelect: "none" }}
          />

        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <FiGrid className="text-4xl mb-2 opacity-40" />
            <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">Room Canvas Ready</p>
            <p className="text-xs mt-1 max-w-sm">
              Upload your room photo to start placing furniture from the dataset directly into your room space.
            </p>
          </div>
        )}

        {/* Drag-Over Drop Target Guide Indicator */}
        {isDragOver && (
          <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur-xs border-2 border-dashed border-indigo-500 flex flex-col items-center justify-center pointer-events-none z-30 animate-in fade-in duration-150">
            <div className="bg-slate-950/90 text-white px-5 py-2.5 rounded-xl shadow-2xl border border-indigo-400 flex items-center gap-2 text-sm font-bold">
              <FiPlus className="text-indigo-400 text-lg" />
              <span>Drop Furniture Item Here</span>
            </div>
          </div>
        )}

        {/* Placed Furniture Items Layers */}
        {placedItems.map((item) => {
          const isSelected = selectedItemId === item.id;
          const isBeingDragged = draggingPlacedId === item.id;
          const scale = item.scale || 1.0;
          const rotation = item.rotation || 0;

          return (
            <div
              key={item.id}
              style={{
                left: `${item.pos_x}%`,
                top: `${item.pos_y}%`,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
                userSelect: "none",
              }}
              onMouseDown={(e) => handleMouseDownItem(e, item)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItemId(item.id);
              }}
              className={`absolute cursor-move transition-transform duration-75 z-20 group ${
                isBeingDragged ? "opacity-90 z-30" : ""
              }`}
            >
              {/* Furniture Object Container */}
              <div
                className={`relative transition-all duration-200 rounded-xl ${
                  isSelected
                    ? "ring-2 ring-indigo-500 ring-offset-2 shadow-2xl scale-105"
                    : "hover:ring-1 hover:ring-indigo-400/50"
                }`}
              >
                <img
                  src={item.image_url}
                  alt={item.label}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400";
                  }}
                  className="w-28 sm:w-36 md:w-44 h-auto object-contain drop-shadow-2xl pointer-events-none select-none"
                  style={{ userSelect: "none" }}
                />



                {/* Price and Category Tag */}
                <div className="absolute bottom-1.5 left-1.5 bg-slate-950/85 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-bold font-mono shadow">
                  ₹{item.price.toLocaleString("en-IN")}
                </div>

                {/* Remove button on hover / selected */}
                <button
                  suppressHydrationWarning
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  title="Remove this item"
                  className={`absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-md shadow-md transition cursor-pointer ${
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <FiTrash2 className="text-[11px]" />
                </button>
              </div>

              {/* Position Marker Pin */}
              <div className="flex items-center justify-center mt-1">
                <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md truncate max-w-36">
                  {item.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Item Control Strip (Adjust scale / reposition / delete) */}
      {selectedItem && (
        <div
          className={`px-5 py-2.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isLight ? "border-stone-200 bg-stone-50 text-stone-800" : "border-slate-800 bg-slate-950/80 text-stone-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Selected Piece:</span>
            <span className="font-semibold truncate max-w-xs">{selectedItem.label}</span>
            <span className="font-mono text-emerald-600 font-bold">
              ₹{selectedItem.price.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Scale Adjuster */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-medium ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                Size:
              </span>
              <button
                suppressHydrationWarning
                onClick={() => onUpdateItemScale(selectedItem.id, Math.max(0.6, (selectedItem.scale || 1.0) - 0.1))}
                className={`p-1 rounded border transition ${
                  isLight ? "bg-white hover:bg-stone-100 border-stone-300" : "bg-slate-800 hover:bg-slate-700 border-slate-700"
                }`}
                title="Decrease size"
              >
                <FiMinus className="text-[10px]" />
              </button>
              <span className="font-mono text-[11px] font-semibold w-8 text-center">
                {Math.round((selectedItem.scale || 1.0) * 100)}%
              </span>
              <button
                suppressHydrationWarning
                onClick={() => onUpdateItemScale(selectedItem.id, Math.min(1.8, (selectedItem.scale || 1.0) + 0.1))}
                className={`p-1 rounded border transition ${
                  isLight ? "bg-white hover:bg-stone-100 border-stone-300" : "bg-slate-800 hover:bg-slate-700 border-slate-700"
                }`}
                title="Increase size"
              >
                <FiPlus className="text-[10px]" />
              </button>
            </div>

            {/* Rotation Control */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-medium ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                Rotation:
              </span>
              <input
                suppressHydrationWarning
                type="range"
                min="0"
                max="360"
                step="1"
                value={selectedItem.rotation ?? 0}
                onChange={(e) => onUpdateItemRotation?.(selectedItem.id, Number(e.target.value))}
                className={`w-20 sm:w-24 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${
                  isLight ? "bg-stone-200" : "bg-slate-700"
                }`}
                title={`Rotation: ${selectedItem.rotation ?? 0}°`}
                aria-label="Rotation"
              />
              <span className="font-mono text-[11px] font-semibold w-8 text-center">
                {selectedItem.rotation ?? 0}°
              </span>
            </div>

            {/* Remove */}
            <button
              suppressHydrationWarning
              onClick={() => onRemoveItem(selectedItem.id)}
              className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <FiTrash2 className="text-xs" /> Remove Piece
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
