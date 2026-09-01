from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from ultralytics import YOLO
from models import RoomUpload
from extensions import db
from collections import Counter
import json
import os

upload = Blueprint("upload", __name__)

# Resolved relative to backend/ directory to avoid CWD mismatch
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
UPLOAD_FOLDER = os.path.join(ROOT_DIR, "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

RESULT_FOLDER = os.path.join(UPLOAD_FOLDER, "results")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)

model = YOLO("yolov8n.pt")


def _parse_float(value, default=None):
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).lower() in ("true", "1", "yes", "on")


@upload.route("/upload", methods=["POST"])
def upload_image():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image selected."}), 400

        image = request.files["image"]
        if image.filename == "":
            return jsonify({"success": False, "message": "No image selected."}), 400

        room_length = _parse_float(request.form.get("room_length"))
        room_width = _parse_float(request.form.get("room_width"))
        room_height = _parse_float(request.form.get("room_height"))
        is_empty_room = _parse_bool(request.form.get("is_empty_room"))
        user_id = request.form.get("user_id", 1, type=int)

        if room_length is None or room_width is None or room_height is None:
            return jsonify({
                "success": False,
                "message": "Room length, width, and height are required.",
            }), 400

        filename = secure_filename(image.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        image.save(filepath)

        print("\n========== IMAGE UPLOADED ==========")
        print(filepath)
        print(f"Dimensions: {room_length} x {room_width} x {room_height} ft")
        print(f"Empty room: {is_empty_room}")

        detected_objects = []
        detection_details = {}

        if not is_empty_room:
            results = model(filepath, conf=0.20)
            result = results[0]

            print("\n========== DETECTED OBJECTS ==========")
            if len(result.boxes) == 0:
                print("No Objects Detected")
            else:
                for box in result.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    object_name = model.names[cls]
                    detected_objects.append(object_name)

                    xyxy = box.xyxy[0].tolist()
                    if object_name not in detection_details:
                        detection_details[object_name] = []
                    detection_details[object_name].append({
                        "bbox": [int(v) for v in xyxy],
                        "confidence": round(conf, 2),
                    })
                    print(f"{object_name} : {conf:.2f}")

            detected_filename = "detected_" + filename
            detected_path = os.path.join(RESULT_FOLDER, detected_filename)
            result.save(filename=detected_path)
            detected_image_path = f"/uploads/results/{detected_filename}"
            detected_image_name = detected_filename
        else:
            print("Empty room – skipping YOLO detection")
            detected_filename = None
            detected_image_path = f"/uploads/{filename}"
            detected_image_name = filename

        object_count = Counter(detected_objects)

        if is_empty_room:
            detected_object_string = "Empty room"
            object_count_json = json.dumps({})
            detection_details_json = json.dumps({})
            status = "Empty Room"
            total = 0
        elif len(detected_objects) == 0:
            detected_object_string = "No objects detected"
            object_count_json = json.dumps({})
            detection_details_json = json.dumps({})
            status = "Not Detected"
            total = 0
        else:
            detected_object_string = ",".join(detected_objects)
            object_count_json = json.dumps(dict(object_count))
            detection_details_json = json.dumps(detection_details)
            status = "Detected"
            total = len(detected_objects)

        from datetime import datetime
        welcome_text = (
            f"I've analyzed your room ({room_length}×{room_width}×{room_height} ft). "
            f"It appears to be an empty room. 🏡\n\n"
            f"**What type of room would you like to create?**\n"
            f"Select or type your desired room type below:"
        ) if is_empty_room else (
            f"I've analyzed your uploaded room photo ({room_length}×{room_width}×{room_height} ft). 🛋️\n\n"
            f"**What type of room makeover would you like to create?**\n"
            f"Select or type your desired room type below:"
        )
        initial_chat = [
            {
                "sender": "AI",
                "text": welcome_text,
                "timestamp": datetime.utcnow().isoformat(),
                "step": "ask_room_type",
            }
        ]

        upload_data = RoomUpload(
            user_id=user_id,
            original_image_name=filename,
            original_image_path=f"/uploads/{filename}",
            detected_image_name=detected_image_name,
            detected_image_path=detected_image_path,
            detected_objects=detected_object_string,
            object_counts=object_count_json,
            detection_details=detection_details_json,
            total_objects=total,
            status=status,
            room_length=room_length,
            room_width=room_width,
            room_height=room_height,
            is_empty_room=is_empty_room,
            furniture_state=json.dumps([]),
            chat_history=json.dumps(initial_chat),
        )

        db.session.add(upload_data)
        db.session.commit()

        print("\n========== DATABASE ==========")
        print(f"Room ID: {upload_data.id}")
        print("Database Saved Successfully")
        print("==============================")

        return jsonify({
            "success": True,
            "message": "Room uploaded successfully" if is_empty_room else "YOLO Detection Completed",
            "room_id": upload_data.id,
            "original_image": f"/uploads/{filename}",
            "detected_image": detected_image_path,
            "objects": detected_objects,
            "object_counts": dict(object_count),
            "total_objects": total,
            "is_empty_room": is_empty_room,
            "room_length": room_length,
            "room_width": room_width,
            "room_height": room_height,
        })

    except Exception as e:
        db.session.rollback()
        print("\nERROR :", str(e))
        return jsonify({"success": False, "message": str(e)}), 500
