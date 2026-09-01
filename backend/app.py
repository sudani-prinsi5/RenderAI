
# from flask import Flask, send_from_directory
# from flask_cors import CORS
# from flask_mail import Mail

# from config import (
#     SQLALCHEMY_DATABASE_URI,
#     SQLALCHEMY_TRACK_MODIFICATIONS,
#     SECRET_KEY,
# )

# from extensions import db
# from routes.auth import auth
# from routes.upload import upload

# app = Flask(__name__)

# # Configuration
# app.config.from_object("config")
# app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
# app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
# app.config["SECRET_KEY"] = SECRET_KEY

# # Initialize Extensions
# db.init_app(app)
# mail = Mail(app)

# # CORS
# CORS(
#     app,
#     resources={r"/*": {"origins": "http://localhost:3000"}},
#     supports_credentials=True,
# )

# # Register Blueprints
# app.register_blueprint(auth)
# app.register_blueprint(upload)

# # Home Route
# @app.route("/")
# def home():
#     return {
#         "success": True,
#         "message": "AI Interior Designer Backend Running Successfully"
#     }

# # Serve Uploaded Images
# @app.route("/uploads/<filename>")
# def uploaded_file(filename):
#     return send_from_directory("uploads", filename)

# if __name__ == "__main__":
#     with app.app_context():
#         db.create_all()

#     app.run(host="0.0.0.0", port=5000, debug=True)
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_mail import Mail
import os

from config import (
    SQLALCHEMY_DATABASE_URI,
    SQLALCHEMY_TRACK_MODIFICATIONS,
    SECRET_KEY,
)

from extensions import db, mail
from routes.auth import auth
from routes.upload import upload
from routes.chat import chat
from routes.generate import generate
from routes.designs import designs
from routes.statistics import statistics
from migrate import run_migration

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
UPLOADS_ABS_PATH = os.path.join(ROOT_DIR, "uploads")
if not os.path.exists(UPLOADS_ABS_PATH):
    UPLOADS_ABS_PATH = os.path.join(BASE_DIR, "uploads")

app = Flask(__name__)
app.register_blueprint(chat)
app.register_blueprint(statistics)

# -----------------------------
# Configuration
# -----------------------------
app.config.from_object("config")
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
app.config["SECRET_KEY"] = SECRET_KEY

# -----------------------------
# Initialize Extensions
# -----------------------------
db.init_app(app)
mail.init_app(app)

# -----------------------------
# Enable CORS
# -----------------------------
CORS(
    app,
    resources={r"/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
)

# -----------------------------
# Register Blueprints
# -----------------------------
app.register_blueprint(auth)
app.register_blueprint(upload)

# -----------------------------
# Home Route
# -----------------------------
@app.route("/")
def home():
    return {
        "success": True,
        "message": "AI Interior Designer Backend Running Successfully"
    }

# -----------------------------
# Original Uploaded Images
# -----------------------------
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOADS_ABS_PATH, filename)

# -----------------------------
# YOLO Result Images
# -----------------------------
@app.route("/uploads/results/<path:filename>")
def result_file(filename):
    return send_from_directory(os.path.join(UPLOADS_ABS_PATH, "results"), filename)

@app.route("/uploads/generated/<path:filename>")
def generated_file(filename):
    return send_from_directory(os.path.join(UPLOADS_ABS_PATH, "generated"), filename)

app.register_blueprint(generate)
app.register_blueprint(designs)
# -----------------------------
# Run Server
# -----------------------------
if __name__ == "__main__":

    os.makedirs("uploads", exist_ok=True)
    os.makedirs("uploads/results", exist_ok=True)
    os.makedirs("uploads/generated", exist_ok=True)

    with app.app_context():
        db.create_all()
        run_migration(db)

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )