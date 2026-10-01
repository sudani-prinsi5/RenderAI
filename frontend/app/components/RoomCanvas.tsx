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
  FiInfo,
  FiPlus,
  FiMinus,
  FiEdit3,
  FiSquare,
} from "react-icons/fi";
import { DatasetFurnitureItem, calculateRealisticFurnitureWidthPct } from "../services/datasetCatalog";

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
  scale: number; // 0.2 - 1.8 (Minimum 20%)
  rotation?: number; // degrees
  dimensions?: {
    length_ft: number;
    width_ft: number;
    height_ft?: number;
  };
  material?: string;
  description?: string;
}

interface RoomCanvasProps {
  roomImage: string | null;
  placedItems: PlacedItem[];
  roomLength?: number;
  roomWidth?: number;
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
  onCompositeChange?: (dataUrl: string) => void;
  detectedObjects?: any[];
  onRemoveDetectedObject?: (objectSpec: any) => void;
  removingObjectId?: string | null;
}

export default function RoomCanvas({
  roomImage,
  placedItems,
  roomLength = 14,
  roomWidth = 12,
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
  onCompositeChange,
  detectedObjects = [],
  onRemoveDetectedObject,
  removingObjectId,
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

  const [selectedDetectedId, setSelectedDetectedId] = useState<string | null>(null);
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null);

  // Manual Selection & Brush Tools State
  const [removalMode, setRemovalMode] = useState<"detect" | "manual">("detect");
  const [brushTool, setBrushTool] = useState<"brush" | "box">("brush");
  const [brushSize, setBrushSize] = useState<number>(32);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasManualSelection, setHasManualSelection] = useState<boolean>(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [boxCurrent, setBoxCurrent] = useState<{ x: number; y: number } | null>(null);

  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (selectedDetectedId && !detectedObjects.some((o) => o.id === selectedDetectedId)) {
      setSelectedDetectedId(null);
    }
  }, [detectedObjects, selectedDetectedId]);

  // Clear manual mask
  const clearManualMask = () => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    }
    setHasManualSelection(false);
    setBoxStart(null);
    setBoxCurrent(null);
    lastPointRef.current = null;
  };

  // Auto-clear manual mask when room image changes or after removal completes
  useEffect(() => {
    clearManualMask();
  }, [roomImage]);

  // Sync mask canvas resolution to container size
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasContainerRef.current && maskCanvasRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const prevCanvas = document.createElement("canvas");
          prevCanvas.width = maskCanvasRef.current.width;
          prevCanvas.height = maskCanvasRef.current.height;
          const pctx = prevCanvas.getContext("2d");
          if (pctx && hasManualSelection && prevCanvas.width > 0) {
            pctx.drawImage(maskCanvasRef.current, 0, 0);
          }

          maskCanvasRef.current.width = Math.round(rect.width);
          maskCanvasRef.current.height = Math.round(rect.height);

          const ctx = maskCanvasRef.current.getContext("2d");
          if (ctx && hasManualSelection && prevCanvas.width > 0) {
            ctx.drawImage(prevCanvas, 0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
          }
        }
      }
    };
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [hasManualSelection]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasContainerRef.current || !maskCanvasRef.current) return null;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = maskCanvasRef.current.width / rect.width;
    const scaleY = maskCanvasRef.current.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    return { x, y, screenX, screenY };
  };

  const handleStartDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (removalMode !== "manual") return;
    const coords = getCanvasCoords(e);
    if (!coords || !maskCanvasRef.current) return;

    setIsDrawing(true);
    setSelectionWarning(null);

    if (brushTool === "brush") {
      const ctx = maskCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "rgba(244, 63, 94, 0.75)";
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
        lastPointRef.current = { x: coords.x, y: coords.y };
        setHasManualSelection(true);
      }
    } else if (brushTool === "box") {
      setBoxStart({ x: coords.x, y: coords.y });
      setBoxCurrent({ x: coords.x, y: coords.y });
    }
  };

  const handleMoveDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (removalMode !== "manual") return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    setCursorPos({ x: coords.screenX, y: coords.screenY });

    if (!isDrawing || !maskCanvasRef.current) return;

    if (brushTool === "brush") {
      const ctx = maskCanvasRef.current.getContext("2d");
      if (ctx && lastPointRef.current) {
        ctx.strokeStyle = "rgba(244, 63, 94, 0.75)";
        ctx.fillStyle = "rgba(244, 63, 94, 0.75)";
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();

        lastPointRef.current = { x: coords.x, y: coords.y };
        setHasManualSelection(true);
      }
    } else if (brushTool === "box" && boxStart) {
      setBoxCurrent({ x: coords.x, y: coords.y });
    }
  };

  const handleEndDraw = () => {
    if (removalMode !== "manual" || !isDrawing) return;

    if (brushTool === "box" && boxStart && boxCurrent && maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext("2d");
      if (ctx) {
        const x = Math.min(boxStart.x, boxCurrent.x);
        const y = Math.min(boxStart.y, boxCurrent.y);
        const w = Math.abs(boxCurrent.x - boxStart.x);
        const h = Math.abs(boxCurrent.y - boxStart.y);

        if (w > 3 && h > 3) {
          ctx.fillStyle = "rgba(244, 63, 94, 0.75)";
          ctx.fillRect(x, y, w, h);
          setHasManualSelection(true);
        }
      }
      setBoxStart(null);
      setBoxCurrent(null);
    }

    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const handleExecuteRemoval = (targetObj?: any) => {
    // 1. Manual Priority: If user has drawn manual mask strokes or selected an area
    if (hasManualSelection && maskCanvasRef.current) {
      const maskDataUrl = maskCanvasRef.current.toDataURL("image/png");
      setSelectionWarning(null);
      onRemoveDetectedObject?.({
        id: `manual_${Date.now()}`,
        label: "Selected Area",
        selection_mode: "manual",
        mask_base64: maskDataUrl,
        mask_width: maskCanvasRef.current.width,
        mask_height: maskCanvasRef.current.height,
      });
      return;
    }

    // 2. If user is in manual mode but has not drawn anything
    if (removalMode === "manual" && !hasManualSelection) {
      setSelectionWarning("Please brush over an object or select an area to remove.");
      setTimeout(() => setSelectionWarning(null), 3500);
      return;
    }

    // 3. YOLO Object Selection: Clicked detected object
    const objToRemove =
      targetObj || (selectedDetectedId ? detectedObjects.find((o) => o.id === selectedDetectedId) : null);
    if (!objToRemove) {
      setSelectionWarning("Please select an object or brush an area to remove.");
      setTimeout(() => setSelectionWarning(null), 3500);
      return;
    }
    setSelectionWarning(null);
    onRemoveDetectedObject?.(objToRemove);
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
    if (removalMode === "manual") return;
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
    if (!draggingPlacedId || !canvasContainerRef.current || removalMode === "manual") return;

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

  // Active item for details section below room image
  const selectedItem =
    placedItems.find((it) => it.id === selectedItemId) ||
    (placedItems.length > 0 ? placedItems[placedItems.length - 1] : null);

  // Helper to load image as safe HTMLImageElement for canvas rendering
  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        const fallback = new Image();
        fallback.onload = () => resolve(fallback);
        fallback.onerror = (err) => reject(err);
        fallback.src = src;
      };
      img.src = src;
    });
  };

  // Helper to generate the final composite data URL with all latest placed furniture
  const generateCompositeDataUrl = async (): Promise<string | null> => {
    if (!roomImage) return null;
    if (placedItems.length === 0) return roomImage;

    try {
      const bgImg = await loadImageElement(roomImage);
      const container = canvasContainerRef.current;
      const rect = container?.getBoundingClientRect();
      const containerWidth = rect?.width || 1200;
      const containerHeight = rect?.height || 750;

      const targetWidth = Math.max(1600, bgImg.naturalWidth || 1600);
      const targetHeight = Math.round(targetWidth * (containerHeight / containerWidth)) || bgImg.naturalHeight || 1000;

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return roomImage;

      const imgRatio = (bgImg.naturalWidth || targetWidth) / (bgImg.naturalHeight || targetHeight);
      const canvasRatio = targetWidth / targetHeight;
      let sWidth = bgImg.naturalWidth || targetWidth;
      let sHeight = bgImg.naturalHeight || targetHeight;
      let sx = 0;
      let sy = 0;

      if (imgRatio > canvasRatio) {
        sHeight = bgImg.naturalHeight || targetHeight;
        sWidth = sHeight * canvasRatio;
        sx = ((bgImg.naturalWidth || targetWidth) - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = bgImg.naturalWidth || targetWidth;
        sHeight = sWidth / canvasRatio;
        sx = 0;
        sy = ((bgImg.naturalHeight || targetHeight) - sHeight) / 2;
      }

      ctx.drawImage(bgImg, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      for (const item of placedItems) {
        try {
          const itemImgUrl = item.image_url;
          if (!itemImgUrl) continue;

          const fImg = await loadImageElement(itemImgUrl);

          const posX = (item.pos_x / 100) * targetWidth;
          const posY = (item.pos_y / 100) * targetHeight;

          const baseWidthPct = calculateRealisticFurnitureWidthPct(item, roomWidth || 14);
          const currentScale = item.scale ?? 1.0;
          const computedWidthPct = Math.max(3, Math.min(85, baseWidthPct * currentScale));
          const itemWidth = (computedWidthPct / 100) * targetWidth;
          const itemHeight = itemWidth * ((fImg.naturalHeight || 1) / (fImg.naturalWidth || 1));
          const rotation = item.rotation || 0;

          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
          ctx.shadowBlur = Math.round(18 * (targetWidth / 1200));
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = Math.round(10 * (targetWidth / 1200));

          ctx.translate(posX, posY);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.drawImage(fImg, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight);

          ctx.restore();
        } catch (itemErr) {
          console.warn("Could not draw furniture item for composite:", item.label, itemErr);
        }
      }

      return canvas.toDataURL("image/png");
    } catch (err) {
      console.error("Error creating composite room design image:", err);
      return roomImage;
    }
  };

  const handleDownloadSnapshot = async () => {
    if (!roomImage) return;
    const dataUrl = await generateCompositeDataUrl();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `room_design_${Date.now()}.png`;
    link.click();
  };

  const handleZoomClick = async () => {
    if (!roomImage || !onZoomPreview) return;
    const dataUrl = await generateCompositeDataUrl();
    onZoomPreview(dataUrl || roomImage);
  };

  useEffect(() => {
    if (!roomImage || !onCompositeChange) return;
    const timer = setTimeout(async () => {
      try {
        const dataUrl = await generateCompositeDataUrl();
        if (dataUrl) {
          onCompositeChange(dataUrl);
        }
      } catch (err) {
        console.warn("Could not generate composite for parent:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [placedItems, roomImage]);

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
                ? `Original room space (${roomLength}×${roomWidth} ft) · Drag & drop furniture from the designer`
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
                  onClick={handleZoomClick}
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

      {/* Remove Object & Selection Action Bar (Both YOLO Selection & Manual Brush Selection) */}
      {roomImage && (
        <div
          className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2.5 transition-colors ${
            isLight ? "bg-amber-50/70 border-amber-200/60" : "bg-amber-950/30 border-amber-900/40"
          }`}
        >
          {/* Mode Tabs: Auto Detected vs Manual Brush Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`p-0.5 rounded-lg border flex items-center gap-0.5 ${
                isLight ? "bg-stone-200/70 border-stone-300" : "bg-slate-900/80 border-slate-700"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setRemovalMode("detect");
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  removalMode === "detect"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : isLight
                    ? "text-stone-700 hover:text-stone-900"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <span>🛋️</span>
                <span>Auto Detected {detectedObjects?.length > 0 ? `(${detectedObjects.length})` : ""}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRemovalMode("manual");
                  setSelectedDetectedId(null);
                  setSelectedItemId(null);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  removalMode === "manual"
                    ? "bg-rose-600 text-white shadow-xs ring-1 ring-rose-400/40"
                    : isLight
                    ? "text-stone-700 hover:text-stone-900"
                    : "text-stone-300 hover:text-white"
                }`}
              >
                <span>🖌️</span>
                <span>Brush / Select Area</span>
                {hasManualSelection && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </button>
            </div>

            {/* Mode 1: YOLO Detected Objects Chips */}
            {removalMode === "detect" && detectedObjects && detectedObjects.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap ml-1">
                {detectedObjects.map((obj) => {
                  const isSel = selectedDetectedId === obj.id;
                  return (
                    <button
                      key={obj.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetectedId(isSel ? null : obj.id);
                        setSelectedItemId(null);
                        setSelectionWarning(null);
                      }}
                      title={isSel ? `Click to deselect ${obj.label}` : `Select ${obj.label} to remove`}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        isSel
                          ? "bg-rose-600 text-white border-rose-500 shadow-sm ring-2 ring-rose-400/40"
                          : isLight
                          ? "bg-white hover:bg-stone-100 text-stone-800 border-stone-300"
                          : "bg-slate-800 hover:bg-slate-700 text-stone-200 border-slate-700"
                      }`}
                    >
                      <span>{obj.label}</span>
                      {isSel && (
                        <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-bold">Selected</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mode 2: Manual Brush Sub-controls (Brush vs Box Tool, Brush Size, Clear Selection) */}
            {removalMode === "manual" && (
              <div className="flex items-center gap-2 flex-wrap ml-1">
                {/* Brush vs Box Tool */}
                <div
                  className={`p-0.5 rounded-lg border flex items-center gap-0.5 ${
                    isLight ? "bg-white border-stone-300" : "bg-slate-900 border-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setBrushTool("brush")}
                    title="Brush Selection (Freehand paint over object)"
                    className={`px-2 py-0.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      brushTool === "brush"
                        ? "bg-rose-600 text-white"
                        : isLight
                        ? "text-stone-600 hover:text-stone-900"
                        : "text-stone-300 hover:text-white"
                    }`}
                  >
                    <FiEdit3 className="text-xs" />
                    <span>Brush</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrushTool("box")}
                    title="Box Selection (Drag rectangular area)"
                    className={`px-2 py-0.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      brushTool === "box"
                        ? "bg-rose-600 text-white"
                        : isLight
                        ? "text-stone-600 hover:text-stone-900"
                        : "text-stone-300 hover:text-white"
                    }`}
                  >
                    <FiSquare className="text-xs" />
                    <span>Box</span>
                  </button>
                </div>

                {/* Brush Size Selector */}
                {brushTool === "brush" && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className={`text-[11px] ${isLight ? "text-stone-600" : "text-stone-400"}`}>Size:</span>
                    {[
                      { label: "S", size: 16 },
                      { label: "M", size: 32 },
                      { label: "L", size: 52 },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setBrushSize(opt.size)}
                        className={`w-6 h-6 rounded-md text-[11px] font-bold border transition cursor-pointer flex items-center justify-center ${
                          brushSize === opt.size
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : isLight
                            ? "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                            : "bg-slate-800 text-stone-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Clear Selection Mask */}
                {hasManualSelection && (
                  <button
                    type="button"
                    onClick={clearManualMask}
                    title="Clear painted selection mask"
                    className={`px-2 py-1 rounded-lg border text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
                      isLight
                        ? "bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-600 border-stone-300 hover:border-rose-300"
                        : "bg-slate-800 hover:bg-rose-950/40 text-stone-300 hover:text-rose-300 border-slate-700 hover:border-rose-700"
                    }`}
                  >
                    <FiRotateCcw className="text-xs" />
                    <span>Clear Mask</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Action: Warning + Remove Object / Remove Selected Area button */}
          <div className="flex items-center gap-2">
            {selectionWarning && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in duration-150">
                ⚠️ {selectionWarning}
              </span>
            )}
            <button
              disabled={Boolean(removingObjectId)}
              onClick={() => handleExecuteRemoval()}
              title={
                hasManualSelection
                  ? "Remove the manually selected/brushed area from room photo"
                  : selectedDetectedId
                  ? "Remove the selected object from room photo"
                  : removalMode === "manual"
                  ? "Please brush or select the object area you want to remove"
                  : "Please select an object to remove"
              }
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                hasManualSelection || selectedDetectedId
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-2 ring-rose-400/30 animate-pulse"
                  : isLight
                  ? "bg-stone-200 hover:bg-stone-300 text-stone-700 border border-stone-300"
                  : "bg-slate-800 hover:bg-slate-700 text-stone-300 border border-slate-700"
              }`}
            >
              <span>✂️</span>
              <span>
                {hasManualSelection
                  ? "Remove Selected Area"
                  : removalMode === "manual"
                  ? "Brush Area to Remove"
                  : "Remove Object"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Visual Canvas Area (Clean Room Photo with Placed Furniture & Manual Selection Layer) */}
      <div
        ref={canvasContainerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        onClick={(e) => {
          if (removalMode === "manual") return;
          setSelectedItemId(null);
          setSelectedDetectedId(null);
          setSelectionWarning(null);
          if (canvasContainerRef.current && detectedObjects && detectedObjects.length > 0) {
            const rect = canvasContainerRef.current.getBoundingClientRect();
            const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
            const clickYPct = ((e.clientY - rect.top) / rect.height) * 100;
            const matched = detectedObjects.find((obj) => {
              if (!obj.bbox_pct) return false;
              const { x, y, width, height } = obj.bbox_pct;
              return clickXPct >= x && clickXPct <= x + width && clickYPct >= y && clickYPct <= y + height;
            });
            if (matched) {
              setSelectedDetectedId(matched.id);
            }
          }
        }}
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

        {/* Detected Existing Furniture Objects in Room Photo (Interactive 1-Click Clean Removal) */}
        {removalMode === "detect" && detectedObjects && detectedObjects.length > 0 && detectedObjects.map((obj) => {
          const isRemovingThis = removingObjectId === obj.id;
          const isSelected = selectedDetectedId === obj.id;
          const bx = obj.bbox_pct?.x ?? 0;
          const by = obj.bbox_pct?.y ?? 0;
          const bw = obj.bbox_pct?.width ?? 10;
          const bh = obj.bbox_pct?.height ?? 10;
          const x = obj.bbox_pct?.center_x ?? (bx + bw / 2);
          const y = obj.bbox_pct?.center_y ?? (by + bh / 2);

          return (
            <React.Fragment key={obj.id}>
              {/* Interactive Bounding Area Overlay */}
              <div
                style={{
                  left: `${bx}%`,
                  top: `${by}%`,
                  width: `${bw}%`,
                  height: `${bh}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDetectedId(isSelected ? null : obj.id);
                  setSelectedItemId(null);
                  setSelectionWarning(null);
                }}
                title={`Selected: ${obj.label}. Click 'Remove Object' to cleanly remove it from the room.`}
                className={`absolute z-24 rounded-lg pointer-events-auto cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "border-2 border-dashed border-rose-500 bg-rose-500/15 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                    : "border border-dashed border-white/30 hover:border-indigo-400 hover:bg-indigo-500/10"
                }`}
              />

              {/* Centered Removal Action Badge on Canvas */}
              <div
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute z-26 pointer-events-auto group animate-in fade-in duration-200 ${
                  isSelected ? "opacity-100" : "opacity-0 hover:opacity-100 focus-within:opacity-100"
                }`}
              >
                <button
                  suppressHydrationWarning
                  disabled={Boolean(removingObjectId)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExecuteRemoval(obj);
                  }}
                  title={`Click to cleanly remove ONLY this ${obj.label} from the room photo`}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xl border backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 ${
                    isSelected || isRemovingThis
                      ? "bg-rose-600 text-white border-rose-400 shadow-rose-600/40"
                      : isLight
                      ? "bg-slate-900/90 hover:bg-rose-600 text-white border-white/40 shadow-slate-900/30"
                      : "bg-slate-900/95 hover:bg-rose-600 text-white border-indigo-400/40 shadow-black/70"
                  }`}
                >
                  {isRemovingThis ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-xs">✂️</span>
                  )}
                  <span>Remove Object</span>
                </button>
              </div>
            </React.Fragment>
          );
        })}

        {/* Interactive Manual Mask Drawing Layer */}
        <canvas
          ref={maskCanvasRef}
          onMouseDown={handleStartDraw}
          onMouseMove={handleMoveDraw}
          onMouseUp={handleEndDraw}
          onMouseLeave={() => {
            handleEndDraw();
            setCursorPos(null);
          }}
          onTouchStart={handleStartDraw}
          onTouchMove={handleMoveDraw}
          onTouchEnd={handleEndDraw}
          className={`absolute inset-0 w-full h-full z-28 transition-opacity ${
            removalMode === "manual" ? "pointer-events-auto cursor-crosshair" : "pointer-events-none opacity-90"
          }`}
          style={{
            touchAction: "none",
          }}
        />

        {/* Box Dragging Visual Box Overlay */}
        {isDrawing && brushTool === "box" && boxStart && boxCurrent && (
          <div
            style={{
              left: `${Math.min(boxStart.x, boxCurrent.x)}px`,
              top: `${Math.min(boxStart.y, boxCurrent.y)}px`,
              width: `${Math.abs(boxCurrent.x - boxStart.x)}px`,
              height: `${Math.abs(boxCurrent.y - boxStart.y)}px`,
            }}
            className="absolute pointer-events-none border-2 border-dashed border-rose-500 bg-rose-500/30 rounded shadow-lg z-29"
          />
        )}

        {/* Live Brush Ring Cursor Preview */}
        {removalMode === "manual" && brushTool === "brush" && cursorPos && (
          <div
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              width: `${brushSize}px`,
              height: `${brushSize}px`,
              transform: "translate(-50%, -50%)",
            }}
            className="absolute pointer-events-none rounded-full border-2 border-rose-500 bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.5)] z-30"
          />
        )}

        {/* Inpainting / Object Removal Active Overlay */}
        {removingObjectId && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-40 animate-in fade-in duration-200">
            <div className="w-9 h-9 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2.5"></div>
            <p className="text-xs font-bold tracking-wide">Removing Selected Area & Infilling Room Structure...</p>
            <p className="text-[11px] text-stone-300 mt-1">Preserving walls, floor, lighting, and untouched room objects</p>
          </div>
        )}

        {/* Placed Furniture Items Layers - Clean Rendering Without Cluttering Overlays */}
        {placedItems.map((item) => {
          const isSelected = selectedItemId === item.id;
          const isBeingDragged = draggingPlacedId === item.id;
          const rotation = item.rotation || 0;
          const currentScale = item.scale ?? 1.0;

          // Automatic Realistic Proportion Calculation based on room dimensions
          const baseWidthPct = calculateRealisticFurnitureWidthPct(item, roomWidth || 14);
          const computedWidthPct = Math.max(3, Math.min(85, baseWidthPct * currentScale));

          return (
            <div
              key={item.id}
              style={{
                left: `${item.pos_x}%`,
                top: `${item.pos_y}%`,
                width: `${computedWidthPct}%`,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
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
              {/* Furniture Object Container - Clean, No Text/Cards/Labels directly on room photo */}
              <div
                className={`relative transition-all duration-200 rounded-lg ${
                  isSelected
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent shadow-2xl"
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
                  className="w-full h-auto object-contain drop-shadow-2xl pointer-events-none select-none block"
                  style={{ userSelect: "none" }}
                />

                {/* Subtle Quick Delete Icon on Hover / Selection */}
                <button
                  suppressHydrationWarning
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  title="Remove this item"
                  className={`absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-md shadow-md transition cursor-pointer ${
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <FiTrash2 className="text-[10px]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. FURNITURE DETAILS SECTION (DISPLAYED BELOW THE ROOM IMAGE)             */}
      {/* ========================================================================= */}
      {selectedItem ? (
        <div
          className={`px-5 py-4 border-t flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            isLight ? "border-stone-200 bg-stone-50/90 text-stone-800" : "border-slate-800 bg-slate-950/90 text-stone-100"
          }`}
        >
          {/* Header row: Placed Piece Switcher (if multiple) & Title */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-stone-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <FiInfo className="text-xs" /> Placed Furniture Details
              </span>

              {placedItems.length > 1 && (
                <div className="flex items-center gap-1 ml-2 flex-wrap">
                  {placedItems.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => setSelectedItemId(it.id)}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        (selectedItemId === it.id || (!selectedItemId && selectedItem.id === it.id))
                          ? isLight
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                            : "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : isLight
                          ? "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                          : "bg-slate-900 text-stone-300 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      {it.label.split(" ").slice(0, 2).join(" ")}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              suppressHydrationWarning
              onClick={() => onRemoveItem(selectedItem.id)}
              className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1 cursor-pointer ml-auto"
            >
              <FiTrash2 className="text-xs" /> Remove Piece
            </button>
          </div>

          {/* Details Grid: Name, Price, Size/Dimensions, Material, Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* 1. Furniture Name & Category */}
            <div
              className={`p-2.5 rounded-xl border ${
                isLight ? "bg-white border-stone-200/80" : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? "text-stone-400" : "text-stone-500"}`}>
                Furniture Name
              </span>
              <h4 className="font-bold text-xs line-clamp-1 mt-0.5 text-stone-900 dark:text-stone-100">
                {selectedItem.label}
              </h4>
              <span className={`text-[10px] capitalize ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                Category: {selectedItem.category}
              </span>
            </div>

            {/* 2. Price */}
            <div
              className={`p-2.5 rounded-xl border ${
                isLight ? "bg-white border-stone-200/80" : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? "text-stone-400" : "text-stone-500"}`}>
                Price
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm block mt-0.5">
                ₹{selectedItem.price.toLocaleString("en-IN")}
              </span>
              <span className={`text-[10px] ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                Catalog Verified Price
              </span>
            </div>

            {/* 3. Furniture Size / Dimensions */}
            <div
              className={`p-2.5 rounded-xl border ${
                isLight ? "bg-white border-stone-200/80" : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? "text-stone-400" : "text-stone-500"}`}>
                Dimensions (L×W×H)
              </span>
              <span className="font-bold text-xs block mt-0.5 text-stone-800 dark:text-stone-200">
                {selectedItem.dimensions?.length_ft ?? 6.5} ft (L) × {selectedItem.dimensions?.width_ft ?? 5.0} ft (W)
                {selectedItem.dimensions?.height_ft ? ` × ${selectedItem.dimensions.height_ft} ft (H)` : ""}
              </span>
              <span className={`text-[10px] text-indigo-600 dark:text-indigo-400 font-medium`}>
                Proportioned for {roomLength}×{roomWidth} ft Room
              </span>
            </div>

            {/* 4. Placement & Material */}
            <div
              className={`p-2.5 rounded-xl border ${
                isLight ? "bg-white border-stone-200/80" : "bg-slate-900/80 border-slate-800"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? "text-stone-400" : "text-stone-500"}`}>
                Material & Description
              </span>
              <span className="font-medium text-[11px] block mt-0.5 line-clamp-1 text-stone-700 dark:text-stone-300">
                {selectedItem.material || selectedItem.description || "Solid wood / premium craftsmanship"}
              </span>
              <span className={`text-[10px] ${isLight ? "text-stone-400" : "text-stone-500"}`}>
                Pos: X {selectedItem.pos_x}%, Y {selectedItem.pos_y}%
              </span>
            </div>
          </div>

          {/* Controls Bar: Resize (Min 20% to 180%) & Rotation Slider */}
          <div
            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
              isLight ? "bg-white border-stone-200/80" : "bg-slate-900/80 border-slate-800"
            }`}
          >
            {/* Size Control */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${isLight ? "text-stone-600" : "text-stone-300"}`}>
                Size:
              </span>

              <button
                suppressHydrationWarning
                onClick={() =>
                  onUpdateItemScale(
                    selectedItem.id,
                    Math.max(0.2, Number(((selectedItem.scale || 1.0) - 0.05).toFixed(2)))
                  )
                }
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isLight ? "bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800" : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-stone-200"
                }`}
                title="Decrease size (down to 20%)"
              >
                <FiMinus className="text-xs" />
              </button>

              <input
                suppressHydrationWarning
                type="range"
                min="0.2"
                max="1.8"
                step="0.05"
                value={selectedItem.scale ?? 1.0}
                onChange={(e) => onUpdateItemScale(selectedItem.id, parseFloat(e.target.value))}
                className={`w-24 sm:w-32 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${
                  isLight ? "bg-stone-200" : "bg-slate-700"
                }`}
                title={`Size: ${Math.round((selectedItem.scale || 1.0) * 100)}%`}
                aria-label="Size Scale"
              />

              <button
                suppressHydrationWarning
                onClick={() =>
                  onUpdateItemScale(
                    selectedItem.id,
                    Math.min(1.8, Number(((selectedItem.scale || 1.0) + 0.05).toFixed(2)))
                  )
                }
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isLight ? "bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800" : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-stone-200"
                }`}
                title="Increase size (up to 180%)"
              >
                <FiPlus className="text-xs" />
              </button>

              <span className="font-mono text-xs font-bold w-12 text-center text-indigo-600 dark:text-indigo-400">
                {Math.round((selectedItem.scale || 1.0) * 100)}%
              </span>
            </div>

            {/* Rotation Slider Control */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${isLight ? "text-stone-600" : "text-stone-300"}`}>
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
                className={`w-24 sm:w-28 h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${
                  isLight ? "bg-stone-200" : "bg-slate-700"
                }`}
                title={`Rotation: ${selectedItem.rotation ?? 0}°`}
                aria-label="Rotation"
              />
              <span className="font-mono text-xs font-bold w-10 text-center text-stone-800 dark:text-stone-200">
                {selectedItem.rotation ?? 0}°
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Hint below canvas when no furniture placed */
        <div
          className={`px-5 py-3 border-t text-xs flex items-center justify-between ${
            isLight ? "border-stone-200/80 bg-stone-50/50 text-stone-500" : "border-slate-800/80 bg-slate-950/40 text-stone-400"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <FiInfo className="text-xs text-indigo-500" />
            Drag and drop furniture items from the AI designer or dataset catalog into the room canvas above.
          </span>
          <span className="text-[11px] font-mono">Room: {roomLength}×{roomWidth} ft</span>
        </div>
      )}
    </div>
  );
}
