from flask import Blueprint, jsonify, request
from models import RoomUpload
from extensions import db
from services.chat_ai import process_message
from services.image_generator import generate_design_image
import json

generate = Blueprint("generate", __name__)


def _load_json(text, default=None):
    if default is None:
        default = []
    if not text:
        return default
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default


@generate.route("/generate-design", methods=["POST"])
def generate_design():
    try:
        data = request.get_json() or {}
        prompt = (data.get("prompt") or "").strip()
        user_id = data.get("user_id")

        if not prompt:
            return jsonify({"success": False, "message": "Prompt is required."}), 400

        if room_id:
            if user_id:
                room = RoomUpload.query.filter_by(id=room_id, user_id=user_id).first() or db.session.get(RoomUpload, room_id)
            else:
                room = db.session.get(RoomUpload, room_id)
        elif user_id:
            room = RoomUpload.query.filter_by(user_id=user_id).order_by(RoomUpload.id.desc()).first()
        else:
            room = RoomUpload.query.order_by(RoomUpload.id.desc()).first()

        if room is None:
            return jsonify({"success": False, "message": "No room found."}), 404

        result = process_message(prompt, room)
        room.furniture_state = json.dumps(result["furniture_state"])
        room.chat_history = json.dumps(result["chat_history"])

        gen = generate_design_image(
            room,
            result["furniture_state"],
            action=result["action"],
            target_type=result["furniture_type"],
        )

        room.generated_image_name = gen["filename"]
        room.generated_image_path = gen["path"]
        room.furniture_state = json.dumps(gen["furniture_state"])
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Design generated successfully",
            "prompt": prompt,
            "room_id": room.id,
            "reply": result["reply"],
            "action": result["action"],
            "generated_image": gen["path"],
            #"generated_image": f"http://localhost:5000/uploads/generated/{gen['filename']}",
            "furniture_items": gen["furniture_state"],
            "furniture_state": gen["furniture_state"],
            "room_dimensions": {
                "length": room.room_length,
                "width": room.room_width,
                "height": room.room_height,
            },
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
