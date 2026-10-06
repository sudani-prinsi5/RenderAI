import json
import os
import uuid
import base64
from datetime import datetime
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

from extensions import db
from models import RoomUpload
from services.amazon_catalog import (
    AMAZON_PRODUCTS,
    find_affordable_alternatives,
    get_amazon_product_by_asin,
    get_room_initial_amazon_bundle,
    search_amazon_products,
)
from services.chat_ai import format_breakdown_reply, process_message
from services.furniture_catalog import BED_TYPES, build_gemini_link, generate_room_options
from services.image_generator import generate_design_image, generate_room_variations
from services.object_extractor import extract_and_segment_object
from services.room_cleaner import detect_room_objects, remove_room_object

chat = Blueprint("chat", __name__)

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
UPLOAD_FOLDER = os.path.join(ROOT_DIR, "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def _load_json(text, default=None):
    if default is None:
        default = {}
    if not text:
        return default
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default


def _heal_item(item):
    if not isinstance(item, dict):
        return item
    asin = item.get("asin", "")
    prod = get_amazon_product_by_asin(asin) if asin else None
    if not prod:
        # Try category / title match
        candidates = search_amazon_products(category=item.get("name"), query=item.get("label"), limit=1)
        if candidates:
            prod = candidates[0]

    if prod:
        if not item.get("image_url") or "media-amazon.com" in item.get("image_url", ""):
            item["image_url"] = prod["image_url"]
        item["amazon_url"] = f"https://www.amazon.in/dp/{prod['asin']}"
        if not item.get("price"):
            item["price"] = prod["price"]
        if not item.get("label"):
            item["label"] = prod["title"]
    else:
        if not item.get("image_url") or "media-amazon.com" in item.get("image_url", ""):
            item["image_url"] = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600"
        if item.get("asin"):
            item["amazon_url"] = f"https://www.amazon.in/dp/{item['asin']}"
    return item


def _serialize_room(room):
    details = _load_json(room.detection_details, {})
    room_options = details.get("cached_options", []) if isinstance(details, dict) else []
    selected_bed_type = details.get("selected_bed_type", "queen") if isinstance(details, dict) else "queen"
    selected_room_type = details.get("selected_room_type", "master_bedroom") if isinstance(details, dict) else "master_bedroom"
    furniture_state = _load_json(room.furniture_state, [])
    chat_history = _load_json(room.chat_history, [])
    budget = room.budget or 50000.0

    # Heal furniture state
    furniture_state = [_heal_item(it) for it in furniture_state]

    # Heal room options
    if room_options:
        for opt in room_options:
            if "furniture_items" in opt:
                opt["furniture_items"] = [_heal_item(it) for it in opt["furniture_items"]]
            if "amazon_products" in opt:
                opt["amazon_products"] = [_heal_item(p) for p in opt["amazon_products"]]
            if not opt.get("image_path"):
                try:
                    from services.image_generator import render_realistic_room_option_image
                    opt["image_path"] = render_realistic_room_option_image(
                        opt,
                        room.room_length or 14.0,
                        room.room_width or 12.0,
                        room.room_height or 10.0,
                    )
                except Exception:
                    pass

    # Heal chat history
    for msg in chat_history:
        if msg.get("furniture_items"):
            msg["furniture_items"] = [_heal_item(it) for it in msg["furniture_items"]]
        if msg.get("room_options"):
            for opt in msg["room_options"]:
                if "furniture_items" in opt:
                    opt["furniture_items"] = [_heal_item(it) for it in opt["furniture_items"]]
                if "amazon_products" in opt:
                    opt["amazon_products"] = [_heal_item(p) for p in opt["amazon_products"]]
        if msg.get("amazon_products"):
            msg["amazon_products"] = [_heal_item(p) for p in msg["amazon_products"]]
        if msg.get("budget_alternatives"):
            msg["budget_alternatives"] = [_heal_item(p) for p in msg["budget_alternatives"]]

    used_amount = sum(float(it.get("price", 0.0)) for it in furniture_state)
    remaining_budget = max(0.0, budget - used_amount)

    details = _load_json(room.detection_details, {})
    detected_objects_list = []
    if isinstance(details, dict):
        detected_objects_list = details.get("detected_objects", [])
    elif isinstance(details, list):
        detected_objects_list = details

    if not detected_objects_list and room.original_image_path and not room.is_empty_room:
        try:
            detected_objects_list = detect_room_objects(room.original_image_path)
            if detected_objects_list:
                if isinstance(details, dict):
                    details["detected_objects"] = detected_objects_list
                    room.detection_details = json.dumps(details)
                else:
                    room.detection_details = json.dumps({"detected_objects": detected_objects_list})
                db.session.commit()
        except Exception as e:
            print(f"Auto-detection error in _serialize_room: {e}")

    return {
        "room_id": room.id,
        "original_image": room.original_image_path,
        "detected_image": room.detected_image_path,
        "objects": room.detected_objects,
        "detected_objects_list": detected_objects_list,
        "object_counts": _load_json(room.object_counts, {}),
        "total_objects": room.total_objects or len(detected_objects_list),
        "is_empty_room": room.is_empty_room,
        "room_length": room.room_length or 14.0,
        "room_width": room.room_width or 12.0,
        "room_height": room.room_height or 10.0,
        "budget": budget,
        "used_amount": used_amount,
        "remaining_budget": remaining_budget,
        "is_over_budget": used_amount > budget,
        "furniture_state": furniture_state,
        "furniture_items": furniture_state,
        "chat_history": chat_history,
        "generated_image": room.generated_image_path,
        "room_options": room_options,
        "selected_bed_type": selected_bed_type,
        "selected_room_type": selected_room_type,
        "status": room.status,
    }


def _get_room(room_id=None, user_id=None):
    if not user_id:
        return None
    try:
        u_id = int(user_id)
    except (ValueError, TypeError):
        return None

    if room_id:
        try:
            r_id = int(room_id)
            return RoomUpload.query.filter_by(id=r_id, user_id=u_id).first()
        except (ValueError, TypeError):
            return None
    return RoomUpload.query.filter_by(user_id=u_id).order_by(RoomUpload.id.desc()).first()


@chat.route("/latest-room", methods=["GET"])
def latest_room():
    room_id = request.args.get("room_id", type=int)
    user_id = request.args.get("user_id", type=int)

    if not user_id:
        return jsonify({"success": False, "message": "Authentication required. user_id is missing."}), 401

    room = _get_room(room_id=room_id, user_id=user_id)

    if room is None:
        return jsonify({"success": False, "message": "No room found for this user."}), 404

    data = _serialize_room(room)
    data["success"] = True
    return jsonify(data)


@chat.route("/chat/init-room", methods=["POST"])
def init_room():
    """
    Initializes a new room for AI Chat with dimensions and optional photo.
    If room is empty: asks for room type (Master Bedroom, Kids Bedroom, Living Room, etc.).
    If room is furnished: analyzes detected objects and starts chat.
    """
    try:
        is_multipart = request.content_type and "multipart/form-data" in request.content_type
        image_file = None

        if is_multipart:
            room_length = float(request.form.get("room_length") or 14.0)
            room_width = float(request.form.get("room_width") or 12.0)
            room_height = float(request.form.get("room_height") or 10.0)
            is_empty_room = request.form.get("is_empty_room", "true").lower() in ("true", "1", "yes")
            raw_user_id = request.form.get("user_id")
            if "image" in request.files and request.files["image"].filename:
                image_file = request.files["image"]
        else:
            data = request.get_json() or {}
            room_length = float(data.get("room_length") or 14.0)
            room_width = float(data.get("room_width") or 12.0)
            room_height = float(data.get("room_height") or 10.0)
            is_empty_room = bool(data.get("is_empty_room", True))
            raw_user_id = data.get("user_id")

        if not raw_user_id:
            return jsonify({"success": False, "message": "Authentication required. user_id is missing."}), 401

        try:
            user_id = int(raw_user_id)
        except (ValueError, TypeError):
            return jsonify({"success": False, "message": "Invalid user_id."}), 400

        original_image_name = None
        original_image_path = None
        detected_image_path = None

        detected_objects_found = []
        if image_file:
            filename = secure_filename(f"room_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{image_file.filename}")
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            image_file.save(filepath)
            original_image_name = filename
            original_image_path = f"/uploads/{filename}"
            detected_image_path = original_image_path
            
            if not is_empty_room:
                try:
                    detected_objects_found = detect_room_objects(filepath)
                except Exception as e:
                    print(f"Object detection error during init-room: {e}")
        else:
            is_empty_room = True

        if is_empty_room:
            welcome_text = (
                f"I've analyzed your room ({room_length}×{room_width}×{room_height} ft). "
                f"It appears to be an empty room. 🏡\n\n"
                f"**What type of room would you like to create?**\n"
                f"Please choose or type: **Master Bedroom**, **Kids Bedroom**, **Guest Bedroom**, **Living Room**, **Dining Room**, or **Office**."
            )
            step = "ask_room_type"
        else:
            if detected_objects_found:
                obj_labels = ", ".join(o["label"] for o in detected_objects_found[:4])
                welcome_text = (
                    f"I've analyzed your uploaded room space ({room_length}×{room_width}×{room_height} ft). 🛋️\n\n"
                    f"I detected existing furniture: **{obj_labels}**.\n\n"
                    f"You can click on any existing furniture object in your room canvas to cleanly remove it, or start adding new designer pieces directly."
                )
            else:
                welcome_text = (
                    f"I've analyzed your uploaded room photo ({room_length}×{room_width}×{room_height} ft). "
                    f"Your existing room walls, floors, and architecture are safely preserved! 🛋️\n\n"
                    f"**What type of room makeover would you like to create?**\n"
                    f"(e.g., Master Bedroom, Living Room, Kids Bedroom, or Office)."
                )
            step = "ask_room_type"

        initial_chat = [
            {
                "sender": "AI",
                "text": welcome_text,
                "timestamp": datetime.utcnow().isoformat(),
                "step": step,
            }
        ]

        new_room = RoomUpload(
            user_id=user_id,
            original_image_name=original_image_name,
            original_image_path=original_image_path,
            detected_image_name=original_image_name,
            detected_image_path=detected_image_path,
            detected_objects="Empty room" if is_empty_room else (",".join(o["name"] for o in detected_objects_found) if detected_objects_found else "Custom room"),
            total_objects=len(detected_objects_found),
            status="Empty Room" if is_empty_room else "Uploaded",
            object_counts=json.dumps({}),
            detection_details=json.dumps({"selected_room_type": "master_bedroom", "detected_objects": detected_objects_found}),
            room_length=room_length,
            room_width=room_width,
            room_height=room_height,
            is_empty_room=is_empty_room,
            furniture_state=json.dumps([]),
            chat_history=json.dumps(initial_chat),
            budget=50000.0,
        )

        db.session.add(new_room)
        db.session.commit()

        serialized = _serialize_room(new_room)
        serialized["success"] = True
        serialized["initial_message"] = welcome_text
        serialized["step"] = step
        serialized["detected_objects_list"] = detected_objects_found

        return jsonify(serialized), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/chat/select-option", methods=["POST"])
def select_option():
    """
    Directly applies a selected room option (Option 1, 2, or 3) populated with real Amazon products.
    """
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        option_id = int(data.get("option_id", 1))

        room = _get_room(room_id, user_id)
        if room is None:
            return jsonify({"success": False, "message": "Room not found."}), 404

        details = _load_json(room.detection_details, {})
        cached = details.get("cached_options", []) if isinstance(details, dict) else []

        if not cached:
            r_type = details.get("selected_room_type", "master_bedroom") if isinstance(details, dict) else "master_bedroom"
            b_val = room.budget or 50000.0
            r_l = room.room_length or 14.0
            r_w = room.room_width or 12.0
            cached = get_room_initial_amazon_bundle(r_type, b_val, r_l, r_w)
            cached = generate_room_variations(room, cached)
            details["cached_options"] = cached
            room.detection_details = json.dumps(details)

        selected = next((o for o in cached if o["option_id"] == option_id), cached[0])

        room.furniture_state = json.dumps(selected["furniture_items"])
        if selected.get("image_path"):
            room.generated_image_path = selected["image_path"]

        ai_reply = format_breakdown_reply(selected, room)

        chat_history = _load_json(room.chat_history, [])
        chat_history.append({"sender": "You", "text": f"Select {selected['title']}", "timestamp": datetime.utcnow().isoformat()})
        chat_history.append({
            "sender": "AI",
            "text": ai_reply,
            "timestamp": datetime.utcnow().isoformat(),
            "step": "room_selected",
            "selected_option": selected,
            "furniture_items": selected["furniture_items"],
            "imageUrl": selected.get("image_path"),
            "gemini_link": selected.get("gemini_link"),
        })
        room.chat_history = json.dumps(chat_history)

        db.session.commit()

        serialized = _serialize_room(room)

        return jsonify({
            "success": True,
            "reply": ai_reply,
            "action": "room_selected",
            "furniture_items": selected["furniture_items"],
            "furniture_state": selected["furniture_items"],
            "generated_image": selected.get("image_path"),
            "selected_option": selected,
            "gemini_link": selected.get("gemini_link"),
            "room_id": room.id,
            "chat_history": chat_history,
            "used_amount": serialized["used_amount"],
            "remaining_budget": serialized["remaining_budget"],
            "is_over_budget": serialized["is_over_budget"],
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/chat/products", methods=["GET"])
def get_products():
    """
    Search and retrieve genuine Amazon furniture products with filters.
    """
    try:
        category = request.args.get("category")
        room_type = request.args.get("room_type")
        max_price = request.args.get("max_price", type=float)
        query = request.args.get("query")
        limit = request.args.get("limit", 12, type=int)

        products = search_amazon_products(
            category=category,
            room_type=room_type,
            max_price=max_price,
            query=query,
            limit=limit,
        )

        return jsonify({
            "success": True,
            "count": len(products),
            "products": products,
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


def _calculate_realistic_placement(category, existing_items, custom_x=None, custom_y=None):
    if custom_x is not None and custom_y is not None:
        return float(custom_x), float(custom_y), "selected drop location"

    cat = (category or "").lower()
    if "bed" in cat:
        return 50.0, 60.0, "central headwall"
    elif "wardrobe" in cat or "almirah" in cat or "closet" in cat:
        return 82.0, 40.0, "accent side wall"
    elif "table" in cat or "nightstand" in cat or "side table" in cat:
        tables = [it for it in existing_items if "table" in it.get("name", "").lower() or "nightstand" in it.get("label", "").lower()]
        if len(tables) == 0:
            return 24.0, 66.0, "left bedside"
        return 76.0, 66.0, "right bedside"
    elif "desk" in cat or "workstation" in cat:
        return 22.0, 48.0, "study workspace"
    elif "chair" in cat:
        return 24.0, 62.0, "desk seating area"
    elif "lamp" in cat or "light" in cat:
        return 16.0, 72.0, "ambient lighting corner"
    elif "sofa" in cat or "couch" in cat:
        return 50.0, 65.0, "central lounge seating"
    elif "tv" in cat or "media" in cat:
        return 50.0, 35.0, "media focal wall"
    elif "curtain" in cat:
        return 86.0, 28.0, "window perimeter"
    elif "decor" in cat or "rug" in cat:
        return 50.0, 80.0, "room floor accent"
    else:
        idx = len(existing_items)
        x = 35.0 + (idx * 18.0) % 40.0
        y = 50.0 + (idx * 12.0) % 35.0
        return x, y, "accent area"


@chat.route("/chat/add-product", methods=["POST"])
def add_product():
    """
    Directly adds an Amazon furniture product to the room (via button or drag-and-drop).
    Places it at realistic perspective coordinates and prompts for the next item.
    """
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        asin = data.get("asin")
        product_data = data.get("product")
        pos_x = data.get("pos_x")  # Optional percentage (0-100) for custom placement
        pos_y = data.get("pos_y")

        room = _get_room(room_id, user_id)
        if room is None:
            return jsonify({"success": False, "message": "Room not found."}), 404

        # Retrieve product info
        product = None
        if asin:
            product = get_amazon_product_by_asin(asin)
        if not product and product_data:
            product = product_data

        if not product:
            return jsonify({"success": False, "message": "Product not found."}), 400

        furniture_state = _load_json(room.furniture_state, [])
        user_budget = room.budget or 50000.0
        current_used = sum(float(it.get("price", 0.0)) for it in furniture_state)
        item_price = float(product.get("price", 0.0))

        # Calculate realistic placement coordinates
        calc_x, calc_y, placement_desc = _calculate_realistic_placement(
            product.get("category"), furniture_state, pos_x, pos_y
        )

        item_id = data.get("item_id") or (product_data.get("id") if isinstance(product_data, dict) else None) or f"{product.get('category', 'item')}_{str(uuid.uuid4())[:6]}"
        dim = product.get("dimensions", {}) if isinstance(product.get("dimensions"), dict) else {}
        length_ft = dim.get("length_ft", 4.0)
        width_ft = dim.get("width_ft", 2.5)
        height_ft = dim.get("height_ft", 3.0)

        category_name = product.get("category") or product.get("name", "furniture")
        new_item = {
            "id": item_id,
            "datasetId": product.get("datasetId") or product.get("id"),
            "asin": product.get("asin", ""),
            "name": product.get("name") or category_name,
            "category": category_name,
            "label": product.get("label") or product.get("title", "Furniture Piece"),
            "size": product.get("sub_category", "standard"),
            "color": product.get("color", "Standard"),
            "length_ft": length_ft,
            "width_ft": width_ft,
            "height_ft": height_ft,
            "price": item_price,
            "rating": product.get("rating", 4.3),
            "image_url": product.get("image_url", ""),
            "amazon_url": product.get("amazon_url", f"https://www.amazon.in/dp/{product.get('asin', '')}"),
            "position": placement_desc,
            "pos_x": calc_x,
            "pos_y": calc_y,
            "scale": float(product_data.get("scale", 1.0)) if isinstance(product_data, dict) and "scale" in product_data else 1.0,
            "rotation": float(product_data.get("rotation", 0.0)) if isinstance(product_data, dict) and "rotation" in product_data else 0.0,
            "description": product.get("description", ""),
        }

        # Check budget alert
        new_total = current_used + item_price
        is_over = new_total > user_budget
        over_by = new_total - user_budget if is_over else 0.0
        budget_alternatives = []

        if is_over:
            remaining_before = max(0.0, user_budget - current_used)
            budget_alternatives = find_affordable_alternatives(product.get("category", "bed"), remaining_before, count=3)

        # Add to state
        furniture_state.append(new_item)
        room.furniture_state = json.dumps(furniture_state)

        # Regenerate photorealistic room render with placed Amazon furniture
        try:
            design_res = generate_design_image(room, furniture_state)
            room.generated_image_path = design_res.get("path")
        except Exception as e:
            print(f"Error generating design image on add: {e}")

        # Get room type and categories for next step
        details = _load_json(room.detection_details, {})
        selected_room_type = details.get("selected_room_type", "master_bedroom") if isinstance(details, dict) else "master_bedroom"
        from services.chat_ai import get_categories_for_room
        category_options = get_categories_for_room(selected_room_type)

        # Generate conversational update
        rem_after = max(0.0, user_budget - new_total)

        if is_over:
            ai_reply = (
                f"⚠️ **Budget Alert:** Adding [{product.get('title')}]({new_item['amazon_url']}) (₹{item_price:,.2f}) "
                f"exceeds your allocated budget of ₹{user_budget:,.2f} by **₹{over_by:,.2f}**.\n\n"
                f"Here are **3 similar Amazon alternatives** within your budget:"
            )
            step = "product_options"
        else:
            ai_reply = (
                f"✅ Added **{new_item['label']}** to your room ({placement_desc})!\n\n"
                f"• **Product Price:** ₹{item_price:,.2f}\n"
                f"• **Total Cart:** ₹{new_total:,.2f} | Remaining Budget: ₹{rem_after:,.2f}\n\n"
                f"**What would you like to add next?**\n"
                f"Select your next furniture piece:"
            )
            step = "ask_next_item"

        chat_history = _load_json(room.chat_history, [])
        chat_history.append({"sender": "You", "text": f"Added {product.get('title')}", "timestamp": datetime.utcnow().isoformat()})
        chat_history.append({
            "sender": "AI",
            "text": ai_reply,
            "timestamp": datetime.utcnow().isoformat(),
            "step": step,
            "budget_alert": is_over,
            "budget_alternatives": budget_alternatives,
            "furniture_items": furniture_state,
            "category_options": category_options,
            "imageUrl": room.generated_image_path,
        })
        room.chat_history = json.dumps(chat_history)

        db.session.commit()

        return jsonify({
            "success": True,
            "reply": ai_reply,
            "added_item": new_item,
            "furniture_items": furniture_state,
            "furniture_state": furniture_state,
            "generated_image": room.generated_image_path,
            "used_amount": new_total,
            "remaining_budget": rem_after,
            "is_over_budget": is_over,
            "over_by": over_by,
            "category_options": category_options,
            "step": step,
            "budget_alternatives": budget_alternatives,
            "chat_history": chat_history,
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/chat/replace-product", methods=["POST"])
def replace_product():
    """
    Replaces an existing placed item in the room with a newly selected Amazon product
    without resetting the rest of the room or removing other items.
    """
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        old_item_id = data.get("old_item_id")
        new_asin = data.get("new_asin")
        new_product_data = data.get("new_product")

        room = _get_room(room_id, user_id)
        if room is None:
            return jsonify({"success": False, "message": "Room not found."}), 404

        new_product = None
        if new_asin:
            new_product = get_amazon_product_by_asin(new_asin)
        if not new_product and new_product_data:
            new_product = new_product_data

        if not new_product:
            return jsonify({"success": False, "message": "New product not found."}), 400

        furniture_state = _load_json(room.furniture_state, [])
        user_budget = room.budget or 50000.0

        # Replace item while keeping position
        old_pos = "center"
        old_pos_x = None
        old_pos_y = None
        replaced = False

        dim = new_product.get("dimensions", {})
        replacement_item = {
            "id": f"{new_product.get('category', 'item')}_{str(uuid.uuid4())[:6]}",
            "asin": new_product.get("asin", ""),
            "name": new_product.get("category", "furniture"),
            "label": new_product.get("title", "Amazon Product"),
            "size": new_product.get("sub_category", "standard"),
            "color": new_product.get("color", "Standard"),
            "length_ft": dim.get("length_ft", 4.0),
            "width_ft": dim.get("width_ft", 2.5),
            "height_ft": dim.get("height_ft", 3.0),
            "price": float(new_product.get("price", 0.0)),
            "rating": new_product.get("rating", 4.3),
            "image_url": new_product.get("image_url", ""),
            "amazon_url": new_product.get("amazon_url", f"https://www.amazon.in/dp/{new_product.get('asin', '')}"),
            "position": old_pos,
            "pos_x": old_pos_x,
            "pos_y": old_pos_y,
            "description": new_product.get("description", ""),
        }

        new_state = []
        for it in furniture_state:
            if (old_item_id and it.get("id") == old_item_id) or (not old_item_id and it.get("name") == new_product.get("category")):
                replacement_item["position"] = it.get("position", "center")
                replacement_item["pos_x"] = it.get("pos_x")
                replacement_item["pos_y"] = it.get("pos_y")
                new_state.append(replacement_item)
                replaced = True
            else:
                new_state.append(it)

        if not replaced:
            new_state.append(replacement_item)

        room.furniture_state = json.dumps(new_state)

        # Regenerate room image
        try:
            design_res = generate_design_image(room, new_state)
            room.generated_image_path = design_res.get("path")
        except Exception as e:
            print(f"Error generating design image on replace: {e}")

        new_total = sum(float(it.get("price", 0.0)) for it in new_state)
        rem_after = max(0.0, user_budget - new_total)

        ai_reply = (
            f"🔄 Successfully replaced with **[{replacement_item['label']}]({replacement_item['amazon_url']})**!\n"
            f"• **New Price:** ₹{replacement_item['price']:,.2f}\n"
            f"• **Updated Remaining Budget:** ₹{rem_after:,.2f}"
        )

        chat_history = _load_json(room.chat_history, [])
        chat_history.append({"sender": "You", "text": f"Replaced with {new_product.get('title')}", "timestamp": datetime.utcnow().isoformat()})
        chat_history.append({"sender": "AI", "text": ai_reply, "timestamp": datetime.utcnow().isoformat()})
        room.chat_history = json.dumps(chat_history)

        db.session.commit()

        return jsonify({
            "success": True,
            "reply": ai_reply,
            "furniture_items": new_state,
            "furniture_state": new_state,
            "generated_image": room.generated_image_path,
            "used_amount": new_total,
            "remaining_budget": rem_after,
            "is_over_budget": new_total > user_budget,
            "chat_history": chat_history,
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/chat/remove-product", methods=["POST"])
def remove_product():
    """
    Removes a specific furniture product from the room canvas and updates budget.
    """
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        item_id = data.get("item_id")

        room = _get_room(room_id, user_id)
        if room is None:
            return jsonify({"success": False, "message": "Room not found."}), 404

        furniture_state = _load_json(room.furniture_state, [])
        user_budget = room.budget or 50000.0

        if item_id == "all":
            new_state = []
        else:
            str_id = str(item_id).strip() if item_id else ""
            new_state = [
                it for it in furniture_state
                if str(it.get("id", "")).strip() != str_id and str(it.get("datasetId", "")).strip() != str_id
            ]
        room.furniture_state = json.dumps(new_state)

        # Regenerate room image or clear if empty
        if new_state:
            try:
                design_res = generate_design_image(room, new_state)
                room.generated_image_path = design_res.get("path")
            except Exception as e:
                print(f"Error generating design image on remove: {e}")
        else:
            room.generated_image_path = None

        new_total = sum(float(it.get("price", 0.0)) for it in new_state)
        rem_after = max(0.0, user_budget - new_total)

        ai_reply = f"🗑️ Item removed from room. Remaining budget: **₹{rem_after:,.2f}**."

        chat_history = _load_json(room.chat_history, [])
        chat_history.append({"sender": "AI", "text": ai_reply, "timestamp": datetime.utcnow().isoformat()})
        room.chat_history = json.dumps(chat_history)

        db.session.commit()

        return jsonify({
            "success": True,
            "reply": ai_reply,
            "furniture_items": new_state,
            "furniture_state": new_state,
            "generated_image": room.generated_image_path,
            "used_amount": new_total,
            "remaining_budget": rem_after,
            "is_over_budget": new_total > user_budget,
            "chat_history": chat_history,
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


def _save_composite_image(room, composite_data):
    if not composite_data or not isinstance(composite_data, str):
        return None
    try:
        if composite_data.startswith("data:image"):
            header, encoded = composite_data.split(",", 1)
            file_ext = "png" if "png" in header else "jpg"
            img_data = base64.b64decode(encoded)
            filename = f"design_room_{room.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.{file_ext}"
            out_dir = os.path.join(UPLOAD_FOLDER, "generated")
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, filename)
            with open(out_path, "wb") as f:
                f.write(img_data)
            room.generated_image_path = f"/uploads/generated/{filename}"
            room.generated_image_name = filename
            return room.generated_image_path
    except Exception as e:
        print(f"Error saving composite image: {e}")
    return None


@chat.route("/chat/update-furniture-state", methods=["POST"])
def update_furniture_state():
    """
    Updates the position, scale, and rotation coordinates of furniture items in the room.
    Also stores the latest composite room design image if provided.
    """
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        furniture_state = data.get("furniture_state")
        composite_image = data.get("composite_image") or data.get("generated_image")

        room = _get_room(room_id, user_id)
        if room is None:
            return jsonify({"success": False, "message": "Room not found."}), 404

        if furniture_state is not None and isinstance(furniture_state, list):
            room.furniture_state = json.dumps(furniture_state)

        if composite_image:
            _save_composite_image(room, composite_image)

        db.session.commit()

        return jsonify({
            "success": True,
            "furniture_state": furniture_state,
            "generated_image": room.generated_image_path,
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/chat/save-composite-image", methods=["POST"])
def save_composite_image_endpoint():
    """
    Stores the latest composed room design image with all placed furniture.
    """
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        composite_image = data.get("composite_image") or data.get("generated_image")
        furniture_state = data.get("furniture_state")

        room = _get_room(room_id, user_id)
        if room is None:
            return jsonify({"success": False, "message": "Room not found."}), 404

        if furniture_state is not None and isinstance(furniture_state, list):
            room.furniture_state = json.dumps(furniture_state)

        saved_path = _save_composite_image(room, composite_image)
        db.session.commit()

        return jsonify({
            "success": True,
            "generated_image": room.generated_image_path or saved_path,
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/chat", methods=["POST"])
@chat.route("/chat/message", methods=["POST"])
def chat_message():
    try:
        data = request.get_json() or {}
        message = (data.get("message") or "").strip()
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        generate_image = data.get("generate_image", True)

        if not message:
            return jsonify({"success": False, "message": "Message is required."}), 400

        room = _get_room(room_id, user_id)
        if room is None:
            return jsonify({"success": False, "message": "No room uploaded. Please start a room first."}), 404

        result = process_message(message, room)

        room.furniture_state = json.dumps(result["furniture_state"])
        room.chat_history = json.dumps(result["chat_history"])

        generated_image = result.get("generated_image") or room.generated_image_path
        furniture_items = result["furniture_state"]

        if generate_image and result.get("changed") and result.get("action") not in ("show_options", "room_selected", "ask_budget"):
            try:
                gen = generate_design_image(
                    room,
                    result["furniture_state"],
                    action=result.get("action"),
                    target_type=result.get("furniture_type"),
                )
                room.generated_image_name = gen["filename"]
                room.generated_image_path = gen["path"]
                generated_image = gen["path"]
                furniture_items = gen["furniture_state"]
                room.furniture_state = json.dumps(furniture_items)
            except Exception as gen_err:
                print("Image generation error:", gen_err)

        db.session.commit()

        serialized = _serialize_room(room)

        return jsonify({
            "success": True,
            "message": result["reply"],
            "reply": result["reply"],
            "action": result["action"],
            "furniture_type": result.get("furniture_type"),
            "furniture_items": furniture_items,
            "furniture_state": furniture_items,
            "generated_image": generated_image,
            "room_id": room.id,
            "chat_history": result["chat_history"],
            "room_options": result.get("room_options"),
            "selected_option": result.get("selected_option"),
            "amazon_products": result.get("amazon_products"),
            "gemini_link": result.get("gemini_link"),
            "gemini_prompt": result.get("gemini_prompt"),
            "category_options": result.get("category_options"),
            "step": result.get("step"),
            "room_type": result.get("room_type"),
            "budget": serialized["budget"],
            "used_amount": serialized["used_amount"],
            "remaining_budget": serialized["remaining_budget"],
            "is_over_budget": serialized["is_over_budget"],
            "budget_summary": result.get("budget_summary", {}),
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/furniture/extract", methods=["POST"])
def extract_furniture():
    try:
        data = request.get_json() or {}
        image_url = data.get("image_url")
        category = data.get("category", "bed")
        item_id = data.get("item_id")

        if not image_url:
            return jsonify({"success": False, "message": "image_url is required"}), 400

        extracted_url = extract_and_segment_object(image_url, category=category)
        return jsonify({
            "success": True,
            "original_image_url": image_url,
            "extracted_image_url": extracted_url,
            "category": category,
            "item_id": item_id,
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/chat/detect-objects", methods=["POST", "GET"])
def detect_objects_endpoint():
    """
    Detects and segments all furniture objects in the active room photo.
    """
    try:
        if request.method == "POST":
            data = request.get_json() or {}
            room_id = data.get("room_id")
            user_id = data.get("user_id")
            image_path = data.get("image_path")
        else:
            room_id = request.args.get("room_id", type=int)
            user_id = request.args.get("user_id", type=int)
            image_path = request.args.get("image_path")

        room = _get_room(room_id, user_id)
        target_path = image_path or (room.original_image_path if room else None)

        detected = detect_room_objects(target_path) if target_path else []

        if room and detected:
            details = _load_json(room.detection_details, {})
            if isinstance(details, dict):
                details["detected_objects"] = detected
                room.detection_details = json.dumps(details)
            else:
                room.detection_details = json.dumps({"detected_objects": detected})
            db.session.commit()

        return jsonify({"success": True, "detected_objects": detected})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@chat.route("/chat/remove-room-object", methods=["POST"])
def remove_room_object_endpoint():
    """
    Cleanly removes ONLY the selected furniture object from the uploaded room photo
    using AI inpainting and texture reconstruction.
    """
    try:
        data = request.get_json() or {}
        room_id = data.get("room_id")
        user_id = data.get("user_id")
        target_object = data.get("target_object") or {}

        valid_keys = (
            "id", "bbox", "bbox_pct", "polygon", "name", "click_pct",
            "mask_base64", "manual_mask", "mask_image", "mask", "mask_data",
            "manual_polygon", "points", "selection_mode"
        )
        if not target_object or not isinstance(target_object, dict) or not any(target_object.get(k) for k in valid_keys):
            return jsonify({"success": False, "message": "Please select an object or brush an area to remove."}), 400

        room = _get_room(room_id, user_id)
        if room is None:
            return jsonify({"success": False, "message": "Room not found."}), 404

        if not room.original_image_path:
            return jsonify({"success": False, "message": "No room image uploaded."}), 400

        res = remove_room_object(room.original_image_path, target_object)

        # Update room records with the infilled, cleaned room photo
        room.original_image_path = res["cleaned_image_path"]
        room.original_image_name = res["cleaned_image_name"]
        room.detected_image_path = res["cleaned_image_path"]
        room.detected_image_name = res["cleaned_image_name"]
        room.generated_image_path = res["cleaned_image_path"]
        room.generated_image_name = res["cleaned_image_name"]

        remaining = res.get("remaining_objects", [])
        room.total_objects = len(remaining)
        room.detected_objects = ",".join(o["name"] for o in remaining) if remaining else "Cleaned room"

        details = _load_json(room.detection_details, {})
        if isinstance(details, dict):
            details["detected_objects"] = remaining
            room.detection_details = json.dumps(details)
        else:
            room.detection_details = json.dumps({"detected_objects": remaining})

        # Add assistant message to chat history
        removed_label = res.get("removed_object") or target_object.get("label") or "Selected Furniture"
        chat_history = _load_json(room.chat_history, [])
        chat_history.append({
            "sender": "AI",
            "text": f"✨ Cleanly removed **{removed_label}** from your room image! The floor and wall areas were seamlessly infilled and reconstructed.",
            "timestamp": datetime.utcnow().isoformat(),
            "step": "object_removed",
        })
        room.chat_history = json.dumps(chat_history)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Successfully removed {removed_label}",
            "cleaned_image_path": res["cleaned_image_path"],
            "remaining_objects": remaining,
            "removed_object": removed_label,
            "room": _serialize_room(room),
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error in remove_room_object_endpoint: {e}")
        return jsonify({"success": False, "message": str(e)}), 500
