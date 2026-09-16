import api from "./api";

export interface DatasetFurnitureItem {
  id: string;
  category: string;
  name: string;
  label: string;
  budgetBracket: "buget_10k" | "buget_10k_to_20k" | "buget_20k_to_30k" | "buget_30k_to_40k";
  budgetLabel: string;
  price: number;
  image_url: string;
  extracted_image_url?: string;
  dimensions: {
    length_ft: number;
    width_ft: number;
    height_ft?: number;
  };
  material?: string;
  description?: string;
}


export interface FurnitureCategory {
  key: string;
  label: string;
  icon: string;
  suggestedPlacements: string[];
  description: string;
}

export const DATASET_CATEGORIES: FurnitureCategory[] = [
  {
    key: "bed",
    label: "Bed",
    icon: "🛏️",
    suggestedPlacements: ["Center Wall", "Master Bedroom Focus"],
    description: "Solid wood, platform, and upholstered designer beds from the dataset",
  },
  {
    key: "lamp",
    label: "Night Lamp",
    icon: "💡",
    suggestedPlacements: ["Bedside Corner", "Reading Corner"],
    description: "Warm ambient and bedside lighting fixtures",
  },
  {
    key: "table",
    label: "Side Table",
    icon: "🪵",
    suggestedPlacements: ["Left Bedside", "Right Bedside"],
    description: "Compact solid wood and contemporary nightstands",
  },
  {
    key: "chair",
    label: "Accent Chair",
    icon: "🪑",
    suggestedPlacements: ["Reading Nook", "Bedroom Corner"],
    description: "Comfortable bedroom seating and lounge armchairs",
  },
  {
    key: "wardrobe",
    label: "Wardrobe",
    icon: "🚪",
    suggestedPlacements: ["Side Wall", "Dressing Perimeter"],
    description: "2-Door and 3-Door storage wardrobes",
  },
  {
    key: "desk",
    label: "Study Desk",
    icon: "💻",
    suggestedPlacements: ["Window Wall", "Study Corner"],
    description: "Ergonomic workstations and compact study tables",
  },
];

export const BUDGET_TIERS = [
  { key: "buget_10k", label: "Under ₹10,000", min: 0, max: 10000, desc: "Budget Friendly" },
  { key: "buget_10k_to_20k", label: "₹10,000 - ₹20,000", min: 10000, max: 20000, desc: "Popular Essential" },
  { key: "buget_20k_to_30k", label: "₹20,000 - ₹30,000", min: 20000, max: 30000, desc: "Premium Comfort" },
  { key: "buget_30k_to_40k", label: "₹30,000 - ₹40,000+", min: 30000, max: 1000000, desc: "Luxury Suite" },
];

export const REAL_FURNITURE_DATASET: DatasetFurnitureItem[] = [
  // ==========================================
  // BEDS - FROM furniture_dataset/bed/buget_10k
  // ==========================================
  {
    id: "bed_10k_1",
    category: "bed",
    name: "bed",
    label: "Minimalist Modern Platform Bed",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 8500,
    image_url: "/furniture_dataset/bed/buget_10k/bed1.jpeg",
    dimensions: { length_ft: 6.5, width_ft: 5.0, height_ft: 2.8 },
    material: "Engineered Wood",
    description: "Sleek low-profile platform bed with minimalist aesthetic and sturdy frame.",
  },
  {
    id: "bed_10k_2",
    category: "bed",
    name: "bed",
    label: "Contemporary Oak Single / Double Bed",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 9800,
    image_url: "/furniture_dataset/bed/buget_10k/bed2.jpg",
    dimensions: { length_ft: 6.5, width_ft: 4.5, height_ft: 3.0 },
    material: "Natural Wood Grain Finish",
    description: "Compact, durable bed designed for space-conscious modern bedrooms.",
  },

  // ==================================================
  // BEDS - FROM furniture_dataset/bed/buget_10k_to_20k
  // ==================================================
  {
    id: "bed_20k_1",
    category: "bed",
    name: "bed",
    label: "Nordic Upholstered Queen Bed",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 14500,
    image_url: "/furniture_dataset/bed/buget_10k_to_20k/bed3.jpg",
    dimensions: { length_ft: 6.5, width_ft: 5.5, height_ft: 3.4 },
    material: "Soft Grey Linen Fabric",
    description: "Padded headboard queen bed offering relaxed ergonomic comfort and modern style.",
  },
  {
    id: "bed_20k_2",
    category: "bed",
    name: "bed",
    label: "Urban Loft Designer Bed",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 16900,
    image_url: "/furniture_dataset/bed/buget_10k_to_20k/bed4.jpg",
    dimensions: { length_ft: 6.6, width_ft: 5.5, height_ft: 3.5 },
    material: "Solid Teak & Engineered Wood",
    description: "Clean geometric profile with enhanced durability and natural warm wood finish.",
  },
  {
    id: "bed_20k_3",
    category: "bed",
    name: "bed",
    label: "Classic Walnut Slatted Bed",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 18200,
    image_url: "/furniture_dataset/bed/buget_10k_to_20k/bed5.jpg",
    dimensions: { length_ft: 6.6, width_ft: 5.5, height_ft: 3.6 },
    material: "Walnut Wood Finish",
    description: "Elegant headboard slats with balanced proportions for serene bedroom spaces.",
  },
  {
    id: "bed_20k_4",
    category: "bed",
    name: "bed",
    label: "Scandinavian Comfort King Bed",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 19500,
    image_url: "/furniture_dataset/bed/buget_10k_to_20k/bed6.jpg",
    dimensions: { length_ft: 6.8, width_ft: 6.0, height_ft: 3.6 },
    material: "Solid Hardwood",
    description: "Spacious Scandinavian king bed frame crafted for luxurious resting space.",
  },

  // ==================================================
  // BEDS - FROM furniture_dataset/bed/buget_20k_to_30k
  // ==================================================
  {
    id: "bed_30k_1",
    category: "bed",
    name: "bed",
    label: "Deluxe Tufted Fabric Queen Bed",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 22000,
    image_url: "/furniture_dataset/bed/buget_20k_to_30k/bed3.jpg",
    dimensions: { length_ft: 6.6, width_ft: 5.5, height_ft: 3.8 },
    material: "Premium Velvet Upholstery",
    description: "High-density cushioned headboard with premium tailored stitching.",
  },
  {
    id: "bed_30k_2",
    category: "bed",
    name: "bed",
    label: "Elegance Natural Oak Storage Bed",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 24500,
    image_url: "/furniture_dataset/bed/buget_20k_to_30k/bed4.jpg",
    dimensions: { length_ft: 6.6, width_ft: 5.8, height_ft: 3.8 },
    material: "Oak & Hydraulic Storage Lift",
    description: "Ample under-bed hydraulic storage with seamless wooden craftsmanship.",
  },
  {
    id: "bed_30k_3",
    category: "bed",
    name: "bed",
    label: "Executive Headboard Suite Bed",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 27000,
    image_url: "/furniture_dataset/bed/buget_20k_to_30k/bed5.jpg",
    dimensions: { length_ft: 6.8, width_ft: 6.0, height_ft: 4.0 },
    material: "Solid Walnut & Fabric Inlay",
    description: "Architectural tall headboard suite providing regal presence in master bedrooms.",
  },
  {
    id: "bed_30k_4",
    category: "bed",
    name: "bed",
    label: "Modern Silhouette King Bed",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 28500,
    image_url: "/furniture_dataset/bed/buget_20k_to_30k/bed6.jpg",
    dimensions: { length_ft: 6.8, width_ft: 6.2, height_ft: 4.0 },
    material: "High Density Wood Core",
    description: "Refined linear aesthetics paired with reinforced heavy-duty mattress support.",
  },
  {
    id: "bed_30k_5",
    category: "bed",
    name: "bed",
    label: "Wingback Premium Master Bed",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 29900,
    image_url: "/furniture_dataset/bed/buget_20k_to_30k/bed7.jpg",
    dimensions: { length_ft: 6.8, width_ft: 6.2, height_ft: 4.2 },
    material: "Wingback Upholstered Velvet",
    description: "Iconic wingback side profile creating an inviting luxury haven.",
  },

  // ==================================================
  // BEDS - FROM furniture_dataset/bed/buget_30k_to_40k
  // ==================================================
  {
    id: "bed_40k_1",
    category: "bed",
    name: "bed",
    label: "Signature Imperial King Suite Bed",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 32500,
    image_url: "/furniture_dataset/bed/buget_30k_to_40k/bed8.png",
    dimensions: { length_ft: 7.0, width_ft: 6.4, height_ft: 4.4 },
    material: "Solid Sheesham & Suede Velvet",
    description: "High-end designer bed with floating base illusion and ambient warmth.",
  },
  {
    id: "bed_40k_2",
    category: "bed",
    name: "bed",
    label: "Royal Velvet Curved Headboard Bed",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 34800,
    image_url: "/furniture_dataset/bed/buget_30k_to_40k/bed9.jpg",
    dimensions: { length_ft: 7.0, width_ft: 6.4, height_ft: 4.5 },
    material: "Italian Velvet & Brass Accents",
    description: "Sculptural curved headboard with opulent hand-tufted finish.",
  },
  {
    id: "bed_40k_3",
    category: "bed",
    name: "bed",
    label: "Grand Masterclass Storage King Bed",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 36900,
    image_url: "/furniture_dataset/bed/buget_30k_to_40k/bed10.jpg",
    dimensions: { length_ft: 7.0, width_ft: 6.5, height_ft: 4.5 },
    material: "Solid Teak & Quilted Leatherette",
    description: "Integrated soft-close storage drawers with whisper-quiet hydraulic mechanism.",
  },
  {
    id: "bed_40k_4",
    category: "bed",
    name: "bed",
    label: "Milano Leatherette Luxury Bed",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 38500,
    image_url: "/furniture_dataset/bed/buget_30k_to_40k/bed11.jpg",
    dimensions: { length_ft: 7.0, width_ft: 6.5, height_ft: 4.6 },
    material: "Top-Grain Eco-Leather",
    description: "Ultra-luxurious Italian-inspired minimalist silhouette with plush cushioning.",
  },
  {
    id: "bed_40k_5",
    category: "bed",
    name: "bed",
    label: "Architectural Sovereign King Bed",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 39999,
    image_url: "/furniture_dataset/bed/buget_30k_to_40k/bed12.jpg",
    dimensions: { length_ft: 7.2, width_ft: 6.6, height_ft: 4.8 },
    material: "Solid Hardwood & Brushed Champagne Accents",
    description: "Masterpiece centerpiece bed designed for expansive luxury bedrooms.",
  },

  // ==========================================
  // COMPLEMENTARY CATEGORIES (NIGHT LAMPS)
  // ==========================================
  {
    id: "lamp_1",
    category: "lamp",
    name: "lamp",
    label: "Nordic Minimalist Ceramic Bedside Lamp",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 1850,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
    dimensions: { length_ft: 1.0, width_ft: 1.0, height_ft: 1.6 },
    material: "Ceramic & Linen Shade",
    description: "Warm 2700K ambient bedside glow with natural textured fabric shade.",
  },
  {
    id: "lamp_2",
    category: "lamp",
    name: "lamp",
    label: "Modern Brass Tripod Ambient Lamp",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 3200,
    image_url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400",
    dimensions: { length_ft: 1.2, width_ft: 1.2, height_ft: 2.2 },
    material: "Brushed Brass & Frosted Glass",
    description: "Sculptural brass accent light ideal for corner or bedside illumination.",
  },
  {
    id: "lamp_3",
    category: "lamp",
    name: "lamp",
    label: "Designer Sculptural Floor Lamp",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 6800,
    image_url: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=400",
    dimensions: { length_ft: 1.5, width_ft: 1.5, height_ft: 5.2 },
    material: "Matte Black Steel & Smoked Glass",
    description: "Statement architectural floor lighting for elevated bedroom corners.",
  },

  // ==========================================
  // COMPLEMENTARY CATEGORIES (SIDE TABLES)
  // ==========================================
  {
    id: "table_1",
    category: "table",
    name: "table",
    label: "Scandinavian Floating Oak Nightstand",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 3400,
    image_url: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400",
    dimensions: { length_ft: 1.5, width_ft: 1.3, height_ft: 1.8 },
    material: "Natural Oak & Smooth Glide Drawer",
    description: "Space-efficient nightstand with soft-close drawer and lower storage shelf.",
  },
  {
    id: "table_2",
    category: "table",
    name: "table",
    label: "Contemporary Walnut Bedside Table",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 4800,
    image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400",
    dimensions: { length_ft: 1.8, width_ft: 1.4, height_ft: 2.0 },
    material: "Solid Walnut & Brass Handle",
    description: "Refined bedside table with dual drawers for streamlined organization.",
  },
  {
    id: "table_3",
    category: "table",
    name: "table",
    label: "Luxury Marble Top Side Table",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 7900,
    image_url: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=400",
    dimensions: { length_ft: 1.8, width_ft: 1.8, height_ft: 2.1 },
    material: "White Carrara Marble & Gold Steel",
    description: "Premium natural stone side table adding instant luxury beside the bed.",
  },

  // ==========================================
  // COMPLEMENTARY CATEGORIES (CHAIRS & WARDROBES)
  // ==========================================
  {
    id: "chair_1",
    category: "chair",
    name: "chair",
    label: "Ergonomic Lounge Accent Armchair",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 11500,
    image_url: "https://images.unsplash.com/photo-1580481077198-c80753867bb0?w=400",
    dimensions: { length_ft: 2.5, width_ft: 2.5, height_ft: 3.0 },
    material: "Bouclé Fabric & Oak Legs",
    description: "Curved silhouette armchair creating a cozy reading nook in the bedroom.",
  },
  {
    id: "wardrobe_1",
    category: "wardrobe",
    name: "wardrobe",
    label: "3-Door Modern Engineered Wardrobe",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 24500,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400",
    dimensions: { length_ft: 4.0, width_ft: 1.8, height_ft: 6.5 },
    material: "Moisture-Resistant HDF",
    description: "Spacious wardrobe with hanging rods, internal drawers, and full-length mirror.",
  },
  {
    id: "desk_1",
    category: "desk",
    name: "desk",
    label: "Minimalist Solid Wood Study Desk",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 12800,
    image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400",
    dimensions: { length_ft: 3.8, width_ft: 2.0, height_ft: 2.5 },
    material: "Solid Teak Wood",
    description: "Compact writing and study desk with cable organizer slot and slim drawers.",
  },
];

/**
 * Determine the budget bracket key from an arbitrary numeric budget
 */
export function getBudgetBracketKey(amount: number): "buget_10k" | "buget_10k_to_20k" | "buget_20k_to_30k" | "buget_30k_to_40k" {
  if (amount <= 10000) return "buget_10k";
  if (amount <= 20000) return "buget_10k_to_20k";
  if (amount <= 30000) return "buget_20k_to_30k";
  return "buget_30k_to_40k";
}

/**
 * Parse budget from text input (e.g. "25000", "₹25,000", "30k", "20000 to 30000")
 */
export function parseBudgetFromInput(input: string): number | null {
  if (!input) return null;
  const clean = input.toLowerCase().replace(/,/g, "").trim();

  // e.g. "25k" or "30 k"
  const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  // e.g. "25000" or "₹25000"
  const numMatch = clean.match(/\d[\d\.]*/g);
  if (numMatch && numMatch.length > 0) {
    const parsed = parseFloat(numMatch[numMatch.length - 1]);
    if (!isNaN(parsed) && parsed > 500) {
      return parsed;
    }
  }
  return null;
}

/**
 * Filter real dataset items by category and user's budget
 */
export function getDatasetItems(category: string, userBudget?: number, bracketKey?: string): DatasetFurnitureItem[] {
  const normCat = category.toLowerCase().trim();

  let items = REAL_FURNITURE_DATASET.filter((it) => {
    if (normCat === "all") return true;
    return it.category.toLowerCase() === normCat || it.name.toLowerCase() === normCat;
  });

  if (bracketKey) {
    items = items.filter((it) => it.budgetBracket === bracketKey);
  } else if (userBudget !== undefined && userBudget > 0) {
    // Return items that fit within the entered budget or matching bracket
    const bracket = getBudgetBracketKey(userBudget);
    const bracketItems = items.filter((it) => it.budgetBracket === bracket);
    if (bracketItems.length > 0) {
      items = bracketItems;
    } else {
      // Fallback to all items within price
      const priceFiltered = items.filter((it) => it.price <= userBudget * 1.15);
      if (priceFiltered.length > 0) items = priceFiltered;
    }
  }

  return items;
}

/**
 * Get individual item by ID
 */
export function getDatasetItemById(id: string): DatasetFurnitureItem | undefined {
  return REAL_FURNITURE_DATASET.find((it) => it.id === id);
}

const extractionCache = new Map<string, string>();

/**
 * Programmatically extract and segment ONLY the furniture object with transparent background at runtime.
 */
export async function getOrExtractItemImageUrl(item: DatasetFurnitureItem): Promise<string> {
  if (item.extracted_image_url) return item.extracted_image_url;
  const key = `${item.id}_${item.category}_${item.image_url}`;
  if (extractionCache.has(key)) {
    const cached = extractionCache.get(key)!;
    item.extracted_image_url = cached;
    return cached;
  }

  try {
    const res = await api.post("/furniture/extract", {
      image_url: item.image_url,
      category: item.category || item.name,
      item_id: item.id,
    });
    if (res.data?.success && res.data.extracted_image_url) {
      let url = res.data.extracted_image_url as string;
      if (url.startsWith("/")) {
        url = `http://127.0.0.1:5000${url}`;
      }
      extractionCache.set(key, url);
      item.extracted_image_url = url;
      return url;
    }
  } catch (err) {
    console.warn("Could not extract furniture object:", err);
  }

  return item.image_url;
}

/**
 * Background pre-extraction for currently visible items
 */
export function prefetchCategoryExtractions(items: DatasetFurnitureItem[], onUpdated?: (updatedItems: DatasetFurnitureItem[]) => void) {
  let changed = false;
  items.forEach((it) => {
    if (!it.extracted_image_url) {
      getOrExtractItemImageUrl(it).then((extractedUrl) => {
        if (extractedUrl && extractedUrl !== it.image_url) {
          it.extracted_image_url = extractedUrl;
          changed = true;
          if (onUpdated) {
            onUpdated([...items]);
          }
        }
      });
    }
  });
}

