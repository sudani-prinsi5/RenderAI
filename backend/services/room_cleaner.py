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
    path = relative_path.lstrip("/")
    if path.startswith("uploads/"):
        path = path[len("uploads/"):]
    return os.path.join(UPLOAD_FOLDER, path)


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
    abs_path = _resolve_image_path(image_path) if not os.path.isabs(image_path) else image_path
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


def remove_room_object(image_path, target_spec, output_dir=None):
    """
    Cleanly removes ONLY the selected furniture object from the room photo,
    inpainting the floor/wall area naturally while preserving all room architecture and untouched objects.
    """
    abs_path = _resolve_image_path(image_path) if not os.path.isabs(image_path) else image_path
    if not abs_path or not os.path.exists(abs_path):
        raise ValueError("Original room image not found.")

    img = cv2.imread(abs_path)
    if img is None:
        raise ValueError("Failed to load room image file.")

    h, w = img.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)

    # 1. Resolve mask for the selected object
    polygon = target_spec.get("polygon")
    bbox = target_spec.get("bbox")
    bbox_pct = target_spec.get("bbox_pct")
    click_pct = target_spec.get("click_pct")

    # Detect all objects in current image to protect neighbors
    all_objects = detect_room_objects(abs_path)
    neighbor_mask = np.zeros((h, w), dtype=np.uint8)

    target_matched_id = target_spec.get("id")

    # A) Polygon from YOLO segmentation
    if polygon and isinstance(polygon, list) and len(polygon) > 2:
        pts = np.array(polygon, dtype=np.int32)
        cv2.fillPoly(mask, [pts], 255)
    # B) Pixel BBox
    elif bbox and isinstance(bbox, list) and len(bbox) == 4:
        x1, y1, x2, y2 = [int(v) for v in bbox]
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
    # C) Percentage BBox
    elif bbox_pct and isinstance(bbox_pct, dict):
        x1 = int((bbox_pct["x"] / 100) * w)
        y1 = int((bbox_pct["y"] / 100) * h)
        x2 = int(((bbox_pct["x"] + bbox_pct["width"]) / 100) * w)
        y2 = int(((bbox_pct["y"] + bbox_pct["height"]) / 100) * h)
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, -1)
    # D) Click percentage coordinate: find detected object
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
            patch_r = max(25, int(min(w, h) * 0.05))
            cv2.circle(mask, (cx, cy), patch_r, 255, -1)
    else:
        raise ValueError("Invalid target object specification for removal.")

    # Populate neighbor mask for all other objects
    for obj in all_objects:
        if obj.get("id") == target_matched_id:
            continue
        if obj.get("polygon") and len(obj["polygon"]) > 2:
            pts = np.array(obj["polygon"], dtype=np.int32)
            cv2.fillPoly(neighbor_mask, [pts], 255)
        elif obj.get("bbox"):
            bx1, by1, bx2, by2 = obj["bbox"]
            cv2.rectangle(neighbor_mask, (bx1, by1), (bx2, by2), 255, -1)

    # 2. Refine mask boundary: Dilation to encapsulate shadows and transitions
    diag = np.sqrt(w**2 + h**2)
    k_size = max(5, int(diag * 0.007))
    if k_size % 2 == 0:
        k_size += 1
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_size, k_size))
    dilated_mask = cv2.dilate(mask, kernel, iterations=1)

    # Also extend bottom slightly (for floor contact shadow)
    shadow_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, max(3, int(k_size * 1.5))))
    dilated_mask = cv2.dilate(dilated_mask, shadow_kernel, iterations=1)

    # Protect neighbor objects: Don't inpaint into neighbor objects
    if np.any(neighbor_mask > 0):
        # Slightly erode neighbor mask to avoid sharp seams at contact points
        n_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        safe_neighbors = cv2.erode(neighbor_mask, n_kernel, iterations=1)
        dilated_mask[safe_neighbors > 0] = 0

    # 3. Multi-Scale Natural Inpainting & Texture Reconstruction
    # Coarse pass at 50% scale for smooth global structural propagation
    small_img = cv2.resize(img, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    small_mask = cv2.resize(dilated_mask, (w // 2, h // 2), interpolation=cv2.INTER_NEAREST)
    coarse_inpaint = cv2.inpaint(small_img, small_mask, 5, cv2.INPAINT_TELEA)
    coarse_up = cv2.resize(coarse_inpaint, (w, h), interpolation=cv2.INTER_CUBIC)

    # Blend coarse background reconstruction into the target mask region
    guide_img = img.copy()
    guide_img[dilated_mask > 0] = coarse_up[dilated_mask > 0]

    # Fine pass: Multi-algorithm high-detail inpainting
    inpaint_radius = max(3, int(diag * 0.005))
    infilled_telea = cv2.inpaint(guide_img, dilated_mask, inpaint_radius, cv2.INPAINT_TELEA)
    infilled_ns = cv2.inpaint(guide_img, dilated_mask, inpaint_radius, cv2.INPAINT_NS)

    # Weighted blend: 70% Telea (texture & lines) + 30% NS (smooth gradients on walls)
    blended = cv2.addWeighted(infilled_telea, 0.70, infilled_ns, 0.30, 0)

    # Edge-aware bilateral smoothing strictly inside infilled boundary to remove grain
    bilateral = cv2.bilateralFilter(blended, d=9, sigmaColor=50, sigmaSpace=50)
    blended[dilated_mask > 0] = bilateral[dilated_mask > 0]

    # Feather mask edges for smooth transition into untouched original room photo
    feather_size = max(7, int(diag * 0.006))
    if feather_size % 2 == 0:
        feather_size += 1
    blur_mask = cv2.GaussianBlur(dilated_mask.astype(np.float32) / 255.0, (feather_size, feather_size), 0)
    blur_mask_3c = cv2.merge([blur_mask, blur_mask, blur_mask])

    final_result = (blended.astype(np.float32) * blur_mask_3c + img.astype(np.float32) * (1.0 - blur_mask_3c)).clip(0, 255).astype(np.uint8)

    # 4. Save the cleaned room image
    out_dir = output_dir or CLEANED_FOLDER
    os.makedirs(out_dir, exist_ok=True)
    filename = f"room_cleaned_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}.jpg"
    out_path = os.path.join(out_dir, filename)
    cv2.imwrite(out_path, final_result, [cv2.IMWRITE_JPEG_QUALITY, 95])

    web_path = f"/uploads/cleaned/{filename}"

    # 5. Detect remaining objects on the newly cleaned image
    remaining_objects = detect_room_objects(out_path)

    return {
        "success": True,
        "cleaned_image_path": web_path,
        "cleaned_image_name": filename,
        "removed_object": target_spec.get("label", "Selected Furniture"),
        "remaining_objects": remaining_objects,
    }
