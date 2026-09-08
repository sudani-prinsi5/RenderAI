"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import {
  FiSend,
  FiUploadCloud,
  FiPlus,
  FiCheck,
  FiExternalLink,
  FiMaximize2,
  FiDownload,
  FiLayers,
  FiGrid,
  FiTrash2,
  FiRefreshCw,
  FiShoppingBag,
  FiAlertTriangle,
  FiMove,
  FiEye,
} from "react-icons/fi";

const API_BASE = "http://127.0.0.1:5000";

interface AmazonProduct {
  asin: string;
  title: string;
  brand?: string;
  category: string;
  sub_category?: string;
  price: number;
  mrp?: number;
  rating?: number;
  reviews_count?: number;
  image_url: string;
  amazon_url: string;
  search_url?: string;
  dimensions: {
    length_ft: number;
    width_ft: number;
    height_ft: number;
  };
  material?: string;
  color?: string;
  style?: string;
  description?: string;
}

interface FurnitureItem {
  id: string;
  asin?: string;
  name: string;
  label: string;
  size?: string;
  color?: string;
  hex_color?: string;
  description?: string;
  position?: string;
  pos_x?: number; // 0-100% position on canvas
  pos_y?: number;
  length_ft: number;
  width_ft: number;
  height_ft?: number;
  price?: number;
  rating?: number;
  image_url?: string;
  amazon_url?: string;
}

interface RoomOption {
  option_id: number;
  title: string;
  style: string;
  theme_color: string;
  wall_color?: string;
  floor_type?: string;
  bed_type?: string;
  bed_spec?: {
    label?: string;
    icon?: string;
    description?: string;
    width_ft?: number;
    length_ft?: number;
    height_ft?: number;
  };
  bed_size_display?: string;
  furniture_items: FurnitureItem[];
  amazon_products?: AmazonProduct[];
  total_price: number;
  budget: number;
  savings: number;
  space_footprint_sqft: number;
  space_percent: number;
  gemini_prompt?: string;
  gemini_link?: string;
  image_path: string | null;
}

interface CategoryOption {
  key: string;
  label: string;
  icon: string;
  desc?: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  timestamp?: string;
  imageUrl?: string;
  step?: "ask_room_type" | "ask_first_item" | "ask_next_item" | "show_category_products" | "ask_budget" | "show_options" | "room_selected" | "product_options" | "replace_options" | "custom" | "item_added";
  room_type?: string;
  bed_type?: string;
  category_options?: CategoryOption[];
  furniture_type?: string;
  room_options?: RoomOption[];
  selected_option?: RoomOption;
  amazon_products?: AmazonProduct[];
  furniture_items?: FurnitureItem[];
  budget_alert?: boolean;
  budget_alternatives?: AmazonProduct[];
  gemini_link?: string;
  gemini_prompt?: string;
}

interface RoomData {
  room_id: number;
  original_image: string | null;
  detected_image: string | null;
  object_counts: Record<string, number>;
  total_objects: number;
  is_empty_room: boolean;
  room_length: number;
  room_width: number;
  room_height: number;
  budget: number;
  used_amount?: number;
  remaining_budget?: number;
  is_over_budget?: boolean;
  furniture_state: FurnitureItem[];
  chat_history: ChatMessage[];
  generated_image: string | null;
  room_options?: RoomOption[];
  selected_room_type?: string;
  selected_bed_type?: string;
}

const ROOM_TYPE_OPTIONS = [
  { key: "master_bedroom", label: "Master Bedroom", icon: "👑", desc: "Grand king/queen bed, 4-door wardrobe & nightstands." },
  { key: "kids_bedroom", label: "Kids Bedroom", icon: "🧸", desc: "Modular bed / bunk bed, study desk & safe rounded furniture." },
  { key: "guest_bedroom", label: "Guest Bedroom", icon: "🛏️", desc: "Comfortable queen bed, compact wardrobe & luggage space." },
  { key: "living_room", label: "Living Room", icon: "🛋️", desc: "3-seater sofa / L-shape lounger, coffee table & TV media console." },
  { key: "dining_room", label: "Dining Room", icon: "🍽️", desc: "Contemporary solid wood dining set & accent buffet storage." },
  { key: "office", label: "Office / Study", icon: "💼", desc: "Ergonomic executive desk, mesh chair & organizer bookshelves." },
];

const ROOM_CATEGORY_SUGGESTIONS: Record<string, CategoryOption[]> = {
  master_bedroom: [
    { key: "bed", label: "Bed", icon: "🛏️", desc: "King / Queen storage beds & designer headboards" },
    { key: "wardrobe", label: "Wardrobe", icon: "🚪", desc: "3-Door / 4-Door wardrobes with mirrors & storage" },
    { key: "table", label: "Bedside Table", icon: "🪵", desc: "Solid wood & floating nightstands" },
    { key: "lamp", label: "Ambient Lamp", icon: "💡", desc: "Warm bedside & floor tripod lamps" },
    { key: "desk", label: "Study / Vanity Desk", icon: "💻", desc: "Compact workspace & organizer desks" },
    { key: "sofa", label: "Accent Seating", icon: "🛋️", desc: "Comfortable bedroom lounge seating" },
    { key: "tv", label: "TV Media Unit", icon: "📺", desc: "Wall mounted TV unit & consoles" },
    { key: "curtains", label: "Curtains & Rugs", icon: "🪟", desc: "Blackout drapes & plush geometric rugs" },
  ],
  kids_bedroom: [
    { key: "bed", label: "Kids / Bunk Bed", icon: "🧸", desc: "Single storage beds & modular bunk beds" },
    { key: "wardrobe", label: "Kids Wardrobe", icon: "🚪", desc: "Child-safe rounded multi-compartment closets" },
    { key: "desk", label: "Study Desk & Chair", icon: "💻", desc: "Ergonomic study tables with book racks" },
    { key: "lamp", label: "Night Lamp", icon: "💡", desc: "Soft ambient LED lamps & bedside lights" },
    { key: "decor", label: "Play Rug & Decor", icon: "🖼️", desc: "Vibrant soft rugs & wall shelving" },
  ],
  guest_bedroom: [
    { key: "bed", label: "Queen Bed", icon: "🛏️", desc: "Comfortable Queen beds with under-bed storage" },
    { key: "wardrobe", label: "2-Door Wardrobe", icon: "🚪", desc: "Compact wardrobe with luggage rack space" },
    { key: "table", label: "Nightstand", icon: "🪵", desc: "Bedside table with drawer" },
    { key: "lamp", label: "Bedside Lamp", icon: "💡", desc: "Soft reading light" },
    { key: "curtains", label: "Curtains", icon: "🪟", desc: "Privacy & blackout drapes" },
  ],
  living_room: [
    { key: "sofa", label: "Sofa / Lounger", icon: "🛋️", desc: "3-Seater sofas & L-shape sectional loungers" },
    { key: "table", label: "Coffee Table", icon: "🪵", desc: "Solid wood & glass center tables" },
    { key: "tv", label: "TV Media Unit", icon: "📺", desc: "Floating TV cabinets & entertainment consoles" },
    { key: "chair", label: "Accent Armchair", icon: "🪑", desc: "Velvet & ergonomic lounge armchairs" },
    { key: "lamp", label: "Tripod Floor Lamp", icon: "💡", desc: "Modern corner illumination" },
    { key: "curtains", label: "Curtains & Rugs", icon: "🪟", desc: "Living room area rugs & sheer curtains" },
  ],
  dining_room: [
    { key: "table", label: "Dining Table Set", icon: "🍽️", desc: "Solid Sheesham 4/6-seater dining sets" },
    { key: "chair", label: "Dining Chairs", icon: "🪑", desc: "Upholstered high-back dining chairs" },
    { key: "wardrobe", label: "Buffet Sideboard", icon: "🪵", desc: "Crockery storage & accent credenza" },
    { key: "lamp", label: "Pendant Light / Lamp", icon: "💡", desc: "Warm dining chandelier & lighting"},
    { key: "decor", label: "Area Rug", icon: "🖼️", desc: "Stain-resistant dining area rug" },
  ],
  office: [
    { key: "desk", label: "Executive Desk", icon: "💻", desc: "Large study workstation & cable management desk" },
    { key: "chair", label: "Ergonomic Chair", icon: "🪑", desc: "High-back mesh chair with lumbar support" },
    { key: "wardrobe", label: "Bookcase / Storage", icon: "🚪", desc: "Multi-tier file & book organizer" },
    { key: "lamp", label: "Task Lamp", icon: "💡", desc: "Focused LED desk reading lamp" },
    { key: "sofa", label: "Lounge Chair", icon: "🛋️", desc: "Comfortable visitor/reading chair" },
  ],
};

const BUDGET_PRESETS = [
  { label: "₹50,000", value: 50000, desc: "Essential Makeover" },
  { label: "₹1,00,000", value: 100000, desc: "Most Popular Suite" },
  { label: "₹2,00,000", value: 200000, desc: "Executive Luxury" },
  { label: "₹5,00,000", value: 500000, desc: "Ultra High-End Royal" },
];

const FURNITURE_CATEGORIES = [
  { key: "bed", label: "Beds", icon: "🛏️" },
  { key: "wardrobe", label: "Wardrobes", icon: "🚪" },
  { key: "sofa", label: "Sofas", icon: "🛋️" },
  { key: "table", label: "Tables", icon: "🪵" },
  { key: "chair", label: "Chairs", icon: "🪑" },
  { key: "desk", label: "Desks", icon: "💻" },
  { key: "lamp", label: "Lamps", icon: "💡" },
  { key: "tv", label: "TV Units", icon: "📺" },
  { key: "curtains", label: "Curtains", icon: "🪟" },
  { key: "decor", label: "Decor & Rugs", icon: "🖼️" },
];

export default function ChatPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLight } = useTheme();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [room, setRoom] = useState<RoomData | null>(null);
  const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string>("");

  // Budget tracking state
  const [totalBudget, setTotalBudget] = useState<number>(50000);
  const [usedBudget, setUsedBudget] = useState<number>(0);
  const [remainingBudget, setRemainingBudget] = useState<number>(50000);
  const [isOverBudget, setIsOverBudget] = useState<boolean>(false);

  // Active Category & Amazon Products Drawer
  const [activeCategory, setActiveCategory] = useState<string>("bed");
  const [categoryProducts, setCategoryProducts] = useState<AmazonProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);

  // Drag and Drop & Canvas interaction
  const [draggedProduct, setDraggedProduct] = useState<AmazonProduct | null>(null);
  const [isCanvasDragOver, setIsCanvasDragOver] = useState<boolean>(false);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);

  // Expanded concept preview
  const [expandedConceptId, setExpandedConceptId] = useState<number | null>(null);

  // New Room Modal / Setup
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [setupLength, setSetupLength] = useState("14");
  const [setupWidth, setSetupWidth] = useState("12");
  const [setupHeight, setSetupHeight] = useState("10");
  const [setupLoading, setSetupLoading] = useState(false);

  // Preview zoom modal
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

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

  // Load latest room on mount
  useEffect(() => {
    loadLatestRoom();
  }, []);

  // Fetch category products when activeCategory changes
  useEffect(() => {
    if (activeCategory) {
      fetchCategoryProducts(activeCategory);
    }
  }, [activeCategory]);

  const loadLatestRoom = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      const params = userId ? { user_id: userId } : {};
      const res = await api.get("/latest-room", { params });
      if (res.data.success) {
        const data = res.data as RoomData;
        setRoom(data);
        const items = data.furniture_state || [];
        setFurnitureItems(items);

        const b = data.budget || 50000;
        const used = items.reduce((acc, it) => acc + (it.price || 0), 0);
        setTotalBudget(b);
        setUsedBudget(used);
        setRemainingBudget(Math.max(0, b - used));
        setIsOverBudget(used > b);

        if (data.generated_image) {
          setGeneratedImage(
            data.generated_image.startsWith("http")
              ? data.generated_image
              : API_BASE + data.generated_image + "?t=" + Date.now()
          );
        } else {
          setGeneratedImage("");
        }

        const history = data.chat_history || [];
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Initialize direct welcome asking for Room Type
          const dims = `${data.room_length}×${data.room_width}×${data.room_height} ft`;
          const welcomeMsg: ChatMessage = {
            sender: "AI",
            text: `I've analyzed your room (${dims}). It appears to be an empty room. 🏡\n\n**What type of room would you like to create?**\nSelect or type your desired room type below:`,
            step: "ask_room_type",
          };
          setMessages([welcomeMsg]);
        }
      }
    } catch {
      // No room uploaded yet for this user -> reset to empty state and open setup modal
      setRoom(null);
      setFurnitureItems([]);
      setGeneratedImage("");
      setTotalBudget(50000);
      setUsedBudget(0);
      setRemainingBudget(50000);
      setIsOverBudget(false);
      setShowSetupModal(true);
      setMessages([
        {
          sender: "AI",
          text: "Welcome to AI Interior Designer! 🏡 Please enter your room dimensions or upload a photo to begin.",
          step: "ask_room_type",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryProducts = async (cat: string) => {
    try {
      setProductsLoading(true);
      const res = await api.get(`/chat/products?category=${cat}`);
      if (res.data.success) {
        setCategoryProducts(res.data.products || []);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Start new room design session
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
        await loadLatestRoom();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to initialize room session.");
    } finally {
      setSetupLoading(false);
    }
  };

  // Step 1 Click: Select Room Type -> asks "What would you like to add first?"
  const handleSelectRoomType = async (typeKey: string) => {
    const roomOption = ROOM_TYPE_OPTIONS.find((r) => r.key === typeKey);
    const label = roomOption ? roomOption.label : typeKey;

    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: `I want to create a ${label}.`,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      setSending(true);
      const res = await api.post("/chat", {
        message: label,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        const catOptions = res.data.category_options || ROOM_CATEGORY_SUGGESTIONS[typeKey] || ROOM_CATEGORY_SUGGESTIONS["master_bedroom"];
        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: res.data.message || `Great choice! 🏡 **${label}** selected for your space.\n\n**What would you like to add first?**\nSelect a furniture category below to view matching Amazon products and place them into your room:`,
            timestamp: new Date().toISOString(),
            step: "ask_first_item",
            room_type: typeKey,
            category_options: catOptions,
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: error.response?.data?.message || "Could not save room type. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Step 2 Click: Select Category (e.g. Bed, Wardrobe, Sofa, etc.)
  const handleSelectCategory = async (categoryKey: string, categoryLabel: string) => {
    setActiveCategory(categoryKey);
    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: `I want to add a ${categoryLabel}.`,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      setSending(true);
      const res = await api.post("/chat", {
        message: `Show ${categoryLabel}`,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        const prods = res.data.amazon_products || [];
        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: res.data.reply || `Here are verified Amazon **${categoryLabel}** options. Click **+ Place in Room** (or drag onto the canvas) to place it realistically in your room:`,
            timestamp: new Date().toISOString(),
            step: "show_category_products",
            amazon_products: prods,
            furniture_type: categoryKey,
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: error.response?.data?.message || `Could not load ${categoryLabel} products. Please try again.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Step 3 Click: Select Budget (Optional preset flow)
  const handleSelectBudget = async (budgetValue: number) => {
    setTotalBudget(budgetValue);
    setRemainingBudget(Math.max(0, budgetValue - usedBudget));

    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: `My budget is ₹${budgetValue.toLocaleString("en-IN")}.`,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      setSending(true);
      const res = await api.post("/chat", {
        message: `Budget is ${budgetValue}`,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        const options: RoomOption[] = res.data.room_options || [];
        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: res.data.message || `Generating design concepts with real Amazon products tailored to your ₹${budgetValue.toLocaleString("en-IN")} budget...`,
            timestamp: new Date().toISOString(),
            step: "show_options",
            room_options: options,
            gemini_link: res.data.gemini_link,
            gemini_prompt: res.data.gemini_prompt,
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: error.response?.data?.message || "Could not calculate options. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Step 4 Click: Select Specific Room Option (Initial Design)
  const handleSelectRoomOption = async (optionId: number) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: `I select Room Option ${optionId}.`,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      setSending(true);
      const res = await api.post("/chat/select-option", {
        option_id: optionId,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        if (res.data.generated_image) {
          setGeneratedImage(
            res.data.generated_image.startsWith("http")
              ? res.data.generated_image
              : API_BASE + res.data.generated_image + "?t=" + Date.now()
          );
        }
        if (res.data.furniture_items) {
          setFurnitureItems(res.data.furniture_items);
          const used = res.data.furniture_items.reduce((acc: number, it: FurnitureItem) => acc + (it.price || 0), 0);
          setUsedBudget(used);
          setRemainingBudget(Math.max(0, totalBudget - used));
          setIsOverBudget(used > totalBudget);
        }

        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: res.data.reply || `Option ${optionId} has been successfully applied to your room layout!`,
            timestamp: new Date().toISOString(),
            step: "room_selected",
            selected_option: res.data.selected_option,
            imageUrl: res.data.generated_image
              ? res.data.generated_image.startsWith("http")
                ? res.data.generated_image
                : API_BASE + res.data.generated_image
              : undefined,
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: error.response?.data?.message || "Could not select room option. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  // Add Real Amazon Product directly (One-by-One or Drag-and-Drop)
  const handleAddAmazonProduct = async (product: AmazonProduct, posX?: number, posY?: number) => {
    try {
      setSending(true);

      const res = await api.post("/chat/add-product", {
        product: product,
        asin: product.asin,
        pos_x: posX,
        pos_y: posY,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        if (res.data.generated_image) {
          setGeneratedImage(
            res.data.generated_image.startsWith("http")
              ? res.data.generated_image
              : API_BASE + res.data.generated_image + "?t=" + Date.now()
          );
        }
        setFurnitureItems(res.data.furniture_items || []);
        setUsedBudget(res.data.used_amount || 0);
        setRemainingBudget(res.data.remaining_budget || 0);
        setIsOverBudget(Boolean(res.data.is_over_budget));

        setMessages((prev) => [
          ...prev,
          {
            sender: "You",
            text: `Added Amazon Product: ${product.title} (₹${product.price.toLocaleString("en-IN")})`,
            timestamp: new Date().toISOString(),
          },
          {
            sender: "AI",
            text: res.data.reply,
            timestamp: new Date().toISOString(),
            step: (res.data.step as ChatMessage["step"]) || "ask_next_item",
            budget_alert: res.data.is_over_budget,
            budget_alternatives: res.data.budget_alternatives,
            furniture_items: res.data.furniture_items,
            category_options: res.data.category_options,
            imageUrl: res.data.generated_image
              ? res.data.generated_image.startsWith("http")
                ? res.data.generated_image
                : API_BASE + res.data.generated_image
              : undefined,
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to add Amazon product.");
    } finally {
      setSending(false);
    }
  };

  // Replace Item with New Amazon Product
  const handleReplaceItem = async (oldItemId: string, newProduct: AmazonProduct) => {
    try {
      setSending(true);
      const res = await api.post("/chat/replace-product", {
        old_item_id: oldItemId,
        new_product: newProduct,
        new_asin: newProduct.asin,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        if (res.data.generated_image) {
          setGeneratedImage(
            res.data.generated_image.startsWith("http")
              ? res.data.generated_image
              : API_BASE + res.data.generated_image + "?t=" + Date.now()
          );
        }
        setFurnitureItems(res.data.furniture_items || []);
        setUsedBudget(res.data.used_amount || 0);
        setRemainingBudget(res.data.remaining_budget || 0);
        setIsOverBudget(Boolean(res.data.is_over_budget));
        setReplacingItemId(null);

        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: res.data.reply,
            timestamp: new Date().toISOString(),
            imageUrl: res.data.generated_image
              ? res.data.generated_image.startsWith("http")
                ? res.data.generated_image
                : API_BASE + res.data.generated_image
              : undefined,
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to replace product.");
    } finally {
      setSending(false);
    }
  };

  // Remove Item
  const handleRemoveItem = async (itemId: string) => {
    try {
      setSending(true);
      const res = await api.post("/chat/remove-product", {
        item_id: itemId,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        if (res.data.generated_image) {
          setGeneratedImage(
            res.data.generated_image.startsWith("http")
              ? res.data.generated_image
              : API_BASE + res.data.generated_image + "?t=" + Date.now()
          );
        } else if (!res.data.furniture_items || res.data.furniture_items.length === 0) {
          setGeneratedImage("");
        }
        setFurnitureItems(res.data.furniture_items || []);
        setUsedBudget(res.data.used_amount || 0);
        setRemainingBudget(res.data.remaining_budget || 0);
        setIsOverBudget(Boolean(res.data.is_over_budget));

        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: res.data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || "Failed to remove product.");
    } finally {
      setSending(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, product: AmazonProduct) => {
    setDraggedProduct(product);
    e.dataTransfer.setData("application/json", JSON.stringify(product));
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragOver(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragOver(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCanvasDragOver(false);

    let product = draggedProduct;
    if (!product) {
      try {
        const raw = e.dataTransfer.getData("application/json");
        if (raw) product = JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }

    if (!product) return;

    // Calculate percentage drop coordinates relative to preview container
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(10, Math.min(90, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      const y = Math.max(10, Math.min(90, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
      handleAddAmazonProduct(product, x, y);
    } else {
      handleAddAmazonProduct(product);
    }
    setDraggedProduct(null);
  };

  // Send Custom User Message
  const sendUserMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || sending) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: textToSend,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      setSending(true);
      const res = await api.post("/chat", {
        message: textToSend,
        room_id: room?.room_id,
        user_id: getUserId(),
      });

      if (res.data.success) {
        if (res.data.generated_image) {
          setGeneratedImage(
            res.data.generated_image.startsWith("http")
              ? res.data.generated_image
              : API_BASE + res.data.generated_image + "?t=" + Date.now()
          );
        }
        if (res.data.furniture_items) {
          setFurnitureItems(res.data.furniture_items);
        }
        if (res.data.used_amount !== undefined) setUsedBudget(res.data.used_amount);
        if (res.data.remaining_budget !== undefined) setRemainingBudget(res.data.remaining_budget);
        if (res.data.is_over_budget !== undefined) setIsOverBudget(res.data.is_over_budget);

        setMessages((prev) => [
          ...prev,
          {
            sender: "AI",
            text: res.data.message || res.data.reply,
            timestamp: new Date().toISOString(),
            step: res.data.step || "custom",
            room_options: res.data.room_options,
            selected_option: res.data.selected_option,
            amazon_products: res.data.amazon_products,
            imageUrl: res.data.generated_image
              ? res.data.generated_image.startsWith("http")
                ? res.data.generated_image
                : API_BASE + res.data.generated_image
              : undefined,
            gemini_link: res.data.gemini_link,
            gemini_prompt: res.data.gemini_prompt,
          },
        ]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setMessages((prev) => [
        ...prev,
        {
          sender: "AI",
          text: error.response?.data?.message || "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isLight ? "bg-[#F8F9FA] text-slate-800" : "bg-slate-950 text-slate-100"
      }`}
    >
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />

        <main
          className={`flex-1 transition-all duration-300 p-4 md:p-6 flex flex-col ${
            sidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          {/* Top Bar Header & Dynamic Budget Tracker */}
          <div
            className={`border rounded-2xl p-4 mb-4 shadow-xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-md ${
              isLight
                ? "bg-white/95 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                : "bg-slate-900/90 border-slate-800/80"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white shadow-lg">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-xl font-extrabold tracking-tight ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                    AI Interior Designer & Amazon Furniture Studio
                  </h1>
                  <span className="bg-amber-500/10 text-amber-600 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-500/20 flex items-center gap-1">
                    <FiShoppingBag className="text-xs" /> Amazon Live Products
                  </span>
                </div>
                {room ? (
                  <p className={`text-xs mt-0.5 flex items-center gap-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    <span>
                      Room: <strong className={isLight ? "text-slate-700" : "text-slate-200"}>{room.room_length}×{room.room_width}×{room.room_height} ft</strong>
                    </span>
                    <span>•</span>
                    <span>{room.is_empty_room ? "Empty Room Canvas" : "YOLO Architecture Preserved"}</span>
                  </p>
                ) : (
                  <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Configure your room dimensions or photo to start
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Budget Tracker Bar */}
            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-inner">
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Allocated Budget</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">₹{totalBudget.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Used</span>
                <span className="font-bold text-indigo-600 font-mono">₹{usedBudget.toLocaleString("en-IN")}</span>
              </div>
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-700" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Remaining</span>
                <span className={`font-bold font-mono ${isOverBudget ? "text-rose-500" : "text-emerald-500"}`}>
                  ₹{remainingBudget.toLocaleString("en-IN")}
                </span>
              </div>

              <button
                onClick={() => setShowSetupModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer ml-2"
              >
                <FiPlus className="text-xs" /> New Room
              </button>
            </div>
          </div>

          {/* Over-Budget Alert Banner if Exceeded */}
          {isOverBudget && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm">
              <div className="flex items-center gap-2 font-medium">
                <FiAlertTriangle className="text-base text-rose-500 flex-shrink-0" />
                <span>
                  <strong>Budget Alert:</strong> Your selected products total (₹{usedBudget.toLocaleString("en-IN")}) exceeds your allocated budget of ₹{totalBudget.toLocaleString("en-IN")}.
                </span>
              </div>
              <span className="text-[11px] font-semibold bg-rose-500/20 px-2 py-0.5 rounded">
                Over by ₹{(usedBudget - totalBudget).toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Main Grid: Chat Area + Dynamic Side Preview & Amazon Products Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Left: Chat Container */}
            <div
              className={`lg:col-span-7 flex flex-col border rounded-2xl backdrop-blur-md overflow-hidden shadow-2xl h-[calc(100vh-14rem)] ${
                isLight ? "bg-white/95 border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.05)]" : "bg-slate-900/70 border-slate-800/80"
              }`}
            >
              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                    <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm">Loading AI Interior Designer...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={`text-center py-12 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    <p>No messages yet. Select room type or budget to start designing!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}
                    >
                      {/* Sender label */}
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className={`text-xs font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                          {msg.sender === "You" ? "You" : "🤖 AI Interior Designer"}
                        </span>
                        {msg.timestamp && (
                          <span className={`text-[10px] ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl p-4 max-w-[95%] md:max-w-[92%] text-sm leading-relaxed shadow-md ${
                          msg.sender === "You"
                            ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none"
                            : isLight
                            ? "bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
                            : "bg-slate-800/95 text-slate-200 border border-slate-700/60 rounded-bl-none"
                        }`}
                      >
                        {/* Text formatting with line breaks & markdown links */}
                        <div className="whitespace-pre-line space-y-2">{msg.text}</div>

                        {/* Interactive Step 1: Room Type Selector Cards */}
                        {msg.step === "ask_room_type" && (
                          <div className={`mt-4 pt-3 border-t ${isLight ? "border-slate-200" : "border-slate-700/60"}`}>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2.5">
                              🏡 Select Room Type:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {ROOM_TYPE_OPTIONS.map((opt) => (
                                <button
                                  key={opt.key}
                                  onClick={() => handleSelectRoomType(opt.key)}
                                  className={`rounded-xl p-3 text-left transition flex flex-col justify-between group cursor-pointer shadow-sm border ${
                                    isLight
                                      ? "bg-white hover:bg-indigo-50/80 border-slate-200 hover:border-indigo-300"
                                      : "bg-slate-900/80 hover:bg-indigo-950/60 border-slate-700/60 hover:border-indigo-500/80"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xl">{opt.icon}</span>
                                    <span className="text-[10px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                                      Select
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className={`font-bold text-xs transition ${isLight ? "text-slate-800 group-hover:text-indigo-600" : "text-slate-100 group-hover:text-indigo-300"}`}>
                                      {opt.label}
                                    </h4>
                                    <p className={`text-[10px] mt-1 line-clamp-2 leading-tight ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                                      {opt.desc}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Step: "What would you like to add first / next?" Category Cards */}
                        {(msg.step === "ask_first_item" || msg.step === "ask_next_item" || msg.step === "item_added" || (msg.category_options && msg.category_options.length > 0)) && (
                          <div className={`mt-4 pt-3 border-t ${isLight ? "border-slate-200" : "border-slate-700/60"}`}>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <span>✨</span>
                              <span>{msg.step === "ask_first_item" ? "What would you like to add first?" : "What would you like to add next?"}</span>
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {(msg.category_options || ROOM_CATEGORY_SUGGESTIONS[msg.room_type || "master_bedroom"] || ROOM_CATEGORY_SUGGESTIONS["master_bedroom"]).map((cat) => (
                                <button
                                  key={cat.key}
                                  onClick={() => handleSelectCategory(cat.key, cat.label)}
                                  className={`rounded-xl p-2.5 text-left transition flex flex-col justify-between group cursor-pointer shadow-sm border ${
                                    isLight
                                      ? "bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-400"
                                      : "bg-slate-900/90 hover:bg-indigo-950/60 border-slate-700 hover:border-indigo-500"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-lg">{cat.icon}</span>
                                    <span className="text-[9px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded font-bold">
                                      + Add
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className={`font-bold text-xs ${isLight ? "text-slate-800 group-hover:text-indigo-600" : "text-slate-100 group-hover:text-indigo-300"}`}>
                                      {cat.label}
                                    </h4>
                                    {cat.desc && (
                                      <p className={`text-[9px] mt-0.5 line-clamp-1 ${isLight ? "text-slate-400" : "text-slate-400"}`}>
                                        {cat.desc}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Step 2: Budget Selector Chips */}
                        {msg.step === "ask_budget" && (
                          <div className={`mt-4 pt-3 border-t ${isLight ? "border-slate-200" : "border-slate-700/60"}`}>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                              💰 Select Furnishing Budget:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {BUDGET_PRESETS.map((b) => (
                                <button
                                  key={b.value}
                                  onClick={() => handleSelectBudget(b.value)}
                                  className={`rounded-xl px-3 py-2 text-left transition group cursor-pointer border ${
                                    isLight
                                      ? "bg-white hover:bg-emerald-50 border-slate-200 hover:border-emerald-300"
                                      : "bg-slate-900/80 hover:bg-emerald-950/60 border-slate-700/60 hover:border-emerald-500/80"
                                  }`}
                                >
                                  <span className={`font-bold text-xs block ${isLight ? "text-slate-800 group-hover:text-emerald-600" : "text-slate-100 group-hover:text-emerald-300"}`}>
                                    {b.label}
                                  </span>
                                  <span className={`text-[10px] block ${isLight ? "text-slate-500" : "text-slate-400"}`}>{b.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interactive Step 3: Complete Room Design Concepts with Real Amazon Products & Concept Renders */}
                        {msg.room_options && msg.room_options.length > 0 && (
                          <div className={`mt-4 pt-3 border-t space-y-4 ${isLight ? "border-slate-200" : "border-slate-700/60"}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                <FiGrid /> 3 Amazon-Powered Complete Room Concepts:
                              </p>
                              {msg.gemini_link && (
                                <a
                                  href={msg.gemini_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 border border-purple-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition font-medium"
                                >
                                  ✨ Open in Gemini <FiExternalLink className="text-[10px]" />
                                </a>
                              )}
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                              {msg.room_options.map((opt) => {
                                const renderSrc = opt.image_path
                                  ? (opt.image_path.startsWith("http") ? opt.image_path : API_BASE + opt.image_path)
                                  : (opt.amazon_products && opt.amazon_products[0]?.image_url) || (opt.furniture_items && opt.furniture_items[0]?.image_url) || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800";

                                return (
                                  <div
                                    key={opt.option_id}
                                    className={`rounded-xl overflow-hidden shadow-lg transition flex flex-col justify-between group border ${
                                      isLight
                                        ? "bg-white border-slate-200 hover:border-indigo-400"
                                        : "bg-slate-900/95 border-slate-700/80 hover:border-indigo-500/80"
                                    }`}
                                  >
                                    {/* 1. Large Generated Room Render Image Preview */}
                                    <div className="relative aspect-video bg-black/20 overflow-hidden cursor-pointer group/img">
                                      <img
                                        src={renderSrc}
                                        alt={opt.title}
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800";
                                        }}
                                        className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                                        onClick={() => setPreviewZoomImage(renderSrc)}
                                      />
                                      <span className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                        Concept {opt.option_id}
                                      </span>
                                      <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                        ₹{opt.total_price.toLocaleString("en-IN")}
                                      </span>
                                    </div>

                                    {/* 2. Info & Included Amazon Products */}
                                    <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                                      <div>
                                        <h4 className={`font-bold text-xs line-clamp-1 ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                                          {opt.title}
                                        </h4>
                                        <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                                          Theme: <strong className="capitalize">{opt.style}</strong>
                                        </p>
                                      </div>

                                      {/* Itemized Amazon Products List with Working Images & Exact Amazon Links */}
                                      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                          <span>Included Amazon Items ({opt.furniture_items.length}):</span>
                                        </p>

                                        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                          {opt.furniture_items.map((it, pIdx) => {
                                            const directAmazonUrl = it.amazon_url || (it.asin ? `https://www.amazon.in/dp/${it.asin}` : `https://www.amazon.in/s?k=${encodeURIComponent(it.label)}`);
                                            const itemImg = it.image_url || "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200";

                                            return (
                                              <div
                                                key={pIdx}
                                                className="flex items-center justify-between gap-2 p-1 rounded bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-[11px]"
                                              >
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <img
                                                    src={itemImg}
                                                    alt={it.label}
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => {
                                                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200";
                                                    }}
                                                    className="w-6 h-6 rounded object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                                                  />
                                                  <span className="truncate font-medium">{it.label}</span>
                                                </div>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                  <span className="font-mono text-emerald-600 font-semibold text-[10px]">
                                                    ₹{(it.price || 0).toLocaleString("en-IN")}
                                                  </span>
                                                  <a
                                                    href={directAmazonUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center text-[10px] p-0.5"
                                                    title={`Open ${it.label} on Amazon`}
                                                  >
                                                    <FiExternalLink className="text-[9px]" />
                                                  </a>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Action button */}
                                      <div className="pt-2">
                                        <button
                                          onClick={() => handleSelectRoomOption(opt.option_id)}
                                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                          <FiCheck className="text-xs" /> Apply Concept {opt.option_id}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Interactive Step 4: Recommended Amazon Products Carousel inside chat */}
                        {msg.amazon_products && msg.amazon_products.length > 0 && (
                          <div className={`mt-4 pt-3 border-t space-y-3 ${isLight ? "border-slate-200" : "border-slate-700/60"}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                <FiShoppingBag /> Amazon Product Matches ({msg.amazon_products.length}):
                              </p>
                              <span className="text-[10px] text-slate-400">Drag card into room canvas or click Add</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {msg.amazon_products.map((p) => {
                                const directUrl = p.amazon_url || (p.asin ? `https://www.amazon.in/dp/${p.asin}` : `https://www.amazon.in/s?k=${encodeURIComponent(p.title)}`);

                                return (
                                  <div
                                    key={p.asin}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, p)}
                                    className={`border rounded-xl p-3 flex flex-col justify-between transition group shadow-sm cursor-grab active:cursor-grabbing ${
                                      isLight
                                        ? "bg-white border-slate-200 hover:border-indigo-400"
                                        : "bg-slate-900/90 border-slate-700 hover:border-indigo-500"
                                    }`}
                                  >
                                    <div>
                                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-white mb-2 relative flex items-center justify-center border border-slate-100">
                                        <img
                                          src={p.image_url}
                                          alt={p.title}
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400";
                                          }}
                                          className="max-h-full max-w-full object-contain"
                                        />
                                        <span className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                          ⭐ {p.rating || 4.3}
                                        </span>
                                      </div>
                                      <h5 className={`font-bold text-xs line-clamp-2 leading-tight ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                                        {p.title}
                                      </h5>
                                      <p className="text-emerald-600 font-mono font-bold text-xs mt-1">
                                        ₹{p.price.toLocaleString("en-IN")}
                                      </p>
                                      <p className={`text-[10px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                                        Size: {p.dimensions.width_ft}×{p.dimensions.length_ft} ft
                                      </p>
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleAddAmazonProduct(p)}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold py-1.5 rounded-lg transition cursor-pointer shadow-sm text-center"
                                      >
                                        + Add to Room
                                      </button>
                                      <a
                                        href={directUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition flex items-center justify-center gap-1 text-[11px] font-medium"
                                        title="Open exact product page on Amazon"
                                      >
                                        <span>Amazon</span> <FiExternalLink className="text-[10px]" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Interactive Budget Alternatives (when over budget) */}
                        {msg.budget_alternatives && msg.budget_alternatives.length > 0 && (
                          <div className={`mt-3 pt-3 border-t border-rose-500/20 space-y-2`}>
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                              💡 3 Cheaper Amazon Alternatives Within Budget:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {msg.budget_alternatives.map((alt) => {
                                const directUrl = alt.amazon_url || (alt.asin ? `https://www.amazon.in/dp/${alt.asin}` : `https://www.amazon.in/s?k=${encodeURIComponent(alt.title)}`);

                                return (
                                  <div
                                    key={alt.asin}
                                    className="border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-xl flex flex-col justify-between"
                                  >
                                    <div>
                                      <p className="font-bold text-[11px] line-clamp-1">{alt.title}</p>
                                      <p className="text-emerald-600 font-mono font-bold text-xs mt-0.5">
                                        ₹{alt.price.toLocaleString("en-IN")}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex gap-1">
                                      <button
                                        onClick={() => handleAddAmazonProduct(alt)}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold py-1 rounded transition cursor-pointer"
                                      >
                                        Choose Alternative
                                      </button>
                                      <a
                                        href={directUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded border border-emerald-600/40 text-emerald-700 dark:text-emerald-300"
                                        title="View exact product on Amazon"
                                      >
                                        <FiExternalLink className="text-[10px]" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Image Preview inside message */}
                        {msg.imageUrl && (
                          <div className={`mt-3 rounded-xl overflow-hidden border shadow-md ${isLight ? "border-slate-200" : "border-slate-700/80"}`}>
                            <img
                              src={msg.imageUrl.startsWith("http") ? msg.imageUrl : API_BASE + msg.imageUrl}
                              alt="Generated Room"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800";
                              }}
                              className="w-full object-cover cursor-pointer hover:opacity-95 transition"
                              onClick={() => setPreviewZoomImage(msg.imageUrl!.startsWith("http") ? msg.imageUrl! : API_BASE + msg.imageUrl!)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {sending && (
                  <div className="flex items-center gap-2 text-xs text-indigo-600 animate-pulse px-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    AI is searching Amazon product inventory and analyzing room dimensions...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className={`p-4 border-t ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-900 border-slate-800/80"}`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    placeholder="Ask for furniture (e.g. 'Show Queen Beds under ₹20,000', 'Add a study desk', 'Change bed')..."
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className={`flex-1 border rounded-xl px-4 py-3 text-sm transition outline-none disabled:opacity-50 ${
                      isLight
                        ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500"
                        : "bg-slate-950 border-slate-700/80 text-slate-100 placeholder-slate-500 focus:border-indigo-500"
                    }`}
                  />
                  <button
                    onClick={() => sendUserMessage()}
                    disabled={sending || input.trim() === ""}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 rounded-xl transition flex items-center justify-center disabled:opacity-40 cursor-pointer shadow-md"
                  >
                    <FiSend className="text-base" />
                  </button>
                </div>

                {/* Quick Add Item Category Chips */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    Quick Add:
                  </span>
                  {[
                    { key: "bed", label: "Bed", icon: "🛏️" },
                    { key: "wardrobe", label: "Wardrobe", icon: "🚪" },
                    { key: "table", label: "Bedside Table", icon: "🪵" },
                    { key: "lamp", label: "Lamp", icon: "💡" },
                    { key: "desk", label: "Study Desk", icon: "💻" },
                    { key: "sofa", label: "Sofa", icon: "🛋️" },
                    { key: "tv", label: "TV Unit", icon: "📺" },
                    { key: "curtains", label: "Curtains", icon: "🪟" },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleSelectCategory(cat.key, cat.label)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        isLight
                          ? "bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300"
                          : "bg-slate-800/80 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border-slate-700/50 hover:border-indigo-500/60"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>+ {cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Room Canvas, Selected Products Tray & Amazon Catalog */}
            <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1 scrollbar-thin">
              {/* 1. Interactive Room Canvas (Drag-and-Drop Dropzone & Placed Overlays) */}
              <div
                className={`border rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col transition-all ${
                  isCanvasDragOver
                    ? "border-indigo-500 ring-4 ring-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/40"
                    : isLight
                    ? "bg-white/95 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                    : "bg-slate-900/70 border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    🖼️ Room Preview Canvas ({furnitureItems.length} Placed)
                  </h3>
                  <div className="flex items-center gap-2">
                    {generatedImage && (
                      <button
                        onClick={() => setPreviewZoomImage(generatedImage)}
                        className={`text-xs flex items-center gap-1 cursor-pointer ${
                          isLight ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <FiMaximize2 /> Zoom
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropzone Canvas */}
                <div
                  ref={canvasRef}
                  onDragOver={handleCanvasDragOver}
                  onDragLeave={handleCanvasDragLeave}
                  onDrop={handleCanvasDrop}
                  className={`aspect-video rounded-xl overflow-hidden border flex items-center justify-center relative shadow-inner select-none ${
                    isCanvasDragOver ? "border-indigo-500 border-dashed" : isLight ? "bg-slate-100 border-slate-200" : "bg-slate-950 border-slate-800"
                  }`}
                >
                  {generatedImage ? (
                    <img
                      src={generatedImage}
                      alt="Room Design"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : room?.original_image ? (
                    <img
                      src={
                        room.original_image.startsWith("http")
                          ? room.original_image
                          : API_BASE + room.original_image
                      }
                      alt="Original Room"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <FiGrid className="text-3xl mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">Drag & Drop Amazon Furniture Here</p>
                    </div>
                  )}

                  {/* Interactive Placed Furniture Markers / Overlays on Canvas */}
                  {furnitureItems.map((item, idx) => {
                    const posX = item.pos_x ?? (idx === 0 ? 50 : idx === 1 ? 80 : idx === 2 ? 20 : 50 + (idx % 2 === 0 ? 25 : -25));
                    const posY = item.pos_y ?? (idx === 0 ? 60 : idx === 1 ? 35 : idx === 2 ? 75 : 40 + (idx * 10) % 40);

                    return (
                      <div
                        key={item.id}
                        style={{ left: `${posX}%`, top: `${posY}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer animate-in fade-in zoom-in-75 duration-200"
                      >
                        {/* Interactive Marker Pin */}
                        <div className="flex items-center gap-1.5 bg-slate-900/90 text-white p-1 rounded-lg shadow-2xl border border-indigo-500/80 backdrop-blur-sm group-hover:scale-110 transition">
                          <img
                            src={item.image_url || "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=100"}
                            alt={item.label}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=100";
                            }}
                            className="w-5 h-5 rounded object-cover flex-shrink-0"
                          />
                          <span className="text-[9px] font-bold font-mono text-emerald-400">
                            ₹{(item.price || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Hover Tooltip Card */}
                        <div className="hidden group-hover:flex flex-col absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-950/95 text-white p-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs z-30 pointer-events-auto">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-[11px] truncate">{item.label}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(item.id);
                              }}
                              className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                              title="Remove item"
                            >
                              <FiTrash2 className="text-[10px]" />
                            </button>
                          </div>
                          <p className="text-[10px] text-emerald-400 font-mono font-bold">
                            ₹{(item.price || 0).toLocaleString("en-IN")}
                          </p>
                          {item.amazon_url && (
                            <a
                              href={item.amazon_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 transition"
                            >
                              Buy on Amazon <FiExternalLink className="text-[9px]" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Drag drop hint banner overlay */}
                  {isCanvasDragOver && (
                    <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-xs flex items-center justify-center text-white font-bold text-sm border-2 border-dashed border-white pointer-events-none z-30">
                      ➕ Drop Amazon Item into Room
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                {generatedImage && (
                  <div className="mt-2.5 flex gap-2">
                    <a
                      href={generatedImage}
                      download={`room_design_${room?.room_id || 1}.png`}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg border flex items-center justify-center gap-1.5 transition ${
                        isLight
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                      }`}
                    >
                      <FiDownload /> Download Design
                    </a>
                    <button
                      onClick={() => router.push("/designs")}
                      className={`text-xs font-semibold px-3 py-2 rounded-lg transition border cursor-pointer ${
                        isLight
                          ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/40"
                      }`}
                    >
                      My Designs
                    </button>
                  </div>
                )}
              </div>

              {/* 2. DEDICATED SECTION: Selected Products in Room & Amazon Purchase Links (Display below Room Image) */}
              <div
                className={`border rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col ${
                  isLight ? "bg-white/95 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]" : "bg-slate-900/70 border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-3 border-b pb-2.5 dark:border-slate-800">
                  <div>
                    <h3 className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                      🛍️ Selected Amazon Products in This Room ({furnitureItems.length})
                    </h3>
                    <p className={`text-[10px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Click direct Amazon link to purchase exact matching furniture
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cart</span>
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      ₹{usedBudget.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Selected Products Grid / Cards */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {furnitureItems.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-xl dark:border-slate-800 text-slate-400 space-y-1">
                      <FiShoppingBag className="text-2xl mx-auto opacity-40 mb-1" />
                      <p className="text-xs font-medium">No Amazon furniture selected yet.</p>
                      <p className="text-[10px]">Select any product from the catalog below or drag onto the room canvas!</p>
                    </div>
                  ) : (
                    furnitureItems.map((item) => {
                      const directUrl = item.amazon_url || (item.asin ? `https://www.amazon.in/dp/${item.asin}` : `https://www.amazon.in/s?k=${encodeURIComponent(item.label)}`);

                      return (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition group shadow-sm ${
                            isLight
                              ? "bg-slate-50/80 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20"
                              : "bg-slate-950/80 border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/20"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Product Photo with Zoom on Click */}
                            <div
                              onClick={() => setPreviewZoomImage(item.image_url || "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800")}
                              className="w-14 h-14 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer relative group/thumb"
                            >
                              <img
                                src={item.image_url || "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200"}
                                alt={item.label}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200";
                                }}
                                className="max-h-full max-w-full object-contain group-hover/thumb:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition">
                                <FiEye className="text-xs" />
                              </div>
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <h5 className={`font-bold text-xs line-clamp-1 ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                                {item.label}
                              </h5>
                              <p className={`text-[10px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                                Size: {item.width_ft}×{item.length_ft} ft {item.height_ft ? `× ${item.height_ft} ft` : ""} · ⭐ {item.rating || 4.3}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-emerald-600 font-bold text-xs">
                                  ₹{(item.price || 0).toLocaleString("en-IN")}
                                </span>
                                {item.asin && (
                                  <span className="text-[9px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded">
                                    ASIN: {item.asin}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons & Direct Amazon Purchase Link */}
                          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                            <a
                              href={directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1 text-center cursor-pointer"
                              title="Buy this exact product on Amazon India"
                            >
                              <span>Buy on Amazon</span> <FiExternalLink className="text-[10px]" />
                            </a>

                            <button
                              onClick={() => {
                                setReplacingItemId(item.id);
                                setActiveCategory(item.name || "bed");
                              }}
                              className="text-amber-500 hover:text-amber-600 p-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 transition cursor-pointer"
                              title="Replace with alternative product"
                            >
                              <FiRefreshCw className="text-xs" />
                            </button>

                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 transition cursor-pointer"
                              title="Remove item from room"
                            >
                              <FiTrash2 className="text-xs" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. Amazon Product Selector Drawer (One-by-One Furniture Customization) */}
              <div
                className={`border rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-col justify-between overflow-hidden ${
                  isLight ? "bg-white/95 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)]" : "bg-slate-900/70 border-slate-800/80"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                      🛒 Amazon Furniture Catalog
                    </h3>
                    <span className="text-[10px] text-slate-400">Drag item into room or click + Add</span>
                  </div>

                  {/* Category Pills Selector */}
                  <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-thin">
                    {FURNITURE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 border ${
                          activeCategory === cat.key
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : isLight
                            ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Scrollable Amazon Products List */}
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {productsLoading ? (
                      <div className="py-8 text-center text-xs text-slate-400">Loading Amazon products...</div>
                    ) : categoryProducts.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">No products found in this category.</div>
                    ) : (
                      categoryProducts.map((p) => (
                        <div
                          key={p.asin}
                          draggable
                          onDragStart={(e) => handleDragStart(e, p)}
                          className={`border rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs transition group cursor-grab active:cursor-grabbing ${
                            isLight
                              ? "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                              : "bg-slate-950/80 border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-950/20"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                            <img
                              src={p.image_url}
                              alt={p.title}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200";
                              }}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className={`font-semibold line-clamp-1 ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                              {p.title}
                            </h5>
                            <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                              {p.dimensions.width_ft}×{p.dimensions.length_ft} ft · ⭐ {p.rating || 4.3}
                            </p>
                            <span className="font-mono text-emerald-600 font-bold text-xs">
                              ₹{p.price.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {replacingItemId ? (
                              <button
                                onClick={() => handleReplaceItem(replacingItemId, p)}
                                className="bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                              >
                                Replace
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddAmazonProduct(p)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded transition cursor-pointer shadow-sm"
                              >
                                + Add
                              </button>
                            )}
                            <a
                              href={p.amazon_url || (p.asin ? `https://www.amazon.in/dp/${p.asin}` : `https://www.amazon.in/s?k=${encodeURIComponent(p.title)}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 transition"
                              title="View exact product on Amazon"
                            >
                              <FiExternalLink className="text-[10px]" />
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Modal: Room Dimensions & Optional Photo */}
          {showSetupModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div
                className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 ${
                  isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
                }`}
              >
                <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-slate-200" : "border-slate-800"}`}>
                  <div>
                    <h3 className={`text-lg font-bold flex items-center gap-2 ${isLight ? "text-slate-800" : "text-slate-100"}`}>
                      Start New Room Design
                    </h3>
                    <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      Upload a photo or enter room dimensions to begin AI design
                    </p>
                  </div>
                  {room && (
                    <button
                      onClick={() => setShowSetupModal(false)}
                      className={`text-lg cursor-pointer ${isLight ? "text-slate-400 hover:text-slate-800" : "text-slate-400 hover:text-slate-100"}`}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Room Dimensions Inputs */}
                <div className="space-y-3">
                  <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    Room Dimensions (Feet)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <span className={`text-[11px] block mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>Length (ft)</span>
                      <input
                        type="number"
                        min="6"
                        step="0.5"
                        value={setupLength}
                        onChange={(e) => setSetupLength(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-sm outline-none transition ${
                          isLight
                            ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                            : "bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-500"
                        }`}
                        placeholder="14"
                      />
                    </div>
                    <div>
                      <span className={`text-[11px] block mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>Width (ft)</span>
                      <input
                        type="number"
                        min="6"
                        step="0.5"
                        value={setupWidth}
                        onChange={(e) => setSetupWidth(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-sm outline-none transition ${
                          isLight
                            ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                            : "bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-500"
                        }`}
                        placeholder="12"
                      />
                    </div>
                    <div>
                      <span className={`text-[11px] block mb-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>Height (ft)</span>
                      <input
                        type="number"
                        min="6"
                        step="0.5"
                        value={setupHeight}
                        onChange={(e) => setSetupHeight(e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-sm outline-none transition ${
                          isLight
                            ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                            : "bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-500"
                        }`}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Room Photo Upload */}
                <div className="space-y-2">
                  <label className={`text-xs font-semibold uppercase tracking-wider block ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    Room Photo (Optional)
                  </label>
                  <label
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                      isLight
                        ? "border-slate-300 hover:border-indigo-500 bg-slate-50"
                        : "border-slate-700 hover:border-indigo-500/80 bg-slate-950/40"
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
                    <FiUploadCloud className="text-2xl text-indigo-500 mb-1.5" />
                    <span className={`text-xs font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                      {uploadFile ? uploadFile.name : "Click to browse or drop empty room photo"}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      Leave empty to start directly with 3D perspective modeling
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
                        className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded"
                      >
                        Remove Photo
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {room && (
                    <button
                      onClick={() => setShowSetupModal(false)}
                      className={`flex-1 font-semibold py-3 rounded-xl text-sm transition cursor-pointer border ${
                        isLight
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                      }`}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleStartNewSession}
                    disabled={setupLoading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl text-sm transition shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {setupLoading ? "Initializing..." : "Start AI Chat Session →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fullscreen Zoom Image Modal */}
          {previewZoomImage && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setPreviewZoomImage(null)}
            >
              <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
                <img
                  src={previewZoomImage}
                  alt="Zoom Preview"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-700"
                />
                <p className="text-xs text-slate-400 mt-2">Click anywhere to close preview</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}