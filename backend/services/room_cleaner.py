"""
Room Object Detection & AI Furniture Removal Service
Detects furniture/objects in room photos and cleanly inpaints/removes selected objects,
preserving walls, floors, ceilings, lighting, and untouched objects.
"""

import os
import uuid
import json
import base64
from datetime import datetime
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
UPLOAD_FOLDER = os.path.join(ROOT_DIR, "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

CLEANED_FOLDER = os.path.join(UPLOAD_FOLDER, "cleaned")
os.makedirs(CLEANED_FOLDER, exist_ok=True)

MODEL_PATH = os.path.join(BASE_DIR, "yolov8n-seg.pt")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(ROOT_DIR, "yolov8n-seg.pt")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = "yolov8n-seg.pt"

_seg_model = None

LABEL_MAP = {
    "couch": "Sofa / Couch",
    "chair": "Chair",
    "bed": "Bed",
    "dining table": "Table",
    "tv": "TV / Screen",
    "potted plant": "Indoor Plant",
    "vase": "Vase / Decor",
    "refrigerator": "Refrigerator",
    "microwave": "Microwave",
    "oven": "Oven / Range",
    "sink": "Sink",
    "book": "Books / Decor",
    "clock": "Clock",
    "laptop": "Laptop / Desk Item",
}

def get_seg_model():
    global _seg_model
    if _seg_model is None:
        try:
            _seg_model = YOLO(MODEL_PATH)
        except Exception as e:
            print(f"Failed to load YOLOv8-seg model: {e}")
            _seg_model = YOLO("yolov8n.pt")
    return _seg_model


def _resolve_image_path(relative_path):
    if not relative_path:
        return None
    if os.path.isabs(relative_path) and os.path.exists(relative_path):
        return os.path.normpath(relative_path)

    # Normalize slashes
    clean_path = str(relative_path).replace("\\", "/").strip("/")
    if clean_path.startswith("uploads/"):
        clean_path = clean_path[len("uploads/"):]

    # Check candidate locations
    candidates = [
        os.path.join(UPLOAD_FOLDER, clean_path),
        os.path.join(ROOT_DIR, "uploads", clean_path),
        os.path.join(BASE_DIR, "uploads", clean_path),
        os.path.join(ROOT_DIR, clean_path),
        os.path.join(BASE_DIR, clean_path),
    ]
    for cand in candidates:
        norm = os.path.normpath(cand)
        if os.path.exists(norm):
            return norm

    return os.path.normpath(os.path.join(UPLOAD_FOLDER, clean_path))


def calculate_iou(box1, box2):
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    intersection = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - intersection
    return intersection / union if union > 0 else 0.0


def detect_room_objects(image_path):
    """
    Detects and segments furniture and room objects in the uploaded room photo.
    Returns list of detected objects with bounding boxes (pixel and percentage) and segmentation polygons.
    Applies Non-Maximum Suppression (NMS) to eliminate duplicate/nested bounding boxes.
    """
    abs_path = _resolve_image_path(image_path)
    if not abs_path or not os.path.exists(abs_path):
        return []

    try:
        img = cv2.imread(abs_path)
        if img is None:
            return []
        h, w = img.shape[:2]

        model = get_seg_model()
        results = model(abs_path, conf=0.18, verbose=False)
        result = results[0]

        candidates = []
        has_masks = result.masks is not None and len(result.masks) > 0

        for i, box in enumerate(result.boxes):
            cls_id = int(box.cls[0])
            raw_name = model.names[cls_id]
            conf = float(box.conf[0])

            # Filter relevant room and furniture objects
            if raw_name not in LABEL_MAP:
                continue
            if conf < 0.22:
                continue

            xyxy = [int(v) for v in box.xyxy[0].tolist()]
            x1, y1, x2, y2 = xyxy
            x1 = max(0, min(w - 1, x1))
            y1 = max(0, min(h - 1, y1))
            x2 = max(0, min(w - 1, x2))
            y2 = max(0, min(h - 1, y2))

            width_px = x2 - x1
            height_px = y2 - y1

            # Skip tiny noise boxes
            if width_px < 20 or height_px < 20:
                continue

            polygon = None
            if has_masks and i < len(result.masks):
                try:
                    poly_points = result.masks.xy[i]
                    if len(poly_points) > 2:
                        polygon = [[int(pt[0]), int(pt[1])] for pt in poly_points]
                except Exception:
                    pass

            candidates.append({
                "cls_id": cls_id,
                "raw_name": raw_name,
                "conf": conf,
                "bbox": [x1, y1, x2, y2],
                "polygon": polygon,
            })

        # Sort candidates by confidence descending
        candidates.sort(key=lambda c: c["conf"], reverse=True)

        # Apply Non-Maximum Suppression (NMS) to eliminate duplicate/nested bounding boxes
        filtered = []
        for cand in candidates:
            c_box = cand["bbox"]
            is_dup = False
            for keep in filtered:
                k_box = keep["bbox"]
                iou = calculate_iou(c_box, k_box)
                # Same category duplicate or high intersection
                if iou > 0.45:
                    is_dup = True
                    break
                # Check if one box is almost entirely contained within another (nested duplicate)
                c_area = (c_box[2] - c_box[0]) * (c_box[3] - c_box[1])
                inter = max(0, min(c_box[2], k_box[2]) - max(c_box[0], k_box[0])) * max(0, min(c_box[3], k_box[3]) - max(c_box[1], k_box[1]))
                if c_area > 0 and (inter / c_area) > 0.75 and cand["raw_name"] == keep["raw_name"]:
                    is_dup = True
                    break

            if not is_dup:
                filtered.append(cand)

        detected = []
        for idx, item in enumerate(filtered):
            x1, y1, x2, y2 = item["bbox"]
            width_px = x2 - x1
            height_px = y2 - y1

            x_pct = round((x1 / w) * 100, 2)
            y_pct = round((y1 / h) * 100, 2)
            w_pct = round((width_px / w) * 100, 2)
            h_pct = round((height_px / h) * 100, 2)
            center_x_pct = round(((x1 + x2) / (2 * w)) * 100, 2)
            center_y_pct = round(((y1 + y2) / (2 * h)) * 100, 2)

            obj_label = LABEL_MAP.get(item["raw_name"], item["raw_name"].replace("_", " ").title())
            obj_id = f"detected_{item['cls_id']}_{idx}_{int(x_pct)}_{int(y_pct)}"

            detected.append({
                "id": obj_id,
                "name": item["raw_name"],
                "label": obj_label,
                "confidence": round(item["conf"], 2),
                "bbox": [x1, y1, x2, y2],
                "bbox_pct": {
                    "x": x_pct,
                    "y": y_pct,
                    "width": w_pct,
                    "height": h_pct,
                    "center_x": center_x_pct,
                    "center_y": center_y_pct,
                },
                "polygon": item["polygon"],
            })

        return detected

    except Exception as e:
        print(f"Error in detect_room_objects: {e}")
        return []


def _decode_mask_base64(mask_b64, target_w, target_h):
    """
    Decodes a base64 mask (PNG/JPEG with or without data: URI header)
    and resizes it to target dimensions (target_w, target_h), returning a uint8 binary mask (0 or 255).
    """
    try:
        raw_b64 = mask_b64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        mask_bytes = base64.b64decode(raw_b64)
        nparr = np.frombuffer(mask_bytes, np.uint8)
        decoded = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if decoded is None:
            return None

        # Extract binary mask from RGBA, RGB, or Grayscale
        if len(decoded.shape) == 3 and decoded.shape[2] == 4:
            alpha = decoded[:, :, 3]
            color_sum = np.sum(decoded[:, :, :3], axis=2)
            binary = np.where((alpha > 15) | (color_sum > 15), 255, 0).astype(np.uint8)
        elif len(decoded.shape) == 3:
            gray = cv2.cvtColor(decoded, cv2.COLOR_BGR2GRAY)
            binary = np.where(gray > 15, 255, 0).astype(np.uint8)
        else:
            binary = np.where(decoded > 15, 255, 0).astype(np.uint8)

        if binary.shape[1] != target_w or binary.shape[0] != target_h:
            binary = cv2.resize(binary, (target_w, target_h), interpolation=cv2.INTER_NEAREST)

        return binary
    except Exception as e:
        print(f"Error decoding mask_base64: {e}")
        return None


def remove_room_object(image_path, target_spec, output_dir=None):
    """
    Cleanly removes the selected furniture object or user-brushed area from the room photo,
    inpainting the floor/wall area naturally while preserving all room architecture, perspective,
    lighting, dimensions, and untouched objects.

    Priority:
    1. Manual Brush / Area Mask (user_manual_mask) -> 100% priority
    2. YOLO Polygon / Bounding Box (if no manual mask drawn)
    """
    abs_path = _resolve_image_path(image_path)
    if not abs_path or not os.path.exists(abs_path):
        raise ValueError(f"Original room image not found: {image_path}")

    img = cv2.imread(abs_path)
    if img is None:
        raise ValueError("Failed to load room image file.")

    h, w = img.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)
    is_manual = False

    # 1. Check for User Manual Selection Mask (Priority 1)
    mask_b64 = (
        target_spec.get("mask_base64")
        or target_spec.get("manual_mask")
        or target_spec.get("mask_image")
        or target_spec.get("mask")
        or target_spec.get("mask_data")
    )

    if mask_b64 and isinstance(mask_b64, str) and len(mask_b64) > 30:
        decoded_mask = _decode_mask_base64(mask_b64, w, h)
        if decoded_mask is not None and np.count_nonzero(decoded_mask) > 0:
            mask = decoded_mask
            is_manual = True

    # 2. Check for Manual Points / Freehand Polygon (Priority 1.5)
    if not is_manual:
        manual_polygon = target_spec.get("manual_polygon") or target_spec.get("points")
        if manual_polygon and isinstance(manual_polygon, list) and len(manual_polygon) > 2:
            pts = []
            for p in manual_polygon:
                if isinstance(p, (list, tuple)) and len(p) >= 2:
                    pts.append([int(p[0]), int(p[1])])
                elif isinstance(p, dict) and "x" in p and "y" in p:
                    px = int((p["x"] / 100) * w) if p["x"] <= 100 and not p.get("is_px") else int(p["x"])
                    py = int((p["y"] / 100) * h) if p["y"] <= 100 and not p.get("is_px") else int(p["y"])
                    pts.append([px, py])
            if len(pts) > 2:
                cv2.fillPoly(mask, [np.array(pts, dtype=np.int32)], 255)
                is_manual = True

    # 3. Fallback to YOLO Object Selection (Priority 2)
    if not is_manual:
        polygon = target_spec.get("polygon")
        bbox = target_spec.get("bbox")
        bbox_pct = target_spec.get("bbox_pct")
        click_pct = target_spec.get("click_pct")

        all_objects = detect_room_objects(abs_path)
        target_matched_id = target_spec.get("id")

        if polygon and isinstance(polygon, list) and len(polygon) > 2:
            pts = np.array(polygon, dtype=np.int32)
            cv2.fillPoly(mask, [pts], 255)
        elif bbox and isinstance(bbox, list) and len(bbox) == 4:
            x1, y1, x2, y2 = [int(v) for v in bbox]
            cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
        elif bbox_pct and isinstance(bbox_pct, dict):
            x1 = int((bbox_pct["x"] / 100) * w)
            y1 = int((bbox_pct["y"] / 100) * h)
            x2 = int(((bbox_pct["x"] + bbox_pct["width"]) / 100) * w)
            y2 = int(((bbox_pct["y"] + bbox_pct["height"]) / 100) * h)
            cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
        elif click_pct and isinstance(click_pct, dict):
            cx = int((click_pct["x"] / 100) * w)
            cy = int((click_pct["y"] / 100) * h)
            matched = None
            for obj in all_objects:
                bx1, by1, bx2, by2 = obj["bbox"]
                if bx1 <= cx <= bx2 and by1 <= cy <= by2:
                    matched = obj
                    target_matched_id = obj["id"]
                    break
            if matched and matched.get("polygon"):
                pts = np.array(matched["polygon"], dtype=np.int32)
                cv2.fillPoly(mask, [pts], 255)
            elif matched:
                bx1, by1, bx2, by2 = matched["bbox"]
                cv2.rectangle(mask, (bx1, by1), (bx2, by2), 255, -1)
            else:
                patch_r = max(25, int(min(w, h) * 0.06))
                cv2.circle(mask, (cx, cy), patch_r, 255, -1)
        else:
            raise ValueError("Invalid target object specification for removal.")

    if np.count_nonzero(mask) == 0:
        raise ValueError("Selected removal area is empty. Please brush or select the object to remove.")

    # 4. Refine mask boundary: Adaptive dilation to encapsulate anti-aliasing edges and contact shadows
    diag = np.sqrt(w**2 + h**2)
    # For manual brush, use precise slight expansion (3-6 px)
    # For YOLO, use slightly larger expansion (5-9 px) to catch missed legs/edges
    if is_manual:
        k_size = max(3, int(diag * 0.005))
    else:
        k_size = max(5, int(diag * 0.008))

    if k_size % 2 == 0:
        k_size += 1

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
    dilated_mask = cv2.dilate(mask, kernel, iterations=1)

    # Slight downward shadow dilation for ground contact transitions
    shadow_k = max(3, int(k_size * 1.3))
    shadow_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, shadow_k))
    dilated_mask = cv2.dilate(dilated_mask, shadow_kernel, iterations=1)

    # 5. Multi-Scale Hierarchical Natural Inpainting & Texture Reconstruction
    # Coarse pass at 50% scale for smooth global structural & lighting propagation
    scale = 0.5
    sw = max(32, int(w * scale))
    sh = max(32, int(h * scale))
    small_img = cv2.resize(img, (sw, sh), interpolation=cv2.INTER_AREA)
    small_mask = cv2.resize(dilated_mask, (sw, sh), interpolation=cv2.INTER_NEAREST)
    coarse_inpaint = cv2.inpaint(small_img, small_mask, 5, cv2.INPAINT_TELEA)
    coarse_up = cv2.resize(coarse_inpaint, (w, h), interpolation=cv2.INTER_CUBIC)

    # Blend coarse background reconstruction into the target mask region as guidance
    guide_img = img.copy()
    guide_img[dilated_mask > 0] = coarse_up[dilated_mask > 0]

    # Fine pass: Multi-algorithm high-detail inpainting
    inpaint_radius = max(3, int(diag * 0.005))
    infilled_telea = cv2.inpaint(guide_img, dilated_mask, inpaint_radius, cv2.INPAINT_TELEA)
    infilled_ns = cv2.inpaint(guide_img, dilated_mask, inpaint_radius, cv2.INPAINT_NS)

    # Weighted blend: 68% Telea (texture & lines) + 32% NS (smooth gradients on walls/lighting)
    blended = cv2.addWeighted(infilled_telea, 0.68, infilled_ns, 0.32, 0)

    # Edge-aware bilateral smoothing strictly inside infilled boundary to eliminate grain artifacts
    bilateral = cv2.bilateralFilter(blended, d=9, sigmaColor=50, sigmaSpace=50)
    blended[dilated_mask > 0] = bilateral[dilated_mask > 0]

    # Feather mask edges for seamless transition into untouched original room photo
    feather_size = max(5, int(diag * 0.005))
    if feather_size % 2 == 0:
        feather_size += 1
    blur_mask = cv2.GaussianBlur(dilated_mask.astype(np.float32) / 255.0, (feather_size, feather_size), 0)
    blur_mask_3c = cv2.merge([blur_mask, blur_mask, blur_mask])

    # Final composite: exactly identical to original photo outside the mask, smoothly inpainted inside
    final_result = (
        blended.astype(np.float32) * blur_mask_3c + img.astype(np.float32) * (1.0 - blur_mask_3c)
    ).clip(0, 255).astype(np.uint8)

    # 6. Save the cleaned room image
    out_dir = output_dir or CLEANED_FOLDER
    os.makedirs(out_dir, exist_ok=True)
    filename = f"room_cleaned_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.jpg"
    out_path = os.path.join(out_dir, filename)
    cv2.imwrite(out_path, final_result, [cv2.IMWRITE_JPEG_QUALITY, 98])

    web_path = f"/uploads/cleaned/{filename}"

    # 7. Detect remaining objects on the newly cleaned image
    remaining_objects = detect_room_objects(out_path)

    label = target_spec.get("label") or ("Selected Area" if is_manual else "Selected Furniture")

    return {
        "success": True,
        "cleaned_image_path": web_path,
        "cleaned_image_name": filename,
        "removed_object": label,
        "remaining_objects": remaining_objects,
    }
