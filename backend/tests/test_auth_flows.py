import os
import sys
import unittest
import json

# Add backend directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from app import app
from extensions import db
from models import User, EmailVerification

class AuthFlowTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        with self.app.app_context():
            db.create_all()
            EmailVerification.query.filter(EmailVerification.email.like("tester%")).delete()
            User.query.filter(User.email.like("tester%")).delete()
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.rollback()
            EmailVerification.query.filter(EmailVerification.email.like("tester%")).delete()
            User.query.filter(User.email.like("tester%")).delete()
            db.session.commit()
            db.session.remove()

    def test_complete_registration_and_login_flow(self):
        test_email = "tester1@example.com"
        test_pass = "SecureP@ss123"

        # 1. Send verification code
        res = self.client.post("/send-verification-code", json={
            "email": test_email,
            "full_name": "Test User",
            "phone": "9876543210"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))

        # Retrieve generated OTP code from DB
        with self.app.app_context():
            record = EmailVerification.query.filter_by(email=test_email).first()
            self.assertIsNotNone(record)
            otp_code = record.code

        # 2. Verify and register
        res = self.client.post("/verify-and-register", json={
            "full_name": "Test User",
            "email": test_email,
            "phone": "9876543210",
            "password": test_pass,
            "verification_code": otp_code
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("Registration Successful", data.get("message"))

        # 3. Login with registered credentials
        res = self.client.post("/login", json={
            "email": test_email,
            "password": test_pass
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["user"]["email"], test_email)

    def test_change_password_flow(self):
        test_email = "tester2@example.com"
        old_pass = "OldP@ssword1"
        new_pass = "NewP@ssword2"

        # First register user
        with self.app.app_context():
            import bcrypt
            hashed = bcrypt.hashpw(old_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            user = User(full_name="Password Changer", email=test_email, password_hash=hashed, phone="1234567890")
            db.session.add(user)
            db.session.commit()
            user_id = user.user_id

        # Change Password
        res = self.client.post("/change-password", json={
            "user_id": user_id,
            "email": test_email,
            "current_password": old_pass,
            "new_password": new_pass
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("Password changed successfully", data.get("message"))

        # Verify login works with new password
        res = self.client.post("/login", json={
            "email": test_email,
            "password": new_pass
        })
        self.assertEqual(res.status_code, 200)

        # Verify old password fails
        res = self.client.post("/login", json={
            "email": test_email,
            "password": old_pass
        })
        self.assertEqual(res.status_code, 401)

    def test_forgot_password_flow(self):
        test_email = "tester3@example.com"
        old_pass = "InitP@ss1"
        reset_pass = "ResetP@ssword2"

        # Seed user
        with self.app.app_context():
            import bcrypt
            hashed = bcrypt.hashpw(old_pass.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            user = User(full_name="Forgot User", email=test_email, password_hash=hashed, phone="1234567890")
            db.session.add(user)
            db.session.commit()

        # 1. Forgot password - send code
        res = self.client.post("/forgot-password/send-code", json={
            "email": test_email
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))

        # Retrieve OTP code
        with self.app.app_context():
            record = EmailVerification.query.filter_by(email=test_email).order_by(EmailVerification.id.desc()).first()
            self.assertIsNotNone(record)
            otp_code = record.code

        # 2. Reset password with verification code
        res = self.client.post("/forgot-password/reset", json={
            "email": test_email,
            "verification_code": otp_code,
            "new_password": reset_pass
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get("success"))
        self.assertIn("Password reset successful", data.get("message"))

        # 3. Test login with reset password
        res = self.client.post("/login", json={
            "email": test_email,
            "password": reset_pass
        })
        self.assertEqual(res.status_code, 200)

if __name__ == "__main__":
    unittest.main()
