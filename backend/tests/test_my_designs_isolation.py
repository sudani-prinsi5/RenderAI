import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_my_designs_isolation():
    print("==================================================")
    print("Testing My Designs User Isolation & Zero Upload State")
    print("==================================================")

    # 1. Anonymous request without user_id
    print("\n[Test 1] GET /my-designs without user_id...")
    r1 = requests.get(f"{BASE_URL}/my-designs")
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1["success"] is True
    assert data1["count"] == 0
    assert data1["designs"] == []
    print("[OK] PASS: Anonymous request returns 0 designs (no data leaked).")

    # 2. Brand new user with 0 uploads
    new_user_id = 9999
    print(f"\n[Test 2] GET /my-designs?user_id={new_user_id} for a user with zero uploads...")
    r2 = requests.get(f"{BASE_URL}/my-designs?user_id={new_user_id}")
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2["success"] is True
    assert data2["count"] == 0
    assert data2["designs"] == []
    print(f"[OK] PASS: New user (ID: {new_user_id}) sees completely EMPTY My Designs (Zero rooms).")

    # 3. Verify Room #87 or any other existing rooms do NOT appear for new user
    print(f"\n[Test 3] Verifying Room #87 does NOT appear for user {new_user_id}...")
    assert not any(d.get("room_id") == 87 for d in data2["designs"])
    print("[OK] PASS: Room #87 is NOT in user's My Designs.")

    # 4. User A (ID: 9501) uploads a room
    user_a_id = 9501
    print(f"\n[Test 4] User A (ID: {user_a_id}) creates a room...")
    r_create = requests.post(
        f"{BASE_URL}/chat/init-room",
        json={
            "user_id": user_a_id,
            "room_length": 15.0,
            "room_width": 12.0,
            "room_height": 10.0,
            "is_empty_room": True
        }
    )
    assert r_create.status_code == 201
    room_a_id = r_create.json()["room_id"]
    print(f"[OK] PASS: User A created Room #{room_a_id}.")

    # 5. User A checks My Designs
    print(f"\n[Test 5] GET /my-designs?user_id={user_a_id} for User A...")
    r_a = requests.get(f"{BASE_URL}/my-designs?user_id={user_a_id}")
    assert r_a.status_code == 200
    data_a = r_a.json()
    assert data_a["count"] >= 1
    assert any(d["room_id"] == room_a_id for d in data_a["designs"])
    print(f"[OK] PASS: User A sees Room #{room_a_id} in My Designs.")

    # 6. Verify new user (ID: 9999) STILL sees 0 designs
    print(f"\n[Test 6] Re-checking new user (ID: {new_user_id}) My Designs after User A's upload...")
    r_b = requests.get(f"{BASE_URL}/my-designs?user_id={new_user_id}")
    assert r_b.status_code == 200
    data_b = r_b.json()
    assert data_b["count"] == 0
    assert data_b["designs"] == []
    print(f"[OK] PASS: New user still sees EMPTY My Designs (0 designs).")

    # 7. Security test: New user attempts to access User A's design details
    print(f"\n[Test 7] SECURITY TEST: User {new_user_id} requests /designs/{room_a_id}?user_id={new_user_id}...")
    r_sec = requests.get(f"{BASE_URL}/designs/{room_a_id}?user_id={new_user_id}")
    assert r_sec.status_code == 404
    print(f"[OK] PASS: Access denied! User {new_user_id} cannot view User A's design details.")

    # 8. User A accesses own design details
    print(f"\n[Test 8] User A requests /designs/{room_a_id}?user_id={user_a_id}...")
    r_own = requests.get(f"{BASE_URL}/designs/{room_a_id}?user_id={user_a_id}")
    assert r_own.status_code == 200
    assert r_own.json()["room_id"] == room_a_id
    print(f"[OK] PASS: User A successfully loaded own design details.")

    print("\n==================================================")
    print("ALL MY DESIGNS ISOLATION TESTS PASSED (8/8)")
    print("==================================================")

if __name__ == "__main__":
    test_my_designs_isolation()
