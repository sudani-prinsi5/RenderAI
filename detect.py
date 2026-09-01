# from ultralytics import YOLO

# model = YOLO("yolov8n.pt")

# def detect_furniture(image_path):

#     results = model(image_path)

#     detected=[]

#     for box in results[0].boxes:

#         cls=int(box.cls[0])

#         detected.append(model.names[cls])

#     return detected
from ultralytics import YOLO

# Load pretrained YOLOv8 model only once
model = YOLO("yolov8n.pt")


def detect_furniture(image_path):

    results = model(image_path)

    detected_objects = []

    print("\nConfidence Scores:")

    for box in results[0].boxes:

        class_id = int(box.cls[0])

        confidence = float(box.conf[0])

        class_name = model.names[class_id]

        detected_objects.append(class_name)

        print(f"{class_name} : {confidence:.2f}")

    # Save detected image
    results[0].save(filename="output.jpg")

    print("\nOutput Image Saved As : output.jpg")

    return detected_objects