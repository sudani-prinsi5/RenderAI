import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def test_upload_continue_chat_flow():
    print("==================================================")
    print("TESTING ROOM UPLOAD -> CONTINUE CHAT WORKFLOW")
    print("==================================================")

    # 1. Simulate an authenticated user
    user_id = int(time.time()) % 100000 + 30000
    print(f"\n[Step 1] User {user_id} uploads an empty room image...")

    # Upload empty room
    empty_img_data = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {"image": ("test_empty_room.png", empty_img_data, "image/png")}
    data = {
        "room_length": "15.0",
        "room_width": "13.0",
        "room_height": "10.0",
        "is_empty_room": "true",
        "user_id": str(user_id)
    }

    r_upload = requests.post(f"{BASE_URL}/upload", files=files, data=data)
    assert r_upload.status_code == 200, f"Upload failed: {r_upload.text}"
    upload_res = r_upload.json()
    assert upload_res["success"] is True
    room_id = upload_res["room_id"]
    original_image = upload_res["original_image"]
    print(f"[PASS] Upload succeeded: room_id={room_id}, original_image={original_image}")

    # 2. Simulate User clicking "Continue Chat" -> frontend requests /latest-room?user_id=...&room_id=...
    print(f"\n[Step 2] User navigates to /chat?room_id={room_id} -> frontend calls /latest-room...")
    r_latest_target = requests.get(f"{BASE_URL}/latest-room?user_id={user_id}&room_id={room_id}")
    assert r_latest_target.status_code == 200, f"Failed to get target room: {r_latest_target.text}"
    room_data = r_latest_target.json()
    assert room_data["success"] is True
    assert room_data["room_id"] == room_id
    assert room_data["room_length"] == 15.0
    assert room_data["room_width"] == 13.0
    assert room_data["original_image"] == original_image
    print(f"[PASS] /latest-room with room_id successfully retrieved room #{room_id} with correct dimensions and image.")

    # 3. Simulate User refreshing /chat without query params -> frontend calls /latest-room?user_id=...
    print(f"\n[Step 3] User refreshes /chat -> frontend calls /latest-room?user_id={user_id}...")
    r_latest_user = requests.get(f"{BASE_URL}/latest-room?user_id={user_id}")
    assert r_latest_user.status_code == 200, f"Failed to get user's latest room: {r_latest_user.text}"
    user_latest_data = r_latest_user.json()
    assert user_latest_data["success"] is True
    assert user_latest_data["room_id"] == room_id
    print(f"[PASS] /latest-room without query param successfully restores latest uploaded room #{room_id}.")

    # 4. User places furniture and updates furniture state
    print(f"\n[Step 4] User places furniture in workspace -> updates furniture state...")
    placed_items = [
        {
            "id": "item_0",
            "name": "Luxury King Bed",
            "label": "Luxury King Bed",
            "category": "bed",
            "price": 25000,
            "pos_x": 50,
            "pos_y": 60,
            "scale": 1.0,
            "rotation": 0,
            "image_url": "/furniture_dataset/bed/buget_10k/bed1.jpeg"
        }
    ]
    r_update_state = requests.post(
        f"{BASE_URL}/chat/update-furniture-state",
        json={
            "room_id": room_id,
            "user_id": user_id,
            "furniture_state": placed_items
        }
    )
    assert r_update_state.status_code == 200, f"Failed to update furniture state: {r_update_state.text}"
    print("[PASS] Furniture state updated successfully in DB.")

    # 5. Verify that reloading /latest-room returns the saved furniture items
    print(f"\n[Step 5] Verify /latest-room preserves placed furniture items after reload...")
    r_check = requests.get(f"{BASE_URL}/latest-room?user_id={user_id}&room_id={room_id}")
    assert r_check.status_code == 200
    check_data = r_check.json()
    assert len(check_data["furniture_state"]) == 1
    assert check_data["furniture_state"][0]["name"] == "Luxury King Bed"
    print("[PASS] Placed furniture items persisted and restored successfully!")

    print("\n==================================================")
    print("ALL UPLOAD -> CONTINUE CHAT TESTS PASSED (5/5)!")
    print("==================================================")

if __name__ == "__main__":
    test_upload_continue_chat_flow()
