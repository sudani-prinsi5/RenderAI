import sys
import os
import io
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app import app
from extensions import db
from models import User

client = app.test_client()

def run_tests():
    print("========================================")
    print("RUNNING API CONNECTION & CORS TEST SUITE")
    print("========================================")

    # 1. Health check
    res_root = client.get("/", headers={"Origin": "https://render-ai-tau.vercel.app"})
    assert res_root.status_code == 200, f"Root failed: {res_root.status_code}"
    assert res_root.headers.get("Access-Control-Allow-Origin") == "https://render-ai-tau.vercel.app"
    print("✓ [PASS] Root & CORS verification")

    # 2. CORS Preflight
    res_opt = client.options("/upload", headers={
        "Origin": "https://render-ai-tau.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,Authorization"
    })
    assert res_opt.status_code == 200, f"Options failed: {res_opt.status_code}"
    assert res_opt.headers.get("Access-Control-Allow-Origin") == "https://render-ai-tau.vercel.app"
    assert "POST" in res_opt.headers.get("Access-Control-Allow-Methods", "")
    print("✓ [PASS] CORS Preflight OPTIONS verification")

    # 3. Furniture extract
    res_ext = client.post("/furniture/extract", json={
        "image_url": "/furniture_dataset/bed/buget_10k/bed1.jpeg",
        "category": "bed",
        "item_id": "bed_10k_1"
    }, headers={"Origin": "https://render-ai-tau.vercel.app"})
    assert res_ext.status_code == 200, f"Extract failed: {res_ext.status_code}"
    data_ext = res_ext.get_json()
    assert data_ext.get("success") is True
    assert data_ext.get("extracted_image_url") is not None
    print(f"✓ [PASS] Furniture extraction: {data_ext.get('extracted_image_url')}")

    # 4. Email validation
    res_email = client.post("/send-verification-code", json={
        "email": "invalid_email_test",
        "full_name": "Test User"
    }, headers={"Origin": "https://render-ai-tau.vercel.app"})
    assert res_email.status_code == 400
    print("✓ [PASS] Verification email input validation")

    # 5. Room Upload & DB Save
    with app.app_context():
        # Ensure user exists for test
        test_user = User.query.filter_by(user_id=1).first()
        if not test_user:
            test_user = User(user_id=1, full_name="Test User", email="test@example.com", password_hash="dummy")
            db.session.add(test_user)
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()

    dummy_jpg = io.BytesIO(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9')
    upload_data = {
        "image": (dummy_jpg, "test_upload_room.jpg"),
        "room_length": "14",
        "room_width": "12",
        "room_height": "10",
        "is_empty_room": "true",
        "user_id": "1",
    }
    res_upload = client.post("/upload", data=upload_data, content_type="multipart/form-data", headers={"Origin": "https://render-ai-tau.vercel.app"})
    print(f"Upload response: {res_upload.status_code}")
    assert res_upload.status_code == 200, f"Upload failed: {res_upload.get_json()}"
    upload_json = res_upload.get_json()
    room_id = upload_json.get("room_id")
    assert room_id is not None
    print(f"✓ [PASS] Upload photo API: room_id={room_id}")

    # 6. Save Composite Image
    dummy_png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    res_comp = client.post("/chat/save-composite-image", json={
        "room_id": room_id,
        "user_id": 1,
        "composite_image": dummy_png,
        "furniture_state": []
    }, headers={"Origin": "https://render-ai-tau.vercel.app"})
    assert res_comp.status_code == 200, f"Composite save failed: {res_comp.get_json()}"
    saved_img_path = res_comp.get_json().get("generated_image")
    assert saved_img_path and saved_img_path.startswith("/uploads/generated/")
    print(f"✓ [PASS] Save composite image: {saved_img_path}")

    # 7. Retrieve Generated Image via static route
    res_get_img = client.get(saved_img_path, headers={"Origin": "https://render-ai-tau.vercel.app"})
    assert res_get_img.status_code == 200, f"Get generated image failed: {res_get_img.status_code}"
    assert res_get_img.headers.get("Access-Control-Allow-Origin") == "https://render-ai-tau.vercel.app"
    print(f"✓ [PASS] Static serving of generated image ({len(res_get_img.data)} bytes) with CORS headers")

    print("\n========================================")
    print("ALL 7 API & CORS TESTS PASSED SUCCESSFULLY!")
    print("========================================")

if __name__ == "__main__":
    run_tests()
