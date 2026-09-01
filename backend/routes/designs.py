from flask import Blueprint, jsonify, request
from models import RoomUpload
from extensions import db
import json

designs = Blueprint("designs", __name__)


def _load_json(text, default=None):
    if default is None:
        default = {}
    if not text:
        return default
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return default


def _serialize_design(room, include_history=False):
    furniture = _load_json(room.furniture_state, [])
    data = {
        "room_id": room.id,
        "user_id": room.user_id,
        "original_image": room.original_image_path,
        "detected_image": room.detected_image_path,
        "generated_image": room.generated_image_path,
        "is_empty_room": room.is_empty_room,
        "room_length": room.room_length,
        "room_width": room.room_width,
        "room_height": room.room_height,
        "status": room.status,
        "total_objects": room.total_objects,
        "object_counts": _load_json(room.object_counts, {}),
        "furniture_items": furniture,
        "furniture_count": len(furniture),
        "created_at": room.created_at.isoformat() if room.created_at else None,
    }
    if include_history:
        data["chat_history"] = _load_json(room.chat_history, [])
    return data


@designs.route("/my-designs", methods=["GET"])
def my_designs():
    try:
        user_id = request.args.get("user_id", type=int)
        query = RoomUpload.query.order_by(RoomUpload.id.desc())

        if user_id:
            query = query.filter_by(user_id=user_id)

        rooms = query.all()
        items = [_serialize_design(room) for room in rooms]

        return jsonify({
            "success": True,
            "count": len(items),
            "designs": items,
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@designs.route("/designs/<int:room_id>", methods=["GET"])
def design_detail(room_id):
    try:
        room = db.session.get(RoomUpload, room_id)
        if room is None:
            return jsonify({"success": False, "message": "Design not found."}), 404

        data = _serialize_design(room, include_history=True)
        data["success"] = True
        return jsonify(data)

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
