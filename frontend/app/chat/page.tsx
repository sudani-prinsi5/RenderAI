"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import RoomCanvas, { PlacedItem } from "../components/RoomCanvas";
import FurnitureMenu from "../components/FurnitureMenu";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import {
  FiSend,
  FiUploadCloud,
  FiPlus,
  FiCheck,
  FiShoppingBag,
  FiMaximize2,
  FiInfo,
  FiRefreshCw,
  FiTrash2,
  FiMove,
  FiSliders,
} from "react-icons/fi";
import {
  DATASET_CATEGORIES,
  BUDGET_TIERS,
  DatasetFurnitureItem,
  getDatasetItems,
  getBudgetBracketKey,
  parseBudgetFromInput,
  getOrExtractItemImageUrl,
  prefetchCategoryExtractions,
} from "../services/datasetCatalog";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const WORKSPACE_STORAGE_KEY = "room_design_workspace_state";

const normalizePlacedItems = (items: any[]): PlacedItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map((it: any, idx: number) => {
    const cat = (it.category || it.name || "bed").toLowerCase();
    let defaultFallbackUrl = "/furniture_dataset/bed/buget_10k/bed1.jpeg";
    if (cat.includes("lamp") || cat.includes("light")) {
      defaultFallbackUrl = "/furniture_dataset/lamp/buget_10k/lamp1.jpg";
    } else if (cat.includes("table") || cat.includes("bedside") || cat.includes("nightstand")) {
      defaultFallbackUrl = "/furniture_dataset/table/buget_10k/table1.jpg";
    }

    return {
      id: String(it.id || `item_${idx}`),
      datasetId: it.datasetId,
      name: it.name || "furniture",
      label: it.label || it.name || "Furniture Piece",
      category: it.category || it.name || "bed",
      price: Number(it.price) || 15000,
      image_url: it.image_url || defaultFallbackUrl,
      pos_x: Number(it.pos_x ?? (50 + (idx === 0 ? 0 : idx * 15 - 15))),
      pos_y: Number(it.pos_y ?? (60 + (idx === 0 ? 0 : idx * 5))),
      scale: Number(it.scale || 1.0),
      rotation: Number(it.rotation || 0),
      dimensions: it.dimensions || { length_ft: it.length_ft || 6.5, width_ft: it.width_ft || 5.0, height_ft: it.height_ft || 2.8 },
      material: it.material,
      description: it.description,
    };
  });
};

interface ChatMessage {
  id: string;
  sender: "AI" | "You";
  text: string;
  timestamp: string;
  step?:
    | "greeting"
    | "suggest_space"
    | "ask_budget"
    | "show_dataset_items"
    | "item_placed"
    | "custom";
  suggestedCategories?: string[]; // category keys like ["bed", "lamp", "table"]
  pendingCategory?: string; // category for which budget was requested
  budgetOptions?: { label: string; value: number }[];
  datasetItems?: DatasetFurnitureItem[];
  placedItemId?: string;
}

interface RoomData {
  room_id: number;
  original_image: string | null;
  detected_image: string | null;
  object_counts?: Record<string, number>;
  total_objects?: number;
  is_empty_room?: boolean;
  room_length: number;
  room_width: number;
  room_height: number;
  budget?: number;
  furniture_state?: any[];
  chat_history?: any[];
  detected_objects_list?: any[];
  detected_objects?: any;
}

export default function ChatPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLight } = useTheme();

  // Room state
  const [mounted, setMounted] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [roomImageSrc, setRoomImageSrc] = useState<string | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<any[]>([]);
  const [removingObjectId, setRemovingObjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentPendingCategory, setCurrentPendingCategory] = useState<string>("bed");
  const [currentBudget, setCurrentBudget] = useState<number>(25000);

  // Furniture Menu Modal state
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState<string>("bed");

  // Dragged dataset item
  const [draggedItem, setDraggedItem] = useState<DatasetFurnitureItem | null>(null);

  // Zoom preview modal
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // New room setup modal
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [setupLength, setSetupLength] = useState("14");
  const [setupWidth, setSetupWidth] = useState("12");
  const [setupHeight, setSetupHeight] = useState("10");
  const [setupLoading, setSetupLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncFurnitureToBackend = (items: PlacedItem[], roomId?: number) => {
    if (!roomId) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await api.post("/chat/update-furniture-state", {
          room_id: roomId,
          user_id: getUserId(),
          furniture_state: items,
        });
      } catch {
        // Silent catch: localStorage maintains exact state
      }
    }, 400);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const getUserId = (): number | undefined => {
    if (typeof window === "undefined") return undefined;
    const userStr = localStorage.getItem("user");
    if (!userStr) return undefined;
    try {
      const u = JSON.parse(userStr);
      return u.user_id ? Number(u.user_id) : undefined;
    } catch {
      return undefined;
    }
  };

  // Restore workspace state on initial mount
  useEffect(() => {
    let restoredFromStorage = false;
    let targetRoomId: number | null = null;
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const qId = urlParams.get("room_id") || urlParams.get("roomId");
        if (qId) {
          targetRoomId = Number(qId);
        }
      }
    } catch {}

    try {
      const savedStr = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved && typeof saved === "object") {
          const savedRoomId = saved.room?.room_id;
          const matchesTarget = !targetRoomId || savedRoomId === targetRoomId;

          if (matchesTarget) {
            const hasRoom = Boolean(saved.room || saved.roomImageSrc);
            const hasItems = Array.isArray(saved.placedItems) && saved.placedItems.length > 0;
            const hasMessages = Array.isArray(saved.messages) && saved.messages.length > 0;
            const hasDetected = Array.isArray(saved.detectedObjects) && saved.detectedObjects.length > 0;

            if (hasRoom || hasItems || hasMessages || hasDetected) {
              if (saved.room) setRoom(saved.room);
              if (saved.roomImageSrc) setRoomImageSrc(saved.roomImageSrc);
              if (Array.isArray(saved.placedItems)) {
                setPlacedItems(normalizePlacedItems(saved.placedItems));
              }
              if (Array.isArray(saved.messages) && saved.messages.length > 0) {
                setMessages(saved.messages);
              }
              if (Array.isArray(saved.detectedObjects)) {
                setDetectedObjects(saved.detectedObjects);
              }
              if (saved.selectedItemId !== undefined) {
                setSelectedItemId(saved.selectedItemId);
              }
              if (saved.currentPendingCategory) {
                setCurrentPendingCategory(saved.currentPendingCategory);
              }
              if (typeof saved.currentBudget === "number") {
                setCurrentBudget(saved.currentBudget);
              }
              if (saved.activeMenuCategory) {
                setActiveMenuCategory(saved.activeMenuCategory);
              }
              if (saved.setupLength) setSetupLength(saved.setupLength);
              if (saved.setupWidth) setSetupWidth(saved.setupWidth);
              if (saved.setupHeight) setSetupHeight(saved.setupHeight);
              if (typeof saved.showSetupModal === "boolean") {
                setShowSetupModal(saved.showSetupModal);
              }

              setLoading(false);
              restoredFromStorage = true;
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore workspace from localStorage:", e);
    }

    setIsRestored(true);

    if (targetRoomId) {
      loadLatestRoom(targetRoomId);
    } else if (!restoredFromStorage) {
      loadLatestRoom();
    }
  }, []);

  // Persist workspace state to localStorage on state changes
  useEffect(() => {
    if (!isRestored) return;
    try {
      const stateToSave = {
        room,
        roomImageSrc,
        placedItems,
        messages,
        detectedObjects,
        selectedItemId,
        currentPendingCategory,
        currentBudget,
        activeMenuCategory,
        showSetupModal,
        setupLength,
        setupWidth,
        setupHeight,
        timestamp: Date.now(),
      };
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save workspace state to localStorage:", e);
    }
  }, [
    isRestored,
    room,
    roomImageSrc,
    placedItems,
    messages,
    detectedObjects,
    selectedItemId,
    currentPendingCategory,
    currentBudget,
    activeMenuCategory,
    showSetupModal,
    setupLength,
    setupWidth,
    setupHeight,
  ]);

  // Synchronous flush on window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isRestored) return;
      try {
        const stateToSave = {
          room,
          roomImageSrc,
          placedItems,
          messages,
          detectedObjects,
          selectedItemId,
          currentPendingCategory,
          currentBudget,
          activeMenuCategory,
          showSetupModal,
          setupLength,
          setupWidth,
          setupHeight,
          timestamp: Date.now(),
        };
        localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch {}
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    isRestored,
    room,
    roomImageSrc,
    placedItems,
    messages,
    detectedObjects,
    selectedItemId,
    currentPendingCategory,
    currentBudget,
    activeMenuCategory,
    showSetupModal,
    setupLength,
    setupWidth,
    setupHeight,
  ]);

  const loadLatestRoom = async (targetRoomId?: number) => {
    try {
      setLoading(true);
      const userId = getUserId();
      const params: any = userId ? { user_id: userId } : {};
      if (targetRoomId) {
        params.room_id = targetRoomId;
      }
      const res = await api.get("/latest-room", { params });

      if (res.data.success) {
        const data = res.data as RoomData;
        setRoom(data);

        // Set room image: prioritize original_image / cleaned room, fallback to detected/generated
        const imagePath = data.original_image || data.detected_image || (data as any).generated_image;
        if (imagePath) {
          const src = imagePath.startsWith("http") || imagePath.startsWith("data:")
            ? imagePath
            : API_BASE + (imagePath.startsWith("/") ? imagePath : `/${imagePath}`);
          setRoomImageSrc(src);
        }

        // Restore placed items if present
        if (data.furniture_state && Array.isArray(data.furniture_state) && data.furniture_state.length > 0) {
          const loadedPlaced = normalizePlacedItems(data.furniture_state);
          setPlacedItems(loadedPlaced);
        } else {
          setPlacedItems([]);
        }

        if (data.detected_objects_list && Array.isArray(data.detected_objects_list)) {
          setDetectedObjects(data.detected_objects_list);
        } else {
          setDetectedObjects([]);
        }

        // Restore chat history if exists, otherwise initialize natural chat
        if (data.chat_history && Array.isArray(data.chat_history) && data.chat_history.length > 0) {
          setMessages(data.chat_history);
        } else {
          initializeDesignerChat(data);
        }
      }
    } catch {
      // No room uploaded yet -> show setup modal
      setRoom(null);
      setRoomImageSrc(null);
      setPlacedItems([]);
      setSelectedItemId(null);
      setShowSetupModal(true);
      setMessages([
        {
          id: "welcome_init",
          sender: "AI",
          text: "Hello! I'm your AI Interior Designer. 🏡\n\nPlease upload a photo of your room or configure your room dimensions to start our interactive design session.",
          timestamp: new Date().toISOString(),
          step: "greeting",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize step-by-step conversation
  const initializeDesignerChat = (roomData: RoomData) => {
    const dims = `${roomData.room_length || 14}×${roomData.room_width || 12} ft`;
    const initialGreeting: ChatMessage = {
      id: "msg_1",
      sender: "AI",
      text: `Nice to meet you! I can see your uploaded room space (${dims}). There's a generous amount of open space near the main wall.\n\nA **bed**, **table**, and **lamp** would work nicely here.`,
      timestamp: new Date().toISOString(),
      step: "suggest_space",
      suggestedCategories: ["bed", "table", "lamp"],
    };

    setMessages([initialGreeting]);
  };

  // STEP 2 -> STEP 3: User clicks a suggestion category (e.g. Bed, Table, Lamp)
  const handleSelectSuggestionCategory = (categoryKey: string) => {
    const normalizedKey = categoryKey === "bedside_table" ? "table" : categoryKey;
    const catMeta = DATASET_CATEGORIES.find((c) => c.key === normalizedKey) || {
      key: normalizedKey,
      label: normalizedKey === "bedside_table" || normalizedKey === "table" ? "Table" : normalizedKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    };

    setCurrentPendingCategory(normalizedKey);

    // 1. User Message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "You",
      text: `Let's add a ${catMeta.label}.`,
      timestamp: new Date().toISOString(),
    };

    // 2. AI asks for budget naturally
    const aiBudgetMsg: ChatMessage = {
      id: `ai_${Date.now() + 1}`,
      sender: "AI",
      text: `Great choice! Before I show you the options, **what's your budget for the ${catMeta.label.toLowerCase()}**?`,
      timestamp: new Date().toISOString(),
      step: "ask_budget",
      pendingCategory: categoryKey,
      budgetOptions: [
        { label: "Under ₹10,000", value: 10000 },
        { label: "₹10,000 - ₹20,000", value: 20000 },
        { label: "₹20,000 - ₹30,000", value: 28000 },
        { label: "₹30,000 - ₹40,000+", value: 38000 },
      ],
    };

    setMessages((prev) => [...prev, userMsg, aiBudgetMsg]);
  };

  // STEP 3 -> STEP 4: User selects or enters budget
  const handleProvideBudget = (budgetValue: number, categoryKey?: string) => {
    const cat = categoryKey || currentPendingCategory || "bed";
    const catMeta = DATASET_CATEGORIES.find((c) => c.key === cat) || {
      key: cat,
      label: cat.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
    };

    setCurrentBudget(budgetValue);

    // Fetch real dataset items matching category & budget
    const datasetItems = getDatasetItems(cat, budgetValue);

    // 1. User message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "You",
      text: `My budget is ₹${budgetValue.toLocaleString("en-IN")}.`,
      timestamp: new Date().toISOString(),
    };

    // 2. AI presents real dataset options
    const aiOptionsMsg: ChatMessage = {
      id: `ai_${Date.now() + 1}`,
      sender: "AI",
      text: `Here are **${catMeta.label.toLowerCase()}** options from our dataset available within your **₹${budgetValue.toLocaleString(
        "en-IN"
      )}** budget.\n\n**Drag and drop** your favorite item onto the room canvas above (or click *+ Place*):`,
      timestamp: new Date().toISOString(),
      step: "show_dataset_items",
      pendingCategory: cat,
      datasetItems: datasetItems,
    };

    setMessages((prev) => [...prev, userMsg, aiOptionsMsg]);
  };

  // STEP 5 & 6: Drag & Drop / Click Placement onto Room Canvas
  // CRITICAL: Places ONLY the selected single furniture item!
  const handlePlaceFurnitureItem = async (item: DatasetFurnitureItem, posX?: number, posY?: number) => {
    const catLower = (item.category || item.name || "").toLowerCase();
    let defaultX = 50;
    let defaultY = 60;

    if (catLower.includes("bed") && !catLower.includes("table") && !catLower.includes("side")) {
      defaultX = 50;
      defaultY = 60;
    } else if (catLower.includes("table") || catLower.includes("bedside") || catLower.includes("nightstand")) {
      const existingTables = placedItems.filter(
        (it) => (it.category || "").includes("table") || (it.category || "").includes("bedside")
      );
      if (existingTables.length === 0) {
        defaultX = 26;
        defaultY = 66;
      } else {
        defaultX = 74;
        defaultY = 66;
      }
    } else if (catLower.includes("lamp") || catLower.includes("light")) {
      const existingLamps = placedItems.filter((it) => (it.category || "").includes("lamp"));
      if (existingLamps.length === 0) {
        defaultX = 22;
        defaultY = 56;
      } else {
        defaultX = 78;
        defaultY = 56;
      }
    }

    const dropX = posX ?? defaultX;
    const dropY = posY ?? defaultY;
    const uniqueItemId = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const initialPlacedUrl = item.extracted_image_url || item.image_url;

    const newPlacedItem: PlacedItem = {
      id: uniqueItemId,
      datasetId: item.id,
      name: item.name,
      label: item.label,
      category: item.category,
      price: item.price,
      image_url: initialPlacedUrl,
      pos_x: dropX,
      pos_y: dropY,
      scale: 1.0,
      rotation: 0,
      dimensions: item.dimensions,
      material: item.material,
      description: item.description,
    };

    // Update canvas state immediately with only this added item
    setPlacedItems((prev) => [...prev, newPlacedItem]);
    setSelectedItemId(uniqueItemId);

    // If transparent version is not yet resolved, extract it in background and update
    if (!item.extracted_image_url) {
      getOrExtractItemImageUrl(item).then((extractedUrl) => {
        if (extractedUrl && extractedUrl !== initialPlacedUrl) {
          setPlacedItems((prev) =>
            prev.map((it) => (it.id === uniqueItemId ? { ...it, image_url: extractedUrl } : it))
          );
        }
      });
    }

    // Determine intuitive next recommendation in the guided sequence
    let nextSuggested: string[] = [];
    let nextPrompt = "";
    if (catLower.includes("bed") && !catLower.includes("table") && !catLower.includes("side")) {
      nextSuggested = ["table", "lamp"];
      nextPrompt = "\n\nWould you like to add a **table** next?";
    } else if (catLower.includes("table") || catLower.includes("bedside") || catLower.includes("nightstand")) {
      nextSuggested = ["lamp", "wardrobe"];
      nextPrompt = "\n\nWould you like to add a **lamp**?";
    } else if (catLower.includes("lamp") || catLower.includes("light")) {
      nextSuggested = ["wardrobe", "chair", "desk"];
      nextPrompt = "\n\nYour bedside setup is looking great! Would you like to add a **wardrobe**, **accent chair**, or **study desk** next?";
    } else {
      nextSuggested = DATASET_CATEGORIES.filter((c) => c.key !== item.category).map((c) => c.key).slice(0, 3);
      nextPrompt = "\n\nWhat would you like to add next to your room?";
    }

    const confirmationMsg: ChatMessage = {
      id: `ai_placed_${Date.now()}`,
      sender: "AI",
      text: `✅ Placed **${item.label}** (₹${item.price.toLocaleString(
        "en-IN"
      )}) into your room at that exact position!\n\nYou can move it around on the canvas anytime.${nextPrompt}`,
      timestamp: new Date().toISOString(),
      step: "item_placed",
      suggestedCategories: nextSuggested,
      placedItemId: uniqueItemId,
    };

    setMessages((prev) => [...prev, confirmationMsg]);

    // Sync and persist to backend database
    if (room?.room_id) {
      try {
        const res = await api.post("/chat/add-product", {
          room_id: room.room_id,
          user_id: getUserId(),
          item_id: uniqueItemId,
          product: {
            id: uniqueItemId,
            datasetId: item.id,
            title: item.label,
            label: item.label,
            category: item.category,
            price: item.price,
            image_url: initialPlacedUrl,
            dimensions: item.dimensions,
            scale: 1.0,
            rotation: 0,
          },
          pos_x: dropX,
          pos_y: dropY,
        });

        if (res.data?.added_item?.id && res.data.added_item.id !== uniqueItemId) {
          const backendId = String(res.data.added_item.id);
          setPlacedItems((prev) =>
            prev.map((it) => (it.id === uniqueItemId ? { ...it, id: backendId } : it))
          );
          setSelectedItemId((prev) => (prev === uniqueItemId ? backendId : prev));
        }

      } catch (err) {
        console.error("Failed to persist added furniture item in backend:", err);
      }
    }
  };

  // Move / Reposition placed item on canvas
  const handleUpdateItemPosition = (id: string, posX: number, posY: number) => {
    setPlacedItems((prev) => {
      const updated = prev.map((it) => (it.id === id ? { ...it, pos_x: posX, pos_y: posY } : it));
      syncFurnitureToBackend(updated, room?.room_id);
      return updated;
    });
  };

  // Scale placed item
  const handleUpdateItemScale = (id: string, scale: number) => {
    setPlacedItems((prev) => {
      const updated = prev.map((it) => (it.id === id ? { ...it, scale: scale } : it));
      syncFurnitureToBackend(updated, room?.room_id);
      return updated;
    });
  };

  // Rotate placed item
  const handleUpdateItemRotation = (id: string, rotation: number) => {
    setPlacedItems((prev) => {
      const updated = prev.map((it) => (it.id === id ? { ...it, rotation: rotation } : it));
      syncFurnitureToBackend(updated, room?.room_id);
      return updated;
    });
  };

  // Sync latest composed design image to backend database for "My Designs"
  const handleCompositeChange = async (dataUrl: string) => {
    if (!room?.room_id) return;
    try {
      await api.post("/chat/save-composite-image", {
        room_id: room.room_id,
        user_id: getUserId(),
        composite_image: dataUrl,
        furniture_state: placedItems,
      });
    } catch (err) {
      console.warn("Could not save composite design image to backend:", err);
    }
  };

  // Cleanly remove an existing detected furniture piece from the room photo with natural inpainting
  const handleRemoveDetectedObject = async (targetObj: any) => {
    if (!room?.room_id) return;
    try {
      setRemovingObjectId(targetObj.id);
      const res = await api.post("/chat/remove-room-object", {
        room_id: room.room_id,
        user_id: getUserId(),
        target_object: targetObj,
      });

      if (res.data?.success) {
        const newPath = res.data.cleaned_image_path;
        const fullUrl = newPath.startsWith("http") ? newPath : API_BASE + newPath;
        setRoomImageSrc(fullUrl);
        setDetectedObjects(res.data.remaining_objects || []);

        if (res.data.room) {
          setRoom(res.data.room);
        }

        const aiNoticeMsg: ChatMessage = {
          id: `ai_clean_${Date.now()}`,
          sender: "AI",
          text: `✨ Cleanly removed **${res.data.removed_object || targetObj.label}** from your room image!\n\nThe wall and floor textures were seamlessly reconstructed. You can now place any new furniture piece from the dataset into this space.`,
          timestamp: new Date().toISOString(),
          step: "custom",
          suggestedCategories: ["bed", "table", "lamp"],
        };
        setMessages((prev) => [...prev, aiNoticeMsg]);
      }
    } catch (err: any) {
      console.error("Error removing object from room photo:", err);
      alert(err.response?.data?.message || "Failed to remove object. Please try again.");
    } finally {
      setRemovingObjectId(null);
    }
  };

  // Remove individual placed item permanently
  const handleRemoveItem = async (id: string) => {
    const itemToRemove = placedItems.find((it) => it.id === id);
    if (!itemToRemove) return;

    // Optimistic UI update
    setPlacedItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }

    // Persist deletion permanently to backend database
    if (room?.room_id) {
      try {
        const res = await api.post("/chat/remove-product", {
          room_id: room.room_id,
          user_id: getUserId(),
          item_id: id,
        });

        if (!res.data || res.data.success === false) {
          throw new Error(res.data?.message || "Failed to delete item from room in database");
        }
      } catch (err: any) {
        console.error("Failed to persist deletion:", err);
        // Rollback state if backend deletion failed
        setPlacedItems((prev) => [...prev, itemToRemove]);
        alert("Failed to delete item from room design. Please try again.");
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ai_remove_${Date.now()}`,
        sender: "AI",
        text: `Removed **${itemToRemove.label}** from the room workspace.`,
        timestamp: new Date().toISOString(),
        step: "custom",
      },
    ]);
  };

  // Clear all placed items permanently
  const handleClearAllItems = async () => {
    const previousItems = [...placedItems];
    setPlacedItems([]);
    setSelectedItemId(null);

    if (room?.room_id) {
      try {
        const res = await api.post("/chat/remove-product", {
          room_id: room.room_id,
          user_id: getUserId(),
          item_id: "all",
        });

        if (!res.data || res.data.success === false) {
          throw new Error(res.data?.message || "Failed to reset room furniture in database");
        }
      } catch (err) {
        console.error("Failed to reset furniture in backend:", err);
        setPlacedItems(previousItems);
        alert("Failed to reset room furniture. Please try again.");
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ai_clear_${Date.now()}`,
        sender: "AI",
        text: "Cleared all added furniture from your room canvas. We have a clean slate to design again!",
        timestamp: new Date().toISOString(),
        step: "suggest_space",
        suggestedCategories: ["bed", "table", "lamp"],
      },
    ]);
  };

  // Send custom text message in chat
  const handleSendCustomMessage = async () => {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setInput("");

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "You",
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Check if user entered a budget number in text
    const parsedBudget = parseBudgetFromInput(userText);
    if (parsedBudget) {
      handleProvideBudget(parsedBudget, currentPendingCategory);
      return;
    }

    // Check if user mentioned a category (e.g. "bed", "table", "side table", "lamp", "wardrobe")
    const lower = userText.toLowerCase();
    const matchedCategory = DATASET_CATEGORIES.find((c) => {
      if (c.key === "table" || c.key === "bedside_table") {
        return (
          lower.includes("bedside") ||
          lower.includes("nightstand") ||
          lower.includes("side table") ||
          (lower.includes("table") && !lower.includes("dining"))
        );
      }
      if (c.key === "bed") {
        return lower.includes("bed") && !lower.includes("table") && !lower.includes("side");
      }
      if (c.key === "lamp") {
        return lower.includes("lamp") || lower.includes("light");
      }
      return lower.includes(c.key) || lower.includes(c.label.toLowerCase());
    });

    if (matchedCategory) {
      handleSelectSuggestionCategory(matchedCategory.key);
      return;
    }

    // General conversational query -> ask backend /chat
    try {
      setSending(true);
      const res = await api.post("/chat", {
        message: userText,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        const replyText = res.data.message || res.data.reply || "I've analyzed your room design.";
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: "AI",
            text: replyText,
            timestamp: new Date().toISOString(),
            step: "custom",
            suggestedCategories: ["bed", "table", "lamp"],
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: "AI",
          text: "I'm right here with you! You can choose any furniture piece like a Bed, Table, or Night Lamp to add it to your room.",
          timestamp: new Date().toISOString(),
          step: "suggest_space",
          suggestedCategories: ["bed", "table", "lamp"],
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendCustomMessage();
    }
  };

  // Start new room session
  const handleStartNewSession = async () => {
    try {
      setSetupLoading(true);
      const userId = getUserId();
      const formData = new FormData();
      formData.append("room_length", setupLength || "14");
      formData.append("room_width", setupWidth || "12");
      formData.append("room_height", setupHeight || "10");
      formData.append("is_empty_room", uploadFile ? "false" : "true");
      if (userId) formData.append("user_id", String(userId));

      if (uploadFile) {
        formData.append("image", uploadFile);
      }

      const res = await api.post("/chat/init-room", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data) {
        setShowSetupModal(false);
        setUploadFile(null);
        setUploadPreview("");
        setSelectedItemId(null);
        if (res.data.detected_objects_list) {
          setDetectedObjects(res.data.detected_objects_list);
        }
        try {
          localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        } catch {}
        await loadLatestRoom();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to initialize room session.");
    } finally {
      setSetupLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div
        className={`min-h-screen flex flex-col font-sans relative transition-colors duration-200 ${
          isLight ? "bg-[#FAF8F5] text-stone-800" : "bg-slate-950 text-stone-100"
        }`}
      >
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar isOpen={sidebarOpen} />
          <main
            className={`flex-1 transition-all duration-300 p-4 md:p-6 flex flex-col items-center justify-center ${
              sidebarOpen ? "ml-64" : "ml-20"
            }`}
          >
            <div className="flex flex-col items-center justify-center text-stone-400 space-y-2">
              <div className="w-6 h-6 border-2 border-stone-800 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Loading Room Design Workspace...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative transition-colors duration-200 ${
        isLight ? "bg-[#FAF8F5] text-stone-800" : "bg-slate-950 text-stone-100"
      }`}
    >
      {/* Top Navigation */}
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={sidebarOpen} />

        <main
          className={`flex-1 transition-all duration-300 p-4 md:p-6 flex flex-col overflow-y-auto ${
            sidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          {/* Top Header Bar */}
          <div
            className={`border rounded-2xl p-4 mb-4 shadow-sm flex flex-wrap items-center justify-between gap-4 backdrop-blur-md ${
              isLight
                ? "bg-white/90 border-stone-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
                : "bg-slate-900/90 border-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div>
                <p className={`text-xs font-medium ${isLight ? "text-stone-600" : "text-stone-300"}`}>
                  {room ? (
                    <span>
                      Room Dimensions: <strong>{room.room_length}×{room.room_width} ft</strong> · Real Dataset Catalog Connected
                    </span>
                  ) : (
                    "Upload room photo to begin designing"
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions & Menu trigger */}
            <div className="flex items-center gap-2.5">
              <button
                suppressHydrationWarning
                onClick={() => {
                  setActiveMenuCategory("bed");
                  setMenuOpen(true);
                }}
                className={`text-xs font-semibold px-3 py-2 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                  isLight
                    ? "bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200"
                    : "bg-slate-800 hover:bg-slate-700 text-stone-200 border-slate-700"
                }`}
              >
                <FiShoppingBag className="text-xs" /> Browse Dataset Catalog
              </button>

              <button
                suppressHydrationWarning
                onClick={() => setShowSetupModal(true)}
                className="bg-stone-900 hover:bg-stone-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlus className="text-xs" /> New Room
              </button>
            </div>
          </div>

          {/* Main Two-Column Layout: Room Canvas (Main Focus) + AI Conversation Assistant */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
            {/* Left / Center: Main Visual Room Canvas Area (7 Cols on Desktop) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <RoomCanvas
                roomImage={roomImageSrc}
                placedItems={placedItems}
                roomLength={room?.room_length || (setupLength ? parseFloat(setupLength) : 14)}
                roomWidth={room?.room_width || (setupWidth ? parseFloat(setupWidth) : 12)}
                onDropItem={(item, x, y) => handlePlaceFurnitureItem(item, x, y)}
                onUpdateItemPosition={handleUpdateItemPosition}
                onUpdateItemScale={handleUpdateItemScale}
                onUpdateItemRotation={handleUpdateItemRotation}
                onRemoveItem={handleRemoveItem}
                onClearAll={handleClearAllItems}
                isLight={isLight}
                onZoomPreview={(url) => setZoomImage(url)}
                selectedItemId={selectedItemId}
                onSelectItem={setSelectedItemId}
                onCompositeChange={handleCompositeChange}
                detectedObjects={detectedObjects}
                onRemoveDetectedObject={handleRemoveDetectedObject}
                removingObjectId={removingObjectId}
              />

              {/* Space Suggestion Quick Bar below canvas */}
              <div
                className={`border rounded-2xl p-3.5 backdrop-blur-sm shadow-sm flex flex-wrap items-center justify-between gap-3 ${
                  isLight ? "bg-white/80 border-stone-200" : "bg-slate-900/80 border-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-stone-700" : "text-stone-300"}`}>
                    Suggested for this space:
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {DATASET_CATEGORIES.map((cat) => (
                    <button
                      suppressHydrationWarning
                      key={cat.key}
                      onClick={() => handleSelectSuggestionCategory(cat.key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        isLight
                          ? "bg-stone-50 hover:bg-stone-900 hover:text-white text-stone-700 border-stone-200 hover:border-stone-900"
                          : "bg-slate-800 hover:bg-indigo-600 hover:text-white text-stone-200 border-slate-700 hover:border-indigo-600"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>[ {cat.label} ]</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Integrated AI Interior Designer Chat Thread (5 Cols on Desktop) */}
            <div
              className={`lg:col-span-5 border rounded-2xl flex flex-col h-[750px] max-h-[calc(100vh-13rem)] shadow-lg backdrop-blur-md overflow-hidden ${
                isLight
                  ? "bg-white/95 border-stone-200 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
                  : "bg-slate-900/95 border-slate-800"
              }`}
            >
              {/* Designer Chat Header */}
              <div
                className={`px-4 py-3 border-b flex items-center justify-between gap-2 ${
                  isLight ? "border-stone-200 bg-stone-50/70" : "border-slate-800 bg-slate-950/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-xs font-bold">
                    AI
                  </div>
                  <div>
                    <h3 className={`font-bold text-xs ${isLight ? "text-stone-900" : "text-stone-100"}`}>
                      AI Interior Designer
                    </h3>
                    <p className="text-[10px] text-emerald-500 font-medium">Active Consultation</p>
                  </div>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-stone-400 space-y-2">
                    <div className="w-6 h-6 border-2 border-stone-800 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs">Analyzing room layout...</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={msg.id ? `${msg.id}_${idx}` : `msg_${idx}`}
                      className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}
                    >
                      {/* Sender label */}
                      <span className={`text-[10px] font-semibold mb-1 px-1 ${isLight ? "text-stone-400" : "text-stone-500"}`}>
                        {msg.sender === "You" ? "You" : "AI Interior Designer"}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl p-3.5 max-w-[92%] text-xs leading-relaxed shadow-sm ${
                          msg.sender === "You"
                            ? isLight
                              ? "bg-stone-900 text-white rounded-br-none"
                              : "bg-indigo-600 text-white rounded-br-none"
                            : isLight
                            ? "bg-stone-100/90 text-stone-800 border border-stone-200/80 rounded-bl-none"
                            : "bg-slate-800 text-stone-200 border border-slate-700/60 rounded-bl-none"
                        }`}
                      >
                        {/* Text */}
                        <div className="whitespace-pre-line space-y-1">{msg.text}</div>

                        {/* Interactive Suggestion Chips inside conversation (Step 2) */}
                        {msg.suggestedCategories && msg.suggestedCategories.length > 0 && (
                          <div className={`mt-3 pt-2.5 border-t flex flex-wrap gap-1.5 ${isLight ? "border-stone-200" : "border-slate-700"}`}>
                            {msg.suggestedCategories.map((catKey, cIdx) => {
                              const normKey = catKey === "bedside_table" ? "table" : catKey;
                              const meta = DATASET_CATEGORIES.find((c) => c.key === normKey) || {
                                key: normKey,
                                label: normKey === "bedside_table" || normKey === "table" ? "Table" : normKey.charAt(0).toUpperCase() + normKey.slice(1).replace(/_/g, " "),
                                icon: "🪑",
                              };

                              return (
                                <button
                                  suppressHydrationWarning
                                  key={`${catKey}_${cIdx}`}
                                  onClick={() => handleSelectSuggestionCategory(catKey)}
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                                    isLight
                                      ? "bg-white hover:bg-stone-900 hover:text-white border-stone-300 text-stone-800 shadow-2xs"
                                      : "bg-slate-900 hover:bg-indigo-600 hover:text-white border-slate-600 text-stone-200 shadow-2xs"
                                  }`}
                                >
                                  <span>{meta.icon}</span>
                                  <span>[ {meta.label} ]</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Interactive Budget Selection Chips (Step 3) */}
                        {msg.step === "ask_budget" && msg.budgetOptions && (
                          <div className={`mt-3 pt-2.5 border-t space-y-1.5 ${isLight ? "border-stone-200" : "border-slate-700"}`}>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                              Select Budget Bracket:
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {msg.budgetOptions.map((bOpt, bIdx) => (
                                <button
                                  suppressHydrationWarning
                                  key={`${bOpt.value}_${bIdx}`}
                                  onClick={() => handleProvideBudget(bOpt.value, msg.pendingCategory)}
                                  className={`text-left p-2 rounded-xl border transition cursor-pointer ${
                                    isLight
                                      ? "bg-white hover:bg-emerald-50 hover:border-emerald-300 border-stone-200"
                                      : "bg-slate-900 hover:bg-emerald-950/50 hover:border-emerald-500 border-slate-700"
                                  }`}
                                >
                                  <span className="font-bold text-xs block text-emerald-600 dark:text-emerald-400">
                                    {bOpt.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Real Dataset Furniture Cards in Chat (Step 4) */}
                        {msg.step === "show_dataset_items" && msg.datasetItems && msg.datasetItems.length > 0 && (
                          <div className={`mt-3 pt-2.5 border-t space-y-2.5 ${isLight ? "border-stone-200" : "border-slate-700"}`}>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-stone-600 dark:text-stone-300">
                                {msg.datasetItems.length} Options Found in Dataset:
                              </span>
                              <button
                                suppressHydrationWarning
                                onClick={() => {
                                  setActiveMenuCategory(msg.pendingCategory || "bed");
                                  setMenuOpen(true);
                                }}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer text-[10px]"
                              >
                                View All →
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.datasetItems.slice(0, 4).map((item, itemIdx) => (
                                <div
                                  key={item.id ? `${item.id}_${itemIdx}` : `dataset_item_${itemIdx}`}
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggedItem(item);
                                    const dragUrl = item.extracted_image_url || item.image_url;
                                    const payload = { ...item, image_url: dragUrl };
                                    e.dataTransfer.setData("application/json", JSON.stringify(payload));
                                    e.dataTransfer.effectAllowed = "copyMove";
                                    try {
                                      const ghost = new Image();
                                      ghost.src = dragUrl;
                                      e.dataTransfer.setDragImage(ghost, 60, 45);
                                    } catch {}
                                  }}
                                  className={`border rounded-xl p-2 flex flex-col justify-between transition group shadow-2xs cursor-grab active:cursor-grabbing ${
                                    isLight
                                      ? "bg-white border-stone-200 hover:border-indigo-400"
                                      : "bg-slate-900 border-slate-700 hover:border-indigo-500"
                                  }`}
                                >
                                  <div>
                                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-stone-50 dark:bg-slate-950 mb-1.5 flex items-center justify-center border border-stone-100 dark:border-slate-800 select-none">
                                      <img
                                        src={item.extracted_image_url || item.image_url}
                                        alt={item.label}
                                        draggable={false}
                                        onDragStart={(e) => e.preventDefault()}
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400";
                                        }}
                                        className="max-h-full max-w-full object-contain pointer-events-none select-none"
                                      />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold pointer-events-none">
                                        <FiMove className="mr-1" /> Drag to Room
                                      </div>
                                    </div>
                                    <h5 className="font-bold text-[11px] line-clamp-1">{item.label}</h5>
                                    <span className="font-mono text-emerald-600 font-bold text-xs">
                                      ₹{item.price.toLocaleString("en-IN")}
                                    </span>
                                  </div>


                                  <button
                                    suppressHydrationWarning
                                    onClick={() => handlePlaceFurnitureItem(item)}
                                    className="mt-2 bg-stone-900 dark:bg-indigo-600 hover:opacity-90 text-white text-[10px] font-semibold py-1 px-2 rounded-lg transition cursor-pointer text-center"
                                  >
                                    + Place in Room
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {sending && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 animate-pulse px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-600"></span>
                    AI Interior Designer is formulating recommendations...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className={`p-3 border-t ${isLight ? "bg-stone-50 border-stone-200" : "bg-slate-950 border-slate-800"}`}>
                <div className="flex gap-2">
                  <input
                    suppressHydrationWarning
                    type="text"
                    value={input}
                    placeholder="Ask designer (e.g. 'Show beds under 20k', 'Add side table')..."
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className={`flex-1 border rounded-xl px-3.5 py-2.5 text-xs transition outline-none ${
                      isLight
                        ? "bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-stone-700"
                        : "bg-slate-900 border-slate-700 text-stone-100 placeholder-slate-500 focus:border-indigo-500"
                    }`}
                  />
                  <button
                    suppressHydrationWarning
                    onClick={handleSendCustomMessage}
                    disabled={sending || input.trim() === ""}
                    className="bg-stone-900 hover:bg-stone-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 rounded-xl transition flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-sm"
                  >
                    <FiSend className="text-sm" />
                  </button>
                </div>

                {/* Direct category chips */}
                <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${isLight ? "text-stone-400" : "text-stone-500"}`}>
                    Add:
                  </span>
                  {DATASET_CATEGORIES.slice(0, 4).map((cat) => (
                    <button
                      suppressHydrationWarning
                      key={cat.key}
                      onClick={() => handleSelectSuggestionCategory(cat.key)}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition cursor-pointer shrink-0 ${
                        isLight
                          ? "bg-white hover:bg-stone-100 text-stone-700 border-stone-200"
                          : "bg-slate-800 hover:bg-slate-700 text-stone-300 border-slate-700"
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reusable Furniture Menu Modal (Browsing Real Dataset) */}
          <FurnitureMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            activeCategory={activeMenuCategory}
            onSelectCategory={(cat) => setActiveMenuCategory(cat)}
            userBudget={currentBudget}
            onPlaceItem={(item) => handlePlaceFurnitureItem(item)}
            onDragStartItem={(e, item) => {
              setDraggedItem(item);
              const dragUrl = item.extracted_image_url || item.image_url;
              const payload = { ...item, image_url: dragUrl };
              e.dataTransfer.setData("application/json", JSON.stringify(payload));
              e.dataTransfer.effectAllowed = "copyMove";
              try {
                const ghost = new Image();
                ghost.src = dragUrl;
                e.dataTransfer.setDragImage(ghost, 60, 45);
              } catch {}
            }}

            isLight={isLight}
          />

          {/* New Room Setup Modal */}
          {showSetupModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div
                className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 ${
                  isLight ? "bg-white border-stone-200 text-stone-800" : "bg-slate-900 border-slate-800 text-stone-100"
                }`}
              >
                <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-stone-200" : "border-slate-800"}`}>
                  <div>
                    <h3 className="text-lg font-bold">Start New Room Design</h3>
                    <p className={`text-xs mt-0.5 ${isLight ? "text-stone-500" : "text-stone-400"}`}>
                      Upload your room photo to build on your real room space
                    </p>
                  </div>
                  {room && (
                    <button
                      onClick={() => setShowSetupModal(false)}
                      className={`text-lg cursor-pointer ${isLight ? "text-stone-400 hover:text-stone-800" : "text-stone-400 hover:text-stone-100"}`}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Dimensions */}
                <div className="space-y-3">
                  <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-stone-600" : "text-stone-300"}`}>
                    Room Dimensions (Feet)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className={`text-[11px] block mb-1 ${isLight ? "text-stone-500" : "text-stone-400"}`}>Length (ft)</span>
                      <input
                        type="number"
                        min="6"
                        step="0.5"
                        value={setupLength}
                        onChange={(e) => setSetupLength(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-sm outline-none transition ${
                          isLight
                            ? "bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-700"
                            : "bg-slate-950 border-slate-700 text-stone-100 focus:border-indigo-500"
                        }`}
                        placeholder="14"
                      />
                    </div>
                    <div>
                      <span className={`text-[11px] block mb-1 ${isLight ? "text-stone-500" : "text-stone-400"}`}>Width (ft)</span>
                      <input
                        type="number"
                        min="6"
                        step="0.5"
                        value={setupWidth}
                        onChange={(e) => setSetupWidth(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-sm outline-none transition ${
                          isLight
                            ? "bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-700"
                            : "bg-slate-950 border-slate-700 text-stone-100 focus:border-indigo-500"
                        }`}
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <span className={`text-[11px] block mb-1 ${isLight ? "text-stone-500" : "text-stone-400"}`}>Height (ft)</span>
                      <input
                        type="number"
                        min="6"
                        step="0.5"
                        value={setupHeight}
                        onChange={(e) => setSetupHeight(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-sm outline-none transition ${
                          isLight
                            ? "bg-stone-50 border-stone-200 text-stone-900 focus:border-stone-700"
                            : "bg-slate-950 border-slate-700 text-stone-100 focus:border-indigo-500"
                        }`}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Upload Photo */}
                <div className="space-y-2">
                  <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-stone-600" : "text-stone-300"}`}>
                    Room Photo
                  </label>
                  <label
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                      isLight
                        ? "border-stone-300 hover:border-stone-700 bg-stone-50"
                        : "border-slate-700 hover:border-indigo-500 bg-slate-950/40"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadFile(file);
                          setUploadPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    <FiUploadCloud className="text-2xl text-stone-600 dark:text-indigo-400 mb-1.5" />
                    <span className="text-xs font-medium">
                      {uploadFile ? uploadFile.name : "Click to select or drop room photo"}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${isLight ? "text-stone-400" : "text-stone-500"}`}>
                      PNG, JPG, JPEG accepted
                    </span>
                  </label>

                  {uploadPreview && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-inherit mt-2">
                      <img src={uploadPreview} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setUploadFile(null);
                          setUploadPreview("");
                        }}
                        className="absolute top-2 right-2 bg-rose-600 text-white text-xs px-2 py-1 rounded"
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {room && (
                    <button
                      onClick={() => setShowSetupModal(false)}
                      className={`flex-1 font-semibold py-3 rounded-xl text-sm transition cursor-pointer border ${
                        isLight ? "bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200" : "bg-slate-800 hover:bg-slate-700 text-stone-300 border-slate-700"
                      }`}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleStartNewSession}
                    disabled={setupLoading}
                    className="flex-1 bg-stone-900 hover:bg-stone-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow disabled:opacity-50 cursor-pointer"
                  >
                    {setupLoading ? "Setting Up..." : "Start Design Session →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fullscreen Zoom Preview Modal */}
          {zoomImage && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setZoomImage(null)}
            >
              <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
                <img
                  src={zoomImage}
                  alt="Zoom Preview"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-stone-700"
                />
                <p className="text-xs text-stone-400 mt-2">Click anywhere to close preview</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}