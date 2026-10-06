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
    key: "chair",
    label: "Chair",
    icon: "🪑",
    suggestedPlacements: ["Accent Corner", "Desk Seating", "Reading Area"],
    description: "Ergonomic, accent, and lounge chairs from the dataset",
  },
  {
    key: "table",
    label: "Table",
    icon: "🪵",
    suggestedPlacements: ["Center Lounge", "Accent Area", "Bedside"],
    description: "Solid wood, marble, coffee, and accent tables",
  },
  {
    key: "side_table",
    label: "Side Table",
    icon: "🗄️",
    suggestedPlacements: ["Left Bedside", "Right Bedside", "Lounge Side"],
    description: "Solid wood, marble, and contemporary bedside & accent tables",
  },
  {
    key: "lamp",
    label: "Lamp",
    icon: "💡",
    suggestedPlacements: ["Bedside Corner", "Reading Corner"],
    description: "Warm ambient and bedside lighting fixtures",
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
    material: "Engineered Wood & Teak Finish",
    description: "Sleek low-profile platform bed with minimalist aesthetic and sturdy reinforced frame.",
  },
  {
    id: "bed_10k_2",
    category: "bed",
    name: "bed",
    label: "Contemporary Oak Single / Double Bed",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 9200,
    image_url: "/furniture_dataset/bed/buget_10k/bed2.jpg",
    dimensions: { length_ft: 6.5, width_ft: 4.5, height_ft: 3.0 },
    material: "Natural Wood Grain Finish",
    description: "Compact, durable bed designed for space-conscious modern bedrooms.",
  },
  {
    id: "bed_10k_3",
    category: "bed",
    name: "bed",
    label: "Urban Compact Solid Bed",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 9800,
    image_url: "/furniture_dataset/bed/buget_10k/bed3.jpg",
    dimensions: { length_ft: 6.5, width_ft: 5.0, height_ft: 3.2 },
    material: "Solid Pine & Veneer",
    description: "Balanced proportions with warm natural wooden headboard and slat support.",
  },
  {
    id: "bed_10k_4",
    category: "bed",
    name: "bed",
    label: "Low-Profile Studio Bed",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 9999,
    image_url: "/furniture_dataset/bed/buget_10k/bed4.jpg",
    dimensions: { length_ft: 6.5, width_ft: 5.0, height_ft: 2.9 },
    material: "High-Grade Engineered Core",
    description: "Streamlined low platform bed ideal for studio apartments and guest bedrooms.",
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

  // ========================================================
  // TABLES - FROM furniture_dataset/table/
  // ========================================================
  // Tier 1: Under ₹10,000
  {
    id: "table_10k_1",
    category: "table",
    name: "table",
    label: "Scandinavian Floating Oak Table",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 3400,
    image_url: "/furniture_dataset/table/buget_10k/table1.jpg",
    dimensions: { length_ft: 1.6, width_ft: 1.4, height_ft: 1.8 },
    material: "Natural Oak & Smooth Glide Drawer",
    description: "Space-efficient table with soft-close drawer and lower storage shelf.",
  },
  {
    id: "table_10k_2",
    category: "table",
    name: "table",
    label: "Contemporary Walnut Bedside Table",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 4800,
    image_url: "/furniture_dataset/table/buget_10k/table2.jpg",
    dimensions: { length_ft: 1.8, width_ft: 1.5, height_ft: 2.0 },
    material: "Solid Walnut & Brass Handle",
    description: "Refined bedside table with dual drawers for streamlined organization.",
  },
  {
    id: "table_10k_3",
    category: "table",
    name: "table",
    label: "Minimalist Dual-Shelf Nightstand Table",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 6500,
    image_url: "/furniture_dataset/table/buget_10k/table4.jpg",
    dimensions: { length_ft: 1.6, width_ft: 1.4, height_ft: 1.9 },
    material: "Matte Lacquer & Engineered Core",
    description: "Clean modern table offering dual open storage compartments.",
  },
  {
    id: "table_10k_4",
    category: "table",
    name: "table",
    label: "Solid Teakwood Bedside Drawer Table",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 7800,
    image_url: "/furniture_dataset/table/buget_10k/table5.jpeg",
    dimensions: { length_ft: 1.8, width_ft: 1.5, height_ft: 2.1 },
    material: "Handcrafted Teak Wood",
    description: "Sturdy handcrafted teak bedside table with rich natural grain finish.",
  },
  {
    id: "table_10k_5",
    category: "table",
    name: "table",
    label: "Modern Wooden Accent Table",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 8500,
    image_url: "/furniture_dataset/table/buget_10k/table7.jpeg",
    dimensions: { length_ft: 1.8, width_ft: 1.5, height_ft: 2.0 },
    material: "Hardwood & Brass Trim",
    description: "Warm-toned wooden accent table fitting smoothly beside beds and lounge chairs.",
  },
  {
    id: "table_10k_6",
    category: "table",
    name: "table",
    label: "Compact Bedside Storage Table",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 9200,
    image_url: "/furniture_dataset/table/buget_10k/table8.jpeg",
    dimensions: { length_ft: 1.9, width_ft: 1.6, height_ft: 2.1 },
    material: "Engineered Wood with Oak Veneer",
    description: "Multi-compartment storage table with seamless magnetic drawer latch.",
  },

  // Tier 2: ₹10,000 - ₹20,000
  {
    id: "table_20k_1",
    category: "table",
    name: "table",
    label: "Luxury Marble Top Side Table",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 12500,
    image_url: "/furniture_dataset/table/buget_10k_to_20k/table5.jpg",
    dimensions: { length_ft: 1.8, width_ft: 1.8, height_ft: 2.1 },
    material: "White Carrara Marble & Gold Steel",
    description: "Premium natural stone side table adding instant luxury beside the bed.",
  },
  {
    id: "table_20k_2",
    category: "table",
    name: "table",
    label: "Mid-Century Modern Bedside Table",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 14200,
    image_url: "/furniture_dataset/table/buget_10k_to_20k/table6.jpeg",
    dimensions: { length_ft: 1.9, width_ft: 1.5, height_ft: 2.2 },
    material: "American Walnut & Tapered Legs",
    description: "Iconic mid-century silhouette featuring deep drawer and angled solid legs.",
  },
  {
    id: "table_20k_3",
    category: "table",
    name: "table",
    label: "Nordic Dual-Tier Bedside Table",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 16500,
    image_url: "/furniture_dataset/table/buget_10k_to_20k/table6.jpg",
    dimensions: { length_ft: 2.0, width_ft: 1.6, height_ft: 2.2 },
    material: "Solid Bleached Oak",
    description: "Architectural two-tier bedside piece with hidden cable routing channel.",
  },
  {
    id: "table_20k_4",
    category: "table",
    name: "table",
    label: "Artisan Solid Cane & Oak Nightstand",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 18500,
    image_url: "/furniture_dataset/table/buget_10k_to_20k/table7.jpg",
    dimensions: { length_ft: 1.9, width_ft: 1.5, height_ft: 2.2 },
    material: "Woven Natural Cane & Solid Oak",
    description: "Artisan woven cane drawer front bringing organic texture to bedroom walls.",
  },

  // Tier 3: ₹20,000 - ₹30,000
  {
    id: "table_30k_1",
    category: "table",
    name: "table",
    label: "Executive Brushed Gold & Walnut Nightstand",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 22000,
    image_url: "/furniture_dataset/table/buget_20k_to_30k/table9.jpg",
    dimensions: { length_ft: 2.0, width_ft: 1.6, height_ft: 2.3 },
    material: "Solid Dark Walnut & Champagne Metal",
    description: "High-end bespoke nightstand with champagne gold base and velvet-lined drawer.",
  },
  {
    id: "table_30k_2",
    category: "table",
    name: "table",
    label: "Italian Fluted Wood Bedside Cabinet",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 24500,
    image_url: "/furniture_dataset/table/buget_20k_to_30k/table10.jpg",
    dimensions: { length_ft: 2.1, width_ft: 1.7, height_ft: 2.3 },
    material: "Curved Fluted Ashwood",
    description: "Sculptural cylindrical cabinet with fluted wood exterior and push-to-open drawer.",
  },
  {
    id: "table_30k_3",
    category: "table",
    name: "table",
    label: "Velvet Upholstered Luxury Table",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 27500,
    image_url: "/furniture_dataset/table/buget_20k_to_30k/table10.jpeg",
    dimensions: { length_ft: 2.2, width_ft: 1.7, height_ft: 2.4 },
    material: "Plush Velvet Wrap & Quartz Top",
    description: "Rich velvet tailored perimeter paired with stain-resistant quartz top.",
  },

  // Tier 4: ₹30,000 - ₹40,000+
  {
    id: "table_40k_1",
    category: "table",
    name: "table",
    label: "Sovereign Imperial Marble & Brass Table",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 32000,
    image_url: "/furniture_dataset/table/buget_30k_to_40k/table11.jpg",
    dimensions: { length_ft: 2.2, width_ft: 1.8, height_ft: 2.5 },
    material: "Calacatta Gold Marble & Brass Inlay",
    description: "Opulent Italian Calacatta gold marble table for master suites.",
  },
  {
    id: "table_40k_2",
    category: "table",
    name: "table",
    label: "Designer Sculptural Stone Table",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 35500,
    image_url: "/furniture_dataset/table/buget_30k_to_40k/table12.jpg",
    dimensions: { length_ft: 2.2, width_ft: 1.8, height_ft: 2.5 },
    material: "Solid Travertine & Brushed Titanium",
    description: "Monolithic architectural statement stone table crafted by luxury artisans.",
  },
  {
    id: "table_40k_3",
    category: "table",
    name: "table",
    label: "Opulent Handcrafted Teak Bedside Suite",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 38000,
    image_url: "/furniture_dataset/table/buget_30k_to_40k/table13.jpeg",
    dimensions: { length_ft: 2.3, width_ft: 1.8, height_ft: 2.6 },
    material: "Solid Burma Teak & Leather Drawers",
    description: "Rare aged teakwood frame with hand-stitched leather drawer linings.",
  },

  // ==========================================
  // LAMPS - FROM furniture_dataset/lamp/
  // ==========================================
  // Tier 1: Under ₹10,000
  {
    id: "lamp_10k_1",
    category: "lamp",
    name: "lamp",
    label: "Nordic Minimalist Ceramic Bedside Lamp",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 1850,
    image_url: "/furniture_dataset/lamp/buget_10k/lamp1.jpg",
    dimensions: { length_ft: 1.0, width_ft: 1.0, height_ft: 1.6 },
    material: "Ceramic & Linen Shade",
    description: "Warm 2700K ambient bedside glow with natural textured fabric shade.",
  },
  {
    id: "lamp_10k_2",
    category: "lamp",
    name: "lamp",
    label: "Modern Brass Tripod Ambient Lamp",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 3200,
    image_url: "/furniture_dataset/lamp/buget_10k/lamp2.jpg",
    dimensions: { length_ft: 1.2, width_ft: 1.2, height_ft: 2.2 },
    material: "Brushed Brass & Frosted Glass",
    description: "Sculptural brass accent light ideal for corner or bedside illumination.",
  },
  {
    id: "lamp_10k_3",
    category: "lamp",
    name: "lamp",
    label: "Warm Globe Bedside Nightstand Light",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 4500,
    image_url: "/furniture_dataset/lamp/buget_10k/lamp3.jpg",
    dimensions: { length_ft: 1.1, width_ft: 1.1, height_ft: 1.8 },
    material: "Opal Glass & Matte Base",
    description: "Soft diffuse globe emitting calming ambient light for peaceful sleep.",
  },
  {
    id: "lamp_10k_4",
    category: "lamp",
    name: "lamp",
    label: "Japanese Paper Lantern Table Lamp",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 6800,
    image_url: "/furniture_dataset/lamp/buget_10k/lamp4.png",
    dimensions: { length_ft: 1.2, width_ft: 1.2, height_ft: 2.0 },
    material: "Washi Paper & Bamboo Frame",
    description: "Traditional zen-inspired paper lantern light creating soothing mood warmth.",
  },

  // Tier 2: ₹10,000 - ₹20,000
  {
    id: "lamp_20k_1",
    category: "lamp",
    name: "lamp",
    label: "Designer Sculptural Floor Lamp",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 11500,
    image_url: "/furniture_dataset/lamp/buget_10k_to_20k/lamp5.jpg",
    dimensions: { length_ft: 1.5, width_ft: 1.5, height_ft: 5.2 },
    material: "Matte Black Steel & Smoked Glass",
    description: "Statement architectural floor lighting for elevated bedroom corners.",
  },
  {
    id: "lamp_20k_2",
    category: "lamp",
    name: "lamp",
    label: "Smoked Glass Ambient Bedside Fixture",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 13800,
    image_url: "/furniture_dataset/lamp/buget_10k_to_20k/lamp7.jpg",
    dimensions: { length_ft: 1.3, width_ft: 1.3, height_ft: 2.4 },
    material: "Smoked Grey Glass & Gold Core",
    description: "Refined geometric bedside fixture with three-step touch dimming.",
  },
  {
    id: "lamp_20k_3",
    category: "lamp",
    name: "lamp",
    label: "Mid-Century Opal Pendant Night Lamp",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 15900,
    image_url: "/furniture_dataset/lamp/buget_10k_to_20k/lamp8.jpg",
    dimensions: { length_ft: 1.4, width_ft: 1.4, height_ft: 2.8 },
    material: "Hand-Blown Opaline Glass",
    description: "Mid-century classic night fixture with brushed walnut finial.",
  },

  // Tier 3: ₹20,000 - ₹30,000
  {
    id: "lamp_30k_1",
    category: "lamp",
    name: "lamp",
    label: "Artisan Travertine Cylinder Lamp",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 21500,
    image_url: "/furniture_dataset/lamp/buget_20k_to_30k/lamp9.jpg",
    dimensions: { length_ft: 1.4, width_ft: 1.4, height_ft: 2.6 },
    material: "Solid Travertine & Heavy Linen",
    description: "Hand-carved travertine stone base with textured woven linen cylinder shade.",
  },
  {
    id: "lamp_30k_2",
    category: "lamp",
    name: "lamp",
    label: "Contemporary Linear LED Bedside Bar",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 24000,
    image_url: "/furniture_dataset/lamp/buget_20k_to_30k/lamp10.jpg",
    dimensions: { length_ft: 1.2, width_ft: 1.2, height_ft: 3.2 },
    material: "Anodized Aerospace Aluminum",
    description: "Minimalist ultra-slim vertical light column with 360-degree ambient diffusion.",
  },
  {
    id: "lamp_30k_3",
    category: "lamp",
    name: "lamp",
    label: "Brushed Bronze Architectural Lamp",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 26500,
    image_url: "/furniture_dataset/lamp/buget_20k_to_30k/lamp11.jpg",
    dimensions: { length_ft: 1.5, width_ft: 1.5, height_ft: 3.5 },
    material: "Cast Bronze & Silk Shade",
    description: "Heirloom-quality cast bronze bedside sculpture with raw silk shade.",
  },
  {
    id: "lamp_30k_4",
    category: "lamp",
    name: "lamp",
    label: "Italian Hand-blown Murano Glass Lamp",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 28900,
    image_url: "/furniture_dataset/lamp/buget_20k_to_30k/lamp12.jpg",
    dimensions: { length_ft: 1.6, width_ft: 1.6, height_ft: 2.8 },
    material: "Murano Swirl Glass & Brass",
    description: "Authentic Murano glass swirl craftsmanship with warm ambient filament illumination.",
  },

  // Tier 4: ₹30,000 - ₹40,000+
  {
    id: "lamp_40k_1",
    category: "lamp",
    name: "lamp",
    label: "Sovereign Crystal & Gold Chandelier Lamp",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 32500,
    image_url: "/furniture_dataset/lamp/buget_30k_to_40k/lamp10.png",
    dimensions: { length_ft: 1.8, width_ft: 1.8, height_ft: 3.8 },
    material: "K9 Precision Crystal & 24K Gold Finish",
    description: "Dazzling crystal facet bedside statement piece casting refractive light patterns.",
  },
  {
    id: "lamp_40k_2",
    category: "lamp",
    name: "lamp",
    label: "Sculptural Bronzed Floor Tower Lamp",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 35000,
    image_url: "/furniture_dataset/lamp/buget_30k_to_40k/lamp12.jpeg",
    dimensions: { length_ft: 1.8, width_ft: 1.8, height_ft: 6.0 },
    material: "Hand-Hammered Bronzed Steel",
    description: "Grand architectural column floor lamp providing master suite focal glow.",
  },
  {
    id: "lamp_40k_3",
    category: "lamp",
    name: "lamp",
    label: "Imperial Marble Base Floor Arc Light",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 37500,
    image_url: "/furniture_dataset/lamp/buget_30k_to_40k/lamp13.jpg",
    dimensions: { length_ft: 2.2, width_ft: 1.8, height_ft: 6.2 },
    material: "Solid Nero Marquina Marble & Brass Arc",
    description: "Iconic sweeping arc lamp rooted in an 80lb Nero Marquina black marble block.",
  },
  {
    id: "lamp_40k_4",
    category: "lamp",
    name: "lamp",
    label: "Luxury Luminary Atelier Masterpiece",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 39999,
    image_url: "/furniture_dataset/lamp/buget_30k_to_40k/lamp16.jpg",
    dimensions: { length_ft: 2.0, width_ft: 2.0, height_ft: 5.8 },
    material: "Curved Hand-Finished Brass & Calacatta Marble",
    description: "Limited-edition luxury gallery lighting installation designed for elite penthouses.",
  },

  // ==========================================
  // CHAIRS - FROM furniture_dataset/chair/
  // ==========================================
  // Tier 1: Under ₹10,000
  {
    id: "chair_10k_1",
    category: "chair",
    name: "chair",
    label: "Ergonomic High-Back Study Chair",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 6499,
    image_url: "/furniture_dataset/chair/buget_10k/chair1.jpg",
    dimensions: { length_ft: 2.0, width_ft: 2.0, height_ft: 3.8 },
    material: "Breathable Mesh & Heavy-Duty Base",
    description: "High-back ergonomic computer desk chair with lumbar support and smooth casters.",
  },
  {
    id: "chair_10k_2",
    category: "chair",
    name: "chair",
    label: "Velvet Luxury Accent Armchair",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 8499,
    image_url: "/furniture_dataset/chair/buget_10k/chair2.jpg",
    dimensions: { length_ft: 2.4, width_ft: 2.4, height_ft: 3.0 },
    material: "Plush Velvet & Gold-Toned Steel",
    description: "Curved barrel back armchair with soft velvet upholstery and tapered brass legs.",
  },
  {
    id: "chair_10k_3",
    category: "chair",
    name: "chair",
    label: "Nordic Minimalist Wooden Stool Chair",
    budgetBracket: "buget_10k",
    budgetLabel: "Under ₹10,000",
    price: 4500,
    image_url: "/furniture_dataset/chair/buget_10k/chair3.jpg",
    dimensions: { length_ft: 1.8, width_ft: 1.8, height_ft: 2.6 },
    material: "Solid Natural Ashwood",
    description: "Minimalist Scandinavian wooden chair crafted for bedrooms and vanity spaces.",
  },

  // Tier 2: ₹10,000 - ₹20,000
  {
    id: "chair_20k_1",
    category: "chair",
    name: "chair",
    label: "Pro Ergonomic Gaming & Work Chair",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 16990,
    image_url: "/furniture_dataset/chair/buget_10k_to_20k/chair4.jpg",
    dimensions: { length_ft: 2.2, width_ft: 2.2, height_ft: 4.2 },
    material: "Spandex Fabric & Steel Frame",
    description: "Premium breathable fabric chair with 4D armrests, magnetic neck cushion, and reclining back.",
  },
  {
    id: "chair_20k_2",
    category: "chair",
    name: "chair",
    label: "Plush Comfort Recliner Armchair",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 14999,
    image_url: "/furniture_dataset/chair/buget_10k_to_20k/chair5.jpg",
    dimensions: { length_ft: 3.0, width_ft: 2.8, height_ft: 3.3 },
    material: "Pocket Spring & Microfiber",
    description: "Multi-stage manual recliner armchair with padded lumbar support and footrest extension.",
  },
  {
    id: "chair_20k_3",
    category: "chair",
    name: "chair",
    label: "Scandinavian Modern Lounge Chair",
    budgetBracket: "buget_10k_to_20k",
    budgetLabel: "₹10,000 - ₹20,000",
    price: 18500,
    image_url: "/furniture_dataset/chair/buget_10k_to_20k/chair6.jpg",
    dimensions: { length_ft: 2.5, width_ft: 2.5, height_ft: 3.2 },
    material: "Solid Oak & Textured Wool",
    description: "Architectural low-profile lounge chair tailored for relaxed bedroom reading corners.",
  },

  // Tier 3: ₹20,000 - ₹30,000
  {
    id: "chair_30k_1",
    category: "chair",
    name: "chair",
    label: "Mid-Century Artisan Walnut Armchair",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 24500,
    image_url: "/furniture_dataset/chair/buget_20k_to_30k/chair7.jpg",
    dimensions: { length_ft: 2.6, width_ft: 2.6, height_ft: 3.4 },
    material: "Solid Dark Walnut & Top-Grain Leather",
    description: "Sculptural wooden frame with hand-stitched leather seat for master bedrooms.",
  },
  {
    id: "chair_30k_2",
    category: "chair",
    name: "chair",
    label: "Designer Bouclé Lounge Club Chair",
    budgetBracket: "buget_20k_to_30k",
    budgetLabel: "₹20,000 - ₹30,000",
    price: 27900,
    image_url: "/furniture_dataset/chair/buget_20k_to_30k/chair8.jpg",
    dimensions: { length_ft: 2.8, width_ft: 2.8, height_ft: 3.2 },
    material: "Cream Bouclé & Brass Base",
    description: "Ultra-cozy rounded club chair upholstered in cloud-soft textured bouclé fabric.",
  },

  // Tier 4: ₹30,000 - ₹40,000+
  {
    id: "chair_40k_1",
    category: "chair",
    name: "chair",
    label: "Executive Italian Leather Armchair",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 34500,
    image_url: "/furniture_dataset/chair/buget_30k_to_40k/chair9.jpg",
    dimensions: { length_ft: 2.8, width_ft: 2.8, height_ft: 3.5 },
    material: "Italian Semi-Aniline Leather",
    description: "Handcrafted masterclass lounge chair with deep comfort cushioning.",
  },
  {
    id: "chair_40k_2",
    category: "chair",
    name: "chair",
    label: "Imperial Velvet Statement Chair",
    budgetBracket: "buget_30k_to_40k",
    budgetLabel: "₹30,000 - ₹40,000+",
    price: 38900,
    image_url: "/furniture_dataset/chair/buget_30k_to_40k/chair10.jpg",
    dimensions: { length_ft: 3.0, width_ft: 3.0, height_ft: 3.6 },
    material: "Royal Velvet & Hand-Carved Frame",
    description: "Opulent statement wingback chair designed for luxury suites and grand master bedrooms.",
  },
];

/**
 * Calculates the realistic displayed width percentage on the room canvas
 * based on the uploaded room's real dimensions (feet).
 * Bed -> ~36% in a 14ft room (~5.5ft)
 * Table -> ~13% in a 14ft room (~1.8ft)
 * Lamp -> ~8% in a 14ft room (~1.1ft)
 */
export function calculateRealisticFurnitureWidthPct(
  item: { category?: string; name?: string; dimensions?: { width_ft?: number; length_ft?: number } },
  roomWidthFt: number = 14
): number {
  const cat = (item.category || item.name || "").toLowerCase();
  const roomW = Math.max(8, Math.min(30, Number(roomWidthFt) || 14));

  let physicalWidthFt = 4.0;
  if (item.dimensions?.width_ft && item.dimensions.width_ft > 0) {
    physicalWidthFt = item.dimensions.width_ft;
  } else if (cat.includes("bed") && !cat.includes("table") && !cat.includes("side")) {
    physicalWidthFt = 5.5; // Standard queen/king bed width ~5.5 ft
  } else if (cat.includes("table") || cat.includes("nightstand") || cat.includes("bedside")) {
    physicalWidthFt = 1.8; // Nightstand / table width ~1.8 ft
  } else if (cat.includes("lamp") || cat.includes("light")) {
    physicalWidthFt = 1.1; // Lamp width ~1.1 ft
  } else if (cat.includes("wardrobe") || cat.includes("almirah") || cat.includes("closet")) {
    physicalWidthFt = 4.2;
  } else if (cat.includes("chair")) {
    physicalWidthFt = 2.5;
  } else if (cat.includes("desk")) {
    physicalWidthFt = 3.8;
  } else if (cat.includes("sofa")) {
    physicalWidthFt = 6.0;
  }

  const widthPct = (physicalWidthFt / roomW) * 100;
  return Math.max(6, Math.min(65, widthPct));
}

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
  const normCat = (category || "").toLowerCase().trim().replace(/[\s_-]+/g, "");

  let items = REAL_FURNITURE_DATASET.filter((it) => {
    if (normCat === "all") return true;
    const itCat = (it.category || "").toLowerCase().replace(/[\s_-]+/g, "");
    const itName = (it.name || "").toLowerCase().replace(/[\s_-]+/g, "");
    const itLabel = (it.label || "").toLowerCase();

    if (normCat.includes("chair") || normCat.includes("seat") || normCat.includes("recliner")) {
      return itCat.includes("chair") || itName.includes("chair") || itLabel.includes("chair");
    }
    if (normCat.includes("sidetable") || normCat.includes("side_table") || normCat.includes("nightstand") || normCat.includes("bedside")) {
      return (
        itCat.includes("side_table") ||
        itCat.includes("table") ||
        itCat.includes("nightstand") ||
        itCat.includes("bedside") ||
        itName.includes("table") ||
        itLabel.includes("bedside") ||
        itLabel.includes("side table") ||
        itLabel.includes("nightstand")
      );
    }
    if (normCat.includes("table") || normCat.includes("desk")) {
      return (
        itCat.includes("table") ||
        itCat.includes("desk") ||
        itCat.includes("side_table") ||
        itName.includes("table") ||
        itLabel.includes("table")
      );
    }
    if (normCat.includes("lamp") || normCat.includes("light")) {
      return itCat.includes("lamp") || itCat.includes("light") || itName.includes("lamp") || itName.includes("light");
    }
    if (normCat.includes("bed") && !normCat.includes("table") && !normCat.includes("side")) {
      return (itCat === "bed" || itName === "bed") && !itCat.includes("table") && !itName.includes("table");
    }

    return itCat === normCat || itName === normCat || itCat.includes(normCat) || normCat.includes(itCat);
  });

  if (bracketKey && bracketKey !== "all") {
    items = items.filter((it) => it.budgetBracket === bracketKey);
  } else if (userBudget !== undefined && userBudget > 0) {
    const bracket = getBudgetBracketKey(userBudget);
    const bracketItems = items.filter((it) => it.budgetBracket === bracket);
    if (bracketItems.length > 0) {
      items = bracketItems;
    } else {
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
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
        url = `${apiBase}${url}`;
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
