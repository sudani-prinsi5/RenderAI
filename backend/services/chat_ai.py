"""Chat AI service – manages conversational state, guided room type/budget flow,
real Amazon product recommendations, drag-and-drop placement, dynamic budget tracking,
and single-furniture replacement.
"""

import json
import re
import uuid
from datetime import datetime

from services.amazon_catalog import (
    AMAZON_PRODUCTS,
    find_affordable_alternatives,
    get_amazon_product_by_asin,
    get_room_initial_amazon_bundle,
    search_amazon_products,
)
from services.furniture_catalog import (
    ACTION_KEYWORDS,
    BED_TYPES,
    COLOR_KEYWORDS,
    FURNITURE_ALIASES,
    FURNITURE_DEFAULTS,
    POSITION_KEYWORDS,
    SIZE_KEYWORDS,
    build_gemini_link,
    generate_room_options,
)
from services.image_generator import generate_room_variations


def _load_json(text, default=None):
    if default is None:
        default = []
    if not text:
        return default
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default


def _normalize_furniture_name(name):
    name = name.lower().strip()
    return FURNITURE_ALIASES.get(name, name)


ROOM_TYPES_MAP = {
    "master bedroom": "master_bedroom",
    "master": "master_bedroom",
    "kids bedroom": "kids_bedroom",
    "kid bedroom": "kids_bedroom",
    "kids": "kids_bedroom",
    "children bedroom": "kids_bedroom",
    "guest bedroom": "guest_bedroom",
    "guest": "guest_bedroom",
    "living room": "living_room",
    "living": "living_room",
    "hall": "living_room",
    "dining room": "dining_room",
    "dining": "dining_room",
    "office": "office",
    "home office": "office",
    "study room": "office",
    "study": "office",
    "custom": "master_bedroom",
}


def _detect_room_type(message):
    lower = message.lower().strip()
    for phrase, r_type in sorted(ROOM_TYPES_MAP.items(), key=lambda x: len(x[0]), reverse=True):
        if re.search(rf"\b{re.escape(phrase)}\b", lower):
            return r_type
    return None


def _detect_bed_type(message):
    lower = message.lower().strip()
    for key in ["luxury", "gaming", "kids", "master", "queen", "king", "single", "twin"]:
        if re.search(rf"\b{key}\b", lower):
            if key == "king":
                return "master"
            return key
    return None


def _detect_budget_amount(message):
    lower = message.lower().replace(",", "").strip()
    # Match patterns like: 1.5 lakh, 1 lakh, 2 lac
    m_lakh = re.search(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs|l)\b', lower)
    if m_lakh:
        return float(m_lakh.group(1)) * 100000.0

    # Match 50k, 80k
    m_k = re.search(r'(\d+(?:\.\d+)?)\s*k\b', lower)
    if m_k:
        return float(m_k.group(1)) * 1000.0

    # Match ₹ 50000, Rs 50000, 50000 INR
    m_num = re.search(r'(?:₹|rs\.?|inr)?\s*(\d{4,9})', lower)
    if m_num:
        return float(m_num.group(1))

    digits = re.findall(r'\b\d+\b', lower)
    for d in digits:
        val = float(d)
        if val >= 5000:
            return val

    return None


def _detect_action(message):
    lower = message.lower()
    for keyword, action in ACTION_KEYWORDS.items():
        if keyword in lower:
            return action
    return "add"


def _detect_furniture_type(message):
    lower = message.lower()
    if any(
        phrase in lower
        for phrase in (
            "full room",
            "full bedroom",
            "complete room",
            "design room",
            "furnish room",
            "design the room",
        )
    ):
        return "__full_room__"
    candidates = sorted(
        list(FURNITURE_DEFAULTS.keys()) + list(FURNITURE_ALIASES.keys()) + [
            "curtain", "curtains", "decor", "rug", "bunk bed", "nightstand",
            "side table", "study desk", "wardrobe", "almirah", "sofa", "couch"
        ],
        key=len,
        reverse=True,
    )
    for name in candidates:
        if re.search(rf"\b{re.escape(name)}s?\b", lower):
            norm = _normalize_furniture_name(name)
            if "curtain" in norm:
                return "curtains"
            if "rug" in norm or "decor" in norm:
                return "decor"
            return norm
    return None


def _detect_position(message, furniture_type=None):
    lower = message.lower()
    for keyword, position in POSITION_KEYWORDS.items():
        if keyword in lower:
            return position

    if furniture_type:
        defaults = {
            "bed": "center",
            "sofa": "bottom-left",
            "wardrobe": "right",
            "tv": "bottom-right",
            "table": "center",
            "dining table": "center",
            "desk": "bottom-left",
            "lamp": "bottom-right",
            "chair": "bottom-left",
            "curtains": "right",
            "decor": "center",
        }
        return defaults.get(furniture_type, "center")
    return "center"


def _calculate_budget_summary(furniture_state, total_budget):
    total_budget = float(total_budget or 50000.0)
    used_amount = sum(float(item.get("price", 0.0)) for item in furniture_state)
    remaining_balance = max(0.0, total_budget - used_amount)
    is_over_budget = used_amount > total_budget
    over_by = used_amount - total_budget if is_over_budget else 0.0

    return {
        "budget": total_budget,
        "used": used_amount,
        "remaining": remaining_balance,
        "is_over_budget": is_over_budget,
        "over_by": over_by,
        "item_count": len(furniture_state),
    }


def format_breakdown_reply(selected_option, room):
    """
    Formats the detailed itemized breakdown text for the selected room design,
    linking each item directly to its Amazon India page with price and rating.
    """
    items = selected_option.get("furniture_items", [])
    total_cost = selected_option.get("total_price", sum(it.get("price", 0) for it in items))
    user_budget = selected_option.get("budget") or getattr(room, "budget", 50000.0) or 50000.0
    savings = max(0.0, user_budget - total_cost)

    r_len = room.room_length or 14.0 if room else 14.0
    r_wid = room.room_width or 12.0 if room else 12.0
    r_hgt = room.room_height or 10.0 if room else 10.0
    room_area = r_len * r_wid

    lines = []
    lines.append(f"🎉 **{selected_option.get('title', 'Selected Room Design')}** has been applied to your room layout!")
    lines.append(f"• **Style & Theme:** {selected_option.get('style', 'Modern')} · {selected_option.get('theme_color', '')}")
    lines.append(f"• **Room Space:** {r_len}×{r_wid}×{r_hgt} ft ({room_area:.0f} sq.ft area)\n")

    lines.append("🛍️ **Included Amazon Furniture Products:**")
    for idx, it in enumerate(items, 1):
        amazon_link = it.get("amazon_url", f"https://www.amazon.in/dp/{it.get('asin', '')}")
        rating_str = f"⭐ {it.get('rating', 4.3)}" if it.get("rating") else ""
        lines.append(
            f"{idx}. [{it.get('label', it.get('name', 'Furniture'))}]({amazon_link}) {rating_str}\n"
            f"   - **Dimensions:** {it.get('width_ft', 0)} ft (W) × {it.get('length_ft', 0)} ft (L) | Placement: {it.get('position', 'center')}\n"
            f"   - **Amazon Price:** ₹{it.get('price', 0):,.2f}"
        )

    lines.append("\n💰 **Budget Breakdown:**")
    lines.append(f"• **Total Selected Products:** ₹{total_cost:,.2f}")
    lines.append(f"• **Your Budget:** ₹{user_budget:,.2f}")
    if savings > 0:
        lines.append(f"• **Remaining Budget:** ₹{savings:,.2f} (✅ Under Budget)")
    else:
        lines.append("• **Remaining Budget:** ₹0.00 (✅ Fully Optimized)")

    lines.append("\n👉 *You can customize this layout one item at a time! Say **'Change the bed'**, **'Add a sofa'**, or drag new Amazon products into the room canvas.*")

    return "\n".join(lines)


def process_message(message, room):
    furniture_state = _load_json(room.furniture_state, [])
    chat_history = _load_json(room.chat_history, [])
    lower_msg = message.lower().strip()

    r_len = room.room_length or 14.0 if room else 14.0
    r_wid = room.room_width or 12.0 if room else 12.0
    r_hgt = room.room_height or 10.0 if room else 10.0
    user_budget = getattr(room, "budget", 50000.0) or 50000.0

    # Load cached room options / details
    details = _load_json(room.detection_details, {}) if isinstance(room.detection_details, str) else (room.detection_details or {})
    if not isinstance(details, dict):
        details = {}
    saved_options = details.get("cached_options", None)
    current_room_type = details.get("selected_room_type", "master_bedroom")

ROOM_CATEGORY_SUGGESTIONS = {
    "master_bedroom": [
        {"key": "bed", "label": "Bed", "icon": "🛏️", "desc": "King / Queen storage beds & designer headboards"},
        {"key": "wardrobe", "label": "Wardrobe", "icon": "🚪", "desc": "3-Door / 4-Door wardrobes with mirrors & storage"},
        {"key": "table", "label": "Bedside Table", "icon": "🪵", "desc": "Solid wood & floating nightstands"},
        {"key": "lamp", "label": "Ambient Lamp", "icon": "💡", "desc": "Warm bedside & floor tripod lamps"},
        {"key": "desk", "label": "Study / Vanity Desk", "icon": "💻", "desc": "Compact workspace & organizer desks"},
        {"key": "sofa", "label": "Accent Seating", "icon": "🛋️", "desc": "Comfortable bedroom lounge seating"},
        {"key": "tv", "label": "TV Media Unit", "icon": "📺", "desc": "Wall mounted TV unit & consoles"},
        {"key": "curtains", "label": "Curtains & Rugs", "icon": "🪟", "desc": "Blackout drapes & plush geometric rugs"},
    ],
    "kids_bedroom": [
        {"key": "bed", "label": "Kids / Bunk Bed", "icon": "🧸", "desc": "Single storage beds & modular bunk beds"},
        {"key": "wardrobe", "label": "Kids Wardrobe", "icon": "🚪", "desc": "Child-safe rounded multi-compartment closets"},
        {"key": "desk", "label": "Study Desk & Chair", "icon": "💻", "desc": "Ergonomic study tables with book racks"},
        {"key": "lamp", "label": "Night Lamp", "icon": "💡", "desc": "Soft ambient LED lamps & bedside lights"},
        {"key": "decor", "label": "Play Rug & Decor", "icon": "🖼️", "desc": "Vibrant soft rugs & wall shelving"},
    ],
    "guest_bedroom": [
        {"key": "bed", "label": "Queen Bed", "icon": "🛏️", "desc": "Comfortable Queen beds with under-bed storage"},
        {"key": "wardrobe", "label": "2-Door Wardrobe", "icon": "🚪", "desc": "Compact wardrobe with luggage rack space"},
        {"key": "table", "label": "Nightstand", "icon": "🪵", "desc": "Bedside table with drawer"},
        {"key": "lamp", "label": "Bedside Lamp", "icon": "💡", "desc": "Soft reading light"},
        {"key": "curtains", "label": "Curtains", "icon": "🪟", "desc": "Privacy & blackout drapes"},
    ],
    "living_room": [
        {"key": "sofa", "label": "Sofa / Lounger", "icon": "🛋️", "desc": "3-Seater sofas & L-shape sectional loungers"},
        {"key": "table", "label": "Coffee Table", "icon": "🪵", "desc": "Solid wood & glass center tables"},
        {"key": "tv", "label": "TV Media Unit", "icon": "📺", "desc": "Floating TV cabinets & entertainment consoles"},
        {"key": "chair", "label": "Accent Armchair", "icon": "🪑", "desc": "Velvet & ergonomic lounge armchairs"},
        {"key": "lamp", "label": "Tripod Floor Lamp", "icon": "💡", "desc": "Modern corner illumination"},
        {"key": "curtains", "label": "Curtains & Rugs", "icon": "🪟", "desc": "Living room area rugs & sheer curtains"},
    ],
    "dining_room": [
        {"key": "table", "label": "Dining Table Set", "icon": "🍽️", "desc": "Solid Sheesham 4/6-seater dining sets"},
        {"key": "chair", "label": "Dining Chairs", "icon": "🪑", "desc": "Upholstered high-back dining chairs"},
        {"key": "wardrobe", "label": "Buffet Sideboard", "icon": "🪵", "desc": "Crockery storage & accent credenza"},
        {"key": "lamp", "label": "Pendant Light / Lamp", "icon": "💡", "desc": "Warm dining chandelier & lighting"},
        {"key": "decor", "label": "Area Rug", "icon": "🖼️", "desc": "Stain-resistant dining area rug"},
    ],
    "office": [
        {"key": "desk", "label": "Executive Desk", "icon": "💻", "desc": "Large study workstation & cable management desk"},
        {"key": "chair", "label": "Ergonomic Chair", "icon": "🪑", "desc": "High-back mesh chair with lumbar support"},
        {"key": "wardrobe", "label": "Bookcase / Storage", "icon": "🚪", "desc": "Multi-tier file & book organizer"},
        {"key": "lamp", "label": "Task Lamp", "icon": "💡", "desc": "Focused LED desk reading lamp"},
        {"key": "sofa", "label": "Lounge Chair", "icon": "🛋️", "desc": "Comfortable visitor/reading chair"},
    ],
}


def get_categories_for_room(room_type):
    return ROOM_CATEGORY_SUGGESTIONS.get(room_type, ROOM_CATEGORY_SUGGESTIONS["master_bedroom"])


def process_message(message, room):
    furniture_state = _load_json(room.furniture_state, [])
    chat_history = _load_json(room.chat_history, [])
    lower_msg = message.lower().strip()

    r_len = room.room_length or 14.0 if room else 14.0
    r_wid = room.room_width or 12.0 if room else 12.0
    r_hgt = room.room_height or 10.0 if room else 10.0
    user_budget = getattr(room, "budget", 50000.0) or 50000.0

    # Load cached room options / details
    details = _load_json(room.detection_details, {}) if isinstance(room.detection_details, str) else (room.detection_details or {})
    if not isinstance(details, dict):
        details = {}
    saved_options = details.get("cached_options", None)
    current_room_type = details.get("selected_room_type", "master_bedroom")

    # -------------------------------------------------------------
    # STAGE 1: Detect Room Type (Master Bedroom, Kids Bedroom, Living Room, etc.)
    # -------------------------------------------------------------
    detected_room_type = _detect_room_type(lower_msg)
    detected_bed = _detect_bed_type(lower_msg)

    # Check if last AI message asked for room type or this is beginning of conversation
    is_asking_room_type = (
        len(chat_history) <= 2 or
        any("type of room" in (m.get("text", "").lower()) for m in chat_history[-2:]) or
        detected_room_type is not None
    )

    if detected_room_type and is_asking_room_type and not ("budget" in lower_msg or _detect_budget_amount(lower_msg)):
        room_type_name = detected_room_type.replace("_", " ").title()
        details["selected_room_type"] = detected_room_type
        if detected_bed:
            details["selected_bed_type"] = detected_bed
        room.detection_details = json.dumps(details)

        category_options = get_categories_for_room(detected_room_type)

        ai_reply = (
            f"Great choice! 🏡 **{room_type_name}** selected for your {r_len}×{r_wid} ft space.\n\n"
            f"**What would you like to add first?**\n"
            f"Select a furniture category below to view matching Amazon products and place them into your room:"
        )

        chat_history.append({"sender": "You", "text": message, "timestamp": datetime.utcnow().isoformat()})
        chat_history.append({
            "sender": "AI",
            "text": ai_reply,
            "timestamp": datetime.utcnow().isoformat(),
            "step": "ask_first_item",
            "room_type": detected_room_type,
            "category_options": category_options,
        })

        return {
            "reply": ai_reply,
            "action": "ask_first_item",
            "furniture_state": furniture_state,
            "chat_history": chat_history,
            "changed": False,
            "step": "ask_first_item",
            "room_type": detected_room_type,
            "category_options": category_options,
            "budget_summary": _calculate_budget_summary(furniture_state, user_budget),
        }

    # -------------------------------------------------------------
    # STAGE 3: Select Complete Room Option (Option 1, 2, or 3)
    # -------------------------------------------------------------
    opt_match = re.search(r'\b(?:room|option|design|choice|select|pick|number|#)?\s*([1-3])\b', lower_msg)
    if opt_match and (saved_options or "option" in lower_msg or "room" in lower_msg or "design" in lower_msg or len(lower_msg) <= 12):
        chosen_num = int(opt_match.group(1))
        if not saved_options:
            r_type = details.get("selected_room_type", "master_bedroom")
            saved_options = get_room_initial_amazon_bundle(r_type, user_budget, r_len, r_wid)
            saved_options = generate_room_variations(room, saved_options)

        selected_opt = next((o for o in saved_options if o["option_id"] == chosen_num), saved_options[0])
        furniture_state = selected_opt["furniture_items"]
        room.furniture_state = json.dumps(furniture_state)
        if selected_opt.get("image_path"):
            room.generated_image_path = selected_opt["image_path"]

        ai_reply = format_breakdown_reply(selected_opt, room)

        chat_history.append({"sender": "You", "text": message, "timestamp": datetime.utcnow().isoformat()})
        chat_history.append({
            "sender": "AI",
            "text": ai_reply,
            "timestamp": datetime.utcnow().isoformat(),
            "step": "room_selected",
            "selected_option": selected_opt,
            "furniture_items": furniture_state,
            "imageUrl": selected_opt.get("image_path"),
            "gemini_link": selected_opt.get("gemini_link"),
        })

        return {
            "reply": ai_reply,
            "action": "room_selected",
            "furniture_state": furniture_state,
            "furniture_items": furniture_state,
            "chat_history": chat_history,
            "selected_option": selected_opt,
            "generated_image": selected_opt.get("image_path"),
            "changed": True,
            "step": "room_selected",
            "budget_summary": _calculate_budget_summary(furniture_state, user_budget),
        }

    # -------------------------------------------------------------
    # STAGE 4: One-by-One Furniture Addition, Search & Replacement
    # -------------------------------------------------------------
    action = _detect_action(message)
    furniture_type = _detect_furniture_type(message)
    budget_summary = _calculate_budget_summary(furniture_state, user_budget)

    # 1. Product Search / Specific request (e.g., "Show me queen wooden bed under 30000", "Add bed", "Wardrobe")
    if furniture_type and (action == "add" or "show" in lower_msg or "find" in lower_msg or "options" in lower_msg or len(lower_msg.split()) <= 4):
        # Search real Amazon products for this category
        matched_products = search_amazon_products(
            category=furniture_type,
            room_type=current_room_type,
            max_price=None,
            query=message if len(message) > 5 else None,
            limit=6,
        )

        ai_reply = (
            f"📦 Found **{len(matched_products)} Amazon {furniture_type.title()} options** with verified prices & ratings.\n\n"
            f"• **Remaining Budget:** ₹{budget_summary['remaining']:,.2f}\n"
            f"• **Action:** Click **'Add to Room'** on any product card, or **drag and drop** the product directly into the room canvas!"
        )

        chat_history.append({"sender": "You", "text": message, "timestamp": datetime.utcnow().isoformat()})
        chat_history.append({
            "sender": "AI",
            "text": ai_reply,
            "timestamp": datetime.utcnow().isoformat(),
            "step": "product_options",
            "amazon_products": matched_products,
            "furniture_type": furniture_type,
        })

        return {
            "reply": ai_reply,
            "action": "product_options",
            "furniture_type": furniture_type,
            "amazon_products": matched_products,
            "furniture_state": furniture_state,
            "furniture_items": furniture_state,
            "chat_history": chat_history,
            "changed": False,
            "step": "product_options",
            "budget_summary": budget_summary,
        }

    # 2. Product Replacement ("Change the bed", "Replace wardrobe", "Swap sofa")
    if action == "replace" or ("change" in lower_msg or "swap" in lower_msg or "switch" in lower_msg):
        target_cat = furniture_type or "bed"
        # Find Amazon alternatives in this category
        matched_products = search_amazon_products(
            category=target_cat,
            room_type=current_room_type,
            limit=6,
        )

        ai_reply = (
            f"🔄 Here are alternative **Amazon {target_cat.title()}** options to replace your current {target_cat}.\n"
            f"Select any option below to swap it seamlessly without altering the rest of your room!"
        )

        chat_history.append({"sender": "You", "text": message, "timestamp": datetime.utcnow().isoformat()})
        chat_history.append({
            "sender": "AI",
            "text": ai_reply,
            "timestamp": datetime.utcnow().isoformat(),
            "step": "replace_options",
            "amazon_products": matched_products,
            "furniture_type": target_cat,
        })

        return {
            "reply": ai_reply,
            "action": "replace_options",
            "furniture_type": target_cat,
            "amazon_products": matched_products,
            "furniture_state": furniture_state,
            "furniture_items": furniture_state,
            "chat_history": chat_history,
            "changed": False,
            "step": "replace_options",
            "budget_summary": budget_summary,
        }

    # 3. Product Removal ("Remove lamp", "Delete wardrobe")
    if action == "remove" and furniture_type:
        initial_len = len(furniture_state)
        furniture_state = [it for it in furniture_state if it.get("name", "").lower() != furniture_type and furniture_type not in it.get("label", "").lower()]
        removed_count = initial_len - len(furniture_state)

        updated_summary = _calculate_budget_summary(furniture_state, user_budget)
        if removed_count > 0:
            ai_reply = (
                f"🗑️ Removed {removed_count} {furniture_type}(s) from your room design.\n\n"
                f"💰 **Updated Budget:** ₹{updated_summary['used']:,.2f} spent, **₹{updated_summary['remaining']:,.2f} remaining**."
            )
        else:
            ai_reply = f"No {furniture_type} was found in your current room design to remove."

        chat_history.append({"sender": "You", "text": message, "timestamp": datetime.utcnow().isoformat()})
        chat_history.append({"sender": "AI", "text": ai_reply, "timestamp": datetime.utcnow().isoformat()})

        return {
            "reply": ai_reply,
            "action": "remove",
            "furniture_type": furniture_type,
            "furniture_state": furniture_state,
            "furniture_items": furniture_state,
            "chat_history": chat_history,
            "changed": True,
            "budget_summary": updated_summary,
        }

    # 4. Default Assistant Response with Next-Step Recommendations
    ai_reply = (
        "I'm your AI Interior Designer & Amazon Furniture Assistant! 🛋️\n\n"
        "You can:\n"
        "• **Search & Add Furniture:** *'Show me Queen Beds'*, *'Add a 3-door wardrobe'*, *'Modern study desk'*\n"
        "• **Drag & Drop:** Drag any Amazon product card directly into your room canvas\n"
        "• **Replace an Item:** *'Change the bed'*, *'Replace sofa'*\n"
        "• **Track Budget:** Budget updates automatically after each product addition."
    )

    chat_history.append({"sender": "You", "text": message, "timestamp": datetime.utcnow().isoformat()})
    chat_history.append({"sender": "AI", "text": ai_reply, "timestamp": datetime.utcnow().isoformat()})

    return {
        "reply": ai_reply,
        "action": "chat",
        "furniture_state": furniture_state,
        "furniture_items": furniture_state,
        "chat_history": chat_history,
        "changed": False,
        "budget_summary": budget_summary,
    }
