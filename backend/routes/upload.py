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

_model = None

def get_yolo_model():
    global _model
    if _model is None:
        candidate_paths = [
            os.path.join(BASE_DIR, "yolov8n.pt"),
            os.path.join(ROOT_DIR, "yolov8n.pt"),
            "yolov8n.pt",
        ]
        for p in candidate_paths:
            if os.path.exists(p):
                try:
                    _model = YOLO(p)
                    break
                except Exception as e:
                    print(f"Warning: Failed to load YOLO from {p}: {e}")
        if _model is None:
            try:
                _model = YOLO("yolov8n.pt")
            except Exception as e:
                print(f"Warning: Could not load default YOLO: {e}")
    return _model


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
        image = request.files.get("image") or request.files.get("file")
        if not image or image.filename == "":
            return jsonify({"success": False, "message": "No image selected. Please choose a photo."}), 400

        room_length = _parse_float(request.form.get("room_length"), 14.0)
        room_width = _parse_float(request.form.get("room_width"), 12.0)
        room_height = _parse_float(request.form.get("room_height"), 10.0)
        is_empty_room = _parse_bool(request.form.get("is_empty_room"))
        user_id = request.form.get("user_id", 1, type=int)

        if room_length is None or room_width is None or room_height is None:
            return jsonify({
                "success": False,
                "message": "Room length, width, and height are required.",
            }), 400

        raw_filename = secure_filename(image.filename) or f"room_{user_id}.jpg"
        filename = raw_filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        image.save(filepath)

        print("\n========== IMAGE UPLOADED ==========")
        print(filepath)
        print(f"Dimensions: {room_length} x {room_width} x {room_height} ft")
        print(f"Empty room: {is_empty_room}")

        detected_objects = []
        detection_details = {}
        detected_objects_list = []

        if not is_empty_room:
            from services.room_cleaner import detect_room_objects
            try:
                detected_objects_list = detect_room_objects(filepath)
                detected_objects = [o["name"] for o in detected_objects_list]
                detection_details = {"detected_objects": detected_objects_list}
            except Exception as e:
                print(f"Error in detect_room_objects: {e}")
                try:
                    yolo_mod = get_yolo_model()
                    if yolo_mod is not None:
                        results = yolo_mod(filepath, conf=0.20)
                        result = results[0]
                        for box in result.boxes:
                            cls = int(box.cls[0])
                            conf = float(box.conf[0])
                            object_name = yolo_mod.names[cls]
                            detected_objects.append(object_name)
                            xyxy = box.xyxy[0].tolist()
                            if object_name not in detection_details:
                                detection_details[object_name] = []
                            detection_details[object_name].append({
                                "bbox": [int(v) for v in xyxy],
                                "confidence": round(conf, 2),
                            })
                except Exception as yolo_err:
                    print(f"Fallback YOLO detection error: {yolo_err}")

            print("\n========== DETECTED OBJECTS ==========")
            for obj in detected_objects_list:
                print(f"{obj.get('label', obj.get('name'))} (ID: {obj.get('id')}) : conf {obj.get('confidence')}")

            detected_filename = filename
            detected_image_path = f"/uploads/{filename}"
            detected_image_name = filename
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
