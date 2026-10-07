import os
import torch
from ultralytics import YOLO

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

_seg_model = None
_det_model = None


def get_yolo_seg_model():
    """
    Returns a shared, cached YOLOv8 Segmentation model instance on CPU.
    """
    global _seg_model
    if _seg_model is None:
        candidate_paths = [
            os.path.join(BASE_DIR, "yolov8n-seg.pt"),
            os.path.join(ROOT_DIR, "yolov8n-seg.pt"),
            "yolov8n-seg.pt",
            os.path.join(BASE_DIR, "yolov8n.pt"),
            os.path.join(ROOT_DIR, "yolov8n.pt"),
            "yolov8n.pt",
        ]
        for p in candidate_paths:
            if os.path.exists(p):
                try:
                    _seg_model = YOLO(p)
                    # Force CPU execution to prevent CUDA discovery or Dynamo JIT hooks
                    _seg_model.to("cpu")
                    break
                except Exception as e:
                    print(f"Warning: Failed to load YOLO seg model from {p}: {e}")
        if _seg_model is None:
            try:
                _seg_model = YOLO("yolov8n-seg.pt")
                _seg_model.to("cpu")
            except Exception as e:
                print(f"Warning: Fallback load for yolov8n-seg.pt failed: {e}")
    return _seg_model


def get_yolo_det_model():
    """
    Returns a shared, cached YOLOv8 Detection model instance on CPU.
    """
    global _det_model
    if _det_model is None:
        candidate_paths = [
            os.path.join(BASE_DIR, "yolov8n.pt"),
            os.path.join(ROOT_DIR, "yolov8n.pt"),
            "yolov8n.pt",
        ]
        for p in candidate_paths:
            if os.path.exists(p):
                try:
                    _det_model = YOLO(p)
                    _det_model.to("cpu")
                    break
                except Exception as e:
                    print(f"Warning: Failed to load YOLO det model from {p}: {e}")
        if _det_model is None:
            try:
                _det_model = YOLO("yolov8n.pt")
                _det_model.to("cpu")
            except Exception as e:
                print(f"Warning: Fallback load for yolov8n.pt failed: {e}")
    return _det_model or get_yolo_seg_model()


def safe_yolo_predict(model, source, conf=0.18, imgsz=640):
    """
    Executes YOLO prediction safely in torch inference mode with CPU device and bounded image size.
    Prevents torch._dynamo graph tracing, reduces memory consumption, and accelerates inference.
    """
    if model is None:
        return None
    try:
        with torch.inference_mode():
            results = model(
                source,
                conf=conf,
                device="cpu",
                imgsz=imgsz,
                verbose=False,
            )
            return results
    except Exception as e:
        print(f"YOLO predict error: {e}")
        return None
