from app import db, mail
from flask_mail import Message
from flask import Blueprint, request, jsonify
from models import User
from extensions import db, mail
from flask_mail import Message
import bcrypt

auth = Blueprint("auth", __name__)


# ==========================
# Register
# ==========================
@auth.route("/register", methods=["POST"])
def register():

    try:
        data = request.get_json()

        full_name = data.get("full_name")
        email = data.get("email")
        phone = data.get("phone")
        password = data.get("password")

        if not full_name or not email or not phone or not password:
            return jsonify({
                "success": False,
                "message": "Please fill all fields."
            }), 400

        existing = User.query.filter_by(email=email).first()

        if existing:
            return jsonify({
                "success": False,
                "message": "Email already exists."
            }), 409

        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=hashed_password
        )

        db.session.add(user)
        db.session.commit()

        # Send Welcome Email
        try:
            msg = Message(
                subject="Welcome to AI Interior Designer",
                recipients=[email]
            )

            msg.body = f"""
Hello {full_name},

Your registration was completed successfully.

Welcome to AI Interior Designer.

Thank you for joining us.

Regards,
AI Interior Designer Team
"""

            mail.send(msg)

        except Exception as e:
            print("Mail Error:", e)

        return jsonify({
            "success": True,
            "message": "Registration Successful"
        }), 201

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ==========================
# Login
# ==========================
@auth.route("/login", methods=["POST"])
def login():

    try:
        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid Email"
            }), 401

        if bcrypt.checkpw(
            password.encode("utf-8"),
            user.password_hash.encode("utf-8")
        ):

            return jsonify({
                "success": True,
                "message": "Login Successful",
                "user": {
                    "user_id": user.user_id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone
                }
            }), 200

        return jsonify({
            "success": False,
            "message": "Incorrect Password"
        }), 401

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500