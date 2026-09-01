"""Default furniture specifications, bed types, and room variation generators."""

import urllib.parse

BED_TYPES = {
    "queen": {
        "key": "queen",
        "label": "Queen Size Bed",
        "length_ft": 6.7,
        "width_ft": 5.0,
        "height_ft": 3.8,
        "base_price": 25000.0,
        "description": "Queen size ergonomic bed (5.0×6.7 ft) with cushioned upholstered headboard & neutral finish.",
        "icon": "👑",
        "colors": ["warm beige", "navy blue", "charcoal gray", "white"],
    },
    "master": {
        "key": "master",
        "label": "Master King Bed",
        "length_ft": 6.7,
        "width_ft": 6.3,
        "height_ft": 4.2,
        "base_price": 38000.0,
        "description": "Grand Master King bed (6.3×6.7 ft) with solid teakwood frame, dual side panels & tufted leatherette.",
        "icon": "🛏️",
        "colors": ["walnut brown", "dark chocolate", "charcoal gray", "cream"],
    },
    "luxury": {
        "key": "luxury",
        "label": "Luxury Designer Bed",
        "length_ft": 7.0,
        "width_ft": 6.5,
        "height_ft": 4.8,
        "base_price": 55000.0,
        "description": "Ultra-luxury Italian velvet king bed (6.5×7.0 ft) with champagne gold brushed brass accents & hidden LED glow.",
        "icon": "✨",
        "colors": ["emerald velvet", "royal navy", "champagne gold", "matte black"],
    },
    "gaming": {
        "key": "gaming",
        "label": "Gaming Smart Bed",
        "length_ft": 6.5,
        "width_ft": 4.5,
        "height_ft": 4.0,
        "base_price": 32000.0,
        "description": "Futuristic gaming platform bed (4.5×6.5 ft) with carbon-fiber headboard, addressable RGB underglow & built-in power hub.",
        "icon": "🎮",
        "colors": ["cyber black", "neon cyan", "stealth gray", "crimson red"],
    },
    "kids": {
        "key": "kids",
        "label": "Kids Modular Bed",
        "length_ft": 6.5,
        "width_ft": 3.5,
        "height_ft": 3.5,
        "base_price": 18000.0,
        "description": "Child-safe modular single bed (3.5×6.5 ft) with rounded anti-bump corners, pull-out storage drawers & vibrant theme.",
        "icon": "🧸",
        "colors": ["pastel blue", "candy pink", "soft mint", "sunny yellow"],
    },
}

FURNITURE_DEFAULTS = {
    "bed": {
        "label": "Bed",
        "sizes": {
            "single": {"length_ft": 6.5, "width_ft": 3.0, "price": 15000.0, "description": "Single bed (3×6.5 ft)"},
            "twin": {"length_ft": 6.5, "width_ft": 3.5, "price": 18000.0, "description": "Twin bed (3.5×6.5 ft)"},
            "kids": {"length_ft": 6.5, "width_ft": 3.5, "price": 18000.0, "description": "Kids modular bed (3.5×6.5 ft)"},
            "gaming": {"length_ft": 6.5, "width_ft": 4.5, "price": 32000.0, "description": "Gaming smart bed (4.5×6.5 ft)"},
            "queen": {"length_ft": 6.7, "width_ft": 5.0, "price": 25000.0, "description": "Queen bed (5×6.7 ft)"},
            "king": {"length_ft": 6.7, "width_ft": 6.3, "price": 35000.0, "description": "King bed (6.3×6.7 ft)"},
            "master": {"length_ft": 6.7, "width_ft": 6.3, "price": 38000.0, "description": "Master king bed (6.3×6.7 ft)"},
            "luxury": {"length_ft": 7.0, "width_ft": 6.5, "price": 55000.0, "description": "Luxury velvet bed (6.5×7 ft)"},
        },
        "default_size": "queen",
        "default_color": "warm beige",
        "colors": {
            "warm beige": "#D4B896",
            "white": "#F5F5F5",
            "gray": "#9E9E9E",
            "navy blue": "#1B3A5C",
            "dark brown": "#5D4037",
            "black": "#2C2C2C",
            "emerald velvet": "#0F5132",
            "royal navy": "#0A2540",
            "champagne gold": "#D4AF37",
            "cyber black": "#1A1A24",
            "pastel blue": "#7BA7D7",
        },
    },
    "sofa": {
        "label": "Sofa",
        "sizes": {
            "standard": {"length_ft": 6.0, "width_ft": 3.0, "price": 20000.0, "description": "Standard 3-seater sofa (6×3 ft)"},
            "compact": {"length_ft": 4.5, "width_ft": 2.5, "price": 14000.0, "description": "Compact 2-seater sofa (4.5×2.5 ft)"},
            "sectional": {"length_ft": 8.0, "width_ft": 4.0, "price": 35000.0, "description": "Sectional sofa (8×4 ft)"},
        },
        "default_size": "standard",
        "default_color": "charcoal gray",
        "colors": {
            "charcoal gray": "#4A4A4A",
            "cream": "#FFF8E7",
            "teal": "#008080",
            "burgundy": "#800020",
            "light blue": "#87CEEB",
        },
    },
    "chair": {
        "label": "Chair",
        "sizes": {
            "standard": {"length_ft": 2.0, "width_ft": 2.0, "price": 5000.0, "description": "Standard armchair (2×2 ft)"},
            "gaming": {"length_ft": 2.2, "width_ft": 2.2, "price": 11000.0, "description": "RGB Ergonomic Gaming Chair (2.2×2.2 ft)"},
            "lounge": {"length_ft": 2.5, "width_ft": 2.5, "price": 8500.0, "description": "Plush Velvet Lounge Chair (2.5×2.5 ft)"},
            "study": {"length_ft": 1.8, "width_ft": 1.8, "price": 4500.0, "description": "Ergonomic Study Chair (1.8×1.8 ft)"},
        },
        "default_size": "standard",
        "default_color": "brown",
        "colors": {
            "brown": "#8B4513",
            "black": "#1A1A1A",
            "white": "#FFFFFF",
            "green": "#2E7D32",
            "gold": "#D4AF37",
        },
    },
    "table": {
        "label": "Table",
        "sizes": {
            "coffee": {"length_ft": 3.5, "width_ft": 2.0, "price": 6000.0, "description": "Coffee table (3.5×2 ft)"},
            "dining": {"length_ft": 5.0, "width_ft": 3.0, "price": 12000.0, "description": "Dining table (5×3 ft)"},
            "side": {"length_ft": 1.5, "width_ft": 1.5, "price": 3000.0, "description": "Side table / Nightstand (1.5×1.5 ft)"},
            "nightstand": {"length_ft": 1.8, "width_ft": 1.5, "price": 4000.0, "description": "Dual-drawer Nightstand (1.8×1.5 ft)"},
        },
        "default_size": "side",
        "default_color": "walnut",
        "colors": {
            "walnut": "#6B4423",
            "white": "#FAFAFA",
            "black": "#212121",
            "oak": "#C4A882",
            "gold": "#D4AF37",
        },
    },
    "wardrobe": {
        "label": "Wardrobe",
        "sizes": {
            "compact": {"length_ft": 3.5, "width_ft": 2.0, "price": 12000.0, "description": "2-Door Wardrobe (3.5×2 ft)"},
            "standard": {"length_ft": 4.5, "width_ft": 2.0, "price": 18000.0, "description": "3-Door Modern Wardrobe (4.5×2 ft)"},
            "sliding": {"length_ft": 6.0, "width_ft": 2.0, "price": 26000.0, "description": "Sliding Mirror Wardrobe (6×2 ft)"},
            "luxury": {"length_ft": 7.0, "width_ft": 2.2, "price": 38000.0, "description": "Walk-in Style Tinted Glass Wardrobe (7×2.2 ft)"},
        },
        "default_size": "standard",
        "default_color": "white",
        "colors": {
            "white": "#F0F0F0",
            "brown": "#795548",
            "gray": "#757575",
            "charcoal": "#333333",
        },
    },
    "desk": {
        "label": "Desk / Workstation",
        "sizes": {
            "compact": {"length_ft": 3.0, "width_ft": 1.8, "price": 6000.0, "description": "Compact Study Desk (3×1.8 ft)"},
            "standard": {"length_ft": 4.0, "width_ft": 2.0, "price": 9000.0, "description": "Executive Study Desk (4×2 ft)"},
            "gaming": {"length_ft": 5.0, "width_ft": 2.3, "price": 16000.0, "description": "Pro Gaming Battlestation Desk with Cable Management & RGB (5×2.3 ft)"},
        },
        "default_size": "standard",
        "default_color": "oak",
        "colors": {
            "oak": "#C4A882",
            "white": "#FFFFFF",
            "black": "#222222",
            "walnut": "#5D4037",
        },
    },
    "lamp": {
        "label": "Ambient Lamp",
        "sizes": {
            "floor": {"length_ft": 1.2, "width_ft": 1.2, "price": 3500.0, "description": "Nordic Standing Floor Lamp (1.2×1.2 ft)"},
            "table": {"length_ft": 0.8, "width_ft": 0.8, "price": 1800.0, "description": "Bedside Touch Lamp (0.8×0.8 ft)"},
            "rgb": {"length_ft": 1.0, "width_ft": 1.0, "price": 3800.0, "description": "RGB Smart Corner Light Bar (1×1 ft)"},
        },
        "default_size": "floor",
        "default_color": "gold",
        "colors": {
            "gold": "#FFD700",
            "black": "#1A1A1A",
            "white": "#FFFFFF",
        },
    },
    "tv": {
        "label": "TV & Media Unit",
        "sizes": {
            "standard": {"length_ft": 5.0, "width_ft": 1.3, "price": 12000.0, "description": "Floating Wall TV Console (5×1.3 ft)"},
            "large": {"length_ft": 6.5, "width_ft": 1.5, "price": 18000.0, "description": "Full Entertainment Wall Panel (6.5×1.5 ft)"},
        },
        "default_size": "standard",
        "default_color": "black",
        "colors": {
            "black": "#1A1A1A",
            "white": "#EEEEEE",
            "walnut": "#6B4423",
        },
    },
}

FURNITURE_ALIASES = {
    "couch": "sofa",
    "settee": "sofa",
    "armchair": "chair",
    "stool": "chair",
    "nightstand": "table",
    "side table": "table",
    "coffee table": "table",
    "closet": "wardrobe",
    "cupboard": "wardrobe",
    "work desk": "desk",
    "study table": "desk",
    "gaming desk": "desk",
    "television": "tv",
    "tv stand": "tv",
}

SIZE_KEYWORDS = [
    "single", "twin", "queen", "king", "master", "luxury", "gaming", "kids",
    "standard", "compact", "sectional", "large",
    "coffee", "dining", "side", "floor", "sliding", "lounge", "study",
]

COLOR_KEYWORDS = [
    "warm beige", "charcoal gray", "navy blue", "dark brown", "emerald velvet",
    "royal navy", "champagne gold", "cyber black", "neon cyan", "pastel blue",
    "light blue", "walnut", "oak", "white", "black", "gray", "grey", "brown",
    "blue", "red", "green", "beige", "cream", "teal", "burgundy", "gold", "silver",
]

POSITION_KEYWORDS = {
    "center": "center",
    "middle": "center",
    "corner": "bottom-left",
    "left": "left",
    "right": "right",
    "window": "right",
    "wall": "left",
    "near door": "bottom-right",
    "door": "bottom-right",
}

ACTION_KEYWORDS = {
    "add": "add",
    "generate": "add",
    "create": "add",
    "design": "add",
    "place": "add",
    "put": "add",
    "insert": "add",
    "include": "add",
    "remove": "remove",
    "delete": "remove",
    "take out": "remove",
    "clear": "remove",
    "replace": "replace",
    "swap": "replace",
    "change": "replace",
    "switch": "replace",
    "reposition": "reposition",
    "move": "reposition",
    "relocate": "reposition",
    "shift": "reposition",
}


def build_gemini_link(prompt_text):
    """Generate direct URL to Google Gemini with prefilled interior design query."""
    base_url = "https://gemini.google.com/app"
    query = urllib.parse.quote(prompt_text[:800])
    return f"{base_url}?text={query}"


from services.amazon_catalog import (
    AMAZON_PRODUCTS,
    get_room_initial_amazon_bundle,
    search_amazon_products,
    get_amazon_product_by_asin,
    find_affordable_alternatives,
)


def generate_room_options(bed_type_key, budget, room_length=14.0, room_width=12.0, room_height=10.0):
    """
    Generate 3 distinct complete room options tailored for:
    - Room Type / Bed Type (Queen, Master, Luxury, Gaming, Kids, Living, Office)
    - Target Budget (INR)
    - Room Dimensions
    Every single product is backed by a verified real Amazon item with direct link and accurate price.
    """
    bed_type_key = (bed_type_key or "queen").lower().strip()
    room_type = "kids_bedroom" if "kid" in bed_type_key else "master_bedroom" if ("master" in bed_type_key or "king" in bed_type_key or "luxury" in bed_type_key) else "master_bedroom"
    
    # Use real Amazon bundles
    bundles = get_room_initial_amazon_bundle(
        room_type=room_type,
        budget=budget,
        room_length=room_length,
        room_width=room_width,
    )
    
    # Enrich with bed_size_display and bed_spec for UI compatibility
    for opt in bundles:
        bed_spec = BED_TYPES.get(bed_type_key, BED_TYPES.get("queen", {}))
        opt["bed_spec"] = bed_spec
        opt["bed_type"] = bed_type_key
        opt["bed_size_display"] = f"{bed_spec.get('width_ft', 5.0)} ft (Width) × {bed_spec.get('length_ft', 6.7)} ft (Length)"
        opt["room_dimensions"] = {
            "length": room_length,
            "width": room_width,
            "height": room_height,
            "area_sqft": room_length * room_width,
        }
    
    return bundles

