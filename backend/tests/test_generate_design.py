import os
import sys
import json
import unittest

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import app, db
from models import RoomUpload
from migrate import run_migration


class GenerateDesignRouteTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
        os.makedirs(cls.upload_dir, exist_ok=True)
        os.makedirs(os.path.join(cls.upload_dir, "generated"), exist_ok=True)

        test_image = os.path.join(cls.upload_dir, "unittest_room.jpg")
        if not os.path.exists(test_image):
            img = Image.new("RGB", (640, 480), color=(220, 210, 200))
            img.save(test_image)

        cls.test_image = test_image

    def setUp(self):
        self.app = app
        self.client = app.test_client()
        with app.app_context():
            db.create_all()
            run_migration(db)
            room = RoomUpload(
                user_id=1,
                original_image_name="unittest_room.jpg",
                original_image_path="/uploads/unittest_room.jpg",
                detected_image_name="unittest_room.jpg",
                detected_image_path="/uploads/unittest_room.jpg",
                detected_objects="Empty room",
                object_counts=json.dumps({}),
                detection_details=json.dumps({}),
                total_objects=0,
                status="Empty Room",
                room_length=12.0,
                room_width=10.0,
                room_height=9.0,
                is_empty_room=True,
                furniture_state=json.dumps([]),
                chat_history=json.dumps([]),
            )
            db.session.add(room)
            db.session.commit()
            self.room_id = room.id

    def test_generate_design_returns_generated_image(self):
        response = self.client.post(
            "/generate-design",
            json={"prompt": "Add a queen blue bed", "room_id": self.room_id},
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data["success"])
        self.assertIn("generated_image", data)
        self.assertTrue(data["generated_image"].startswith("/uploads/generated/"))
        self.assertGreater(len(data.get("furniture_items", [])), 0)


if __name__ == "__main__":
    unittest.main()
