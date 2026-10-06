import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def test_user_isolation():
    print("==================================================")
    print("Testing User Chat Isolation & Security Enforcement")
    print("==================================================")

    # 1. Verify /latest-room without user_id returns 401
    print("\n[Test 1] Requesting /latest-room without user_id...")
    r = requests.get(f"{BASE_URL}/latest-room")
    print(f"Status: {r.status_code}, Response: {r.json()}")
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"
    print("[OK] PASS: Anonymous request rejected with 401.")

    # 2. Setup or identify dynamic User A and User B
    import time
    user_a_id = int(time.time()) % 100000 + 10000
    user_b_id = user_a_id + 1

    # Initialize a room for User A
    print(f"\n[Test 2] Initializing Room for User A (ID: {user_a_id})...")
    r_a = requests.post(
        f"{BASE_URL}/chat/init-room",
        json={
            "user_id": user_a_id,
            "room_length": 16.0,
            "room_width": 14.0,
            "room_height": 10.0,
            "is_empty_room": True
        }
    )
    assert r_a.status_code == 201, f"Failed to init room for User A: {r_a.text}"
    user_a_room_id = r_a.json()["room_id"]
    print(f"[OK] PASS: User A created Room ID: {user_a_room_id}")

    # Send a chat message as User A
    print(f"\n[Test 3] User A sends a chat message in room {user_a_room_id}...")
    r_msg_a = requests.post(
        f"{BASE_URL}/chat",
        json={
            "room_id": user_a_room_id,
            "user_id": user_a_id,
            "message": "I want a luxury king size bed for my master bedroom",
            "generate_image": False
        }
    )
    assert r_msg_a.status_code == 200, f"Failed to send message as User A: {r_msg_a.text}"
    user_a_history = r_msg_a.json()["chat_history"]
    print(f"[OK] PASS: User A chat history recorded {len(user_a_history)} messages.")

    # User A retrieves their latest room
    print(f"\n[Test 4] User A retrieves their latest room via /latest-room?user_id={user_a_id}...")
    r_get_a = requests.get(f"{BASE_URL}/latest-room?user_id={user_a_id}")
    assert r_get_a.status_code == 200, f"Failed to get room for User A: {r_get_a.text}"
    data_a = r_get_a.json()
    assert data_a["room_id"] == user_a_room_id, "User A received wrong room ID"
    assert len(data_a["chat_history"]) == len(user_a_history), "User A chat history mismatch"
    print(f"[OK] PASS: User A successfully received ONLY User A's chat and room {data_a['room_id']}.")

    # User B queries their latest room before creating one
    print(f"\n[Test 5] User B (ID: {user_b_id}) queries /latest-room?user_id={user_b_id} (no room created yet)...")
    r_get_b = requests.get(f"{BASE_URL}/latest-room?user_id={user_b_id}")
    print(f"Status: {r_get_b.status_code}, Response: {r_get_b.json()}")
    assert r_get_b.status_code == 404, f"Expected 404 for User B before room creation, got {r_get_b.status_code}"
    print("[OK] PASS: User B receives 404 (does NOT see User A's room or chat!).")

    # SECURITY ATTACK TEST: User B attempts to access User A's room by passing room_id=user_a_room_id
    print(f"\n[Test 6] SECURITY TEST: User B attempts to access User A's room ID ({user_a_room_id}) with user_id={user_b_id}...")
    r_hack = requests.get(f"{BASE_URL}/latest-room?room_id={user_a_room_id}&user_id={user_b_id}")
    print(f"Status: {r_hack.status_code}, Response: {r_hack.json()}")
    assert r_hack.status_code == 404, f"Security Breach! Expected 404, got {r_hack.status_code}"
    print("[OK] PASS: Access denied! User B cannot access User A's room/chat ID.")

    # SECURITY ATTACK TEST: User B attempts to send message to User A's room
    print(f"\n[Test 7] SECURITY TEST: User B attempts to POST /chat with room_id={user_a_room_id} and user_id={user_b_id}...")
    r_hack_msg = requests.post(
        f"{BASE_URL}/chat",
        json={
            "room_id": user_a_room_id,
            "user_id": user_b_id,
            "message": "Hacked chat message",
            "generate_image": False
        }
    )
    print(f"Status: {r_hack_msg.status_code}, Response: {r_hack_msg.json()}")
    assert r_hack_msg.status_code == 404, f"Security Breach! Expected 404, got {r_hack_msg.status_code}"
    print("[OK] PASS: Access denied! User B cannot post to User A's chat.")

    # Initialize a distinct room for User B
    print(f"\n[Test 8] Initializing Room for User B (ID: {user_b_id})...")
    r_b = requests.post(
        f"{BASE_URL}/chat/init-room",
        json={
            "user_id": user_b_id,
            "room_length": 12.0,
            "room_width": 10.0,
            "room_height": 9.0,
            "is_empty_room": True
        }
    )
    assert r_b.status_code == 201, f"Failed to init room for User B: {r_b.text}"
    user_b_room_id = r_b.json()["room_id"]
    print(f"[OK] PASS: User B created Room ID: {user_b_room_id}")

    # User B sends their own chat message
    print(f"\n[Test 9] User B sends a chat message in room {user_b_room_id}...")
    r_msg_b = requests.post(
        f"{BASE_URL}/chat",
        json={
            "room_id": user_b_room_id,
            "user_id": user_b_id,
            "message": "I need a compact kids study table and lamp",
            "generate_image": False
        }
    )
    assert r_msg_b.status_code == 200, f"Failed to send message as User B: {r_msg_b.text}"
    user_b_history = r_msg_b.json()["chat_history"]
    print(f"[OK] PASS: User B chat history recorded.")

    # Verify User A still sees ONLY User A's chat
    print(f"\n[Test 10] Verifying User A chat isolation: /latest-room?user_id={user_a_id}...")
    r_check_a = requests.get(f"{BASE_URL}/latest-room?user_id={user_a_id}")
    data_check_a = r_check_a.json()
    assert data_check_a["room_id"] == user_a_room_id
    assert any("king size bed" in str(m.get("text", "")) for m in data_check_a["chat_history"])
    assert not any("study table" in str(m.get("text", "")) for m in data_check_a["chat_history"])
    print("[OK] PASS: User A sees ONLY User A's chat (Zero trace of User B's messages).")

    # Verify User B sees ONLY User B's chat
    print(f"\n[Test 11] Verifying User B chat isolation: /latest-room?user_id={user_b_id}...")
    r_check_b = requests.get(f"{BASE_URL}/latest-room?user_id={user_b_id}")
    data_check_b = r_check_b.json()
    assert data_check_b["room_id"] == user_b_room_id
    assert any("study table" in str(m.get("text", "")) for m in data_check_b["chat_history"])
    assert not any("king size bed" in str(m.get("text", "")) for m in data_check_b["chat_history"])
    print("[OK] PASS: User B sees ONLY User B's chat (Zero trace of User A's messages).")

    print("\n==================================================")
    print("ALL USER ISOLATION & SECURITY TESTS PASSED (11/11)")
    print("==================================================")

if __name__ == "__main__":
    test_user_isolation()
