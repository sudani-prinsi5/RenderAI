from flask import Flask, send_from_directory, request, make_response, jsonify
from flask_cors import CORS
import os

from config import (
    SQLALCHEMY_DATABASE_URI,
    SQLALCHEMY_TRACK_MODIFICATIONS,
    SECRET_KEY,
    ALLOWED_ORIGINS,
    MAX_CONTENT_LENGTH,
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

# Resolve upload paths consistently
UPLOAD_CANDIDATES = [
    os.path.join(ROOT_DIR, "uploads"),
    os.path.join(BASE_DIR, "uploads"),
]
UPLOADS_ABS_PATH = UPLOAD_CANDIDATES[0]
for cand in UPLOAD_CANDIDATES:
    if os.path.exists(cand):
        UPLOADS_ABS_PATH = cand
        break

# Create all necessary upload subdirectories
for folder in ["", "results", "generated", "extracted_objects", "cleaned"]:
    target_dir = os.path.join(UPLOADS_ABS_PATH, folder) if folder else UPLOADS_ABS_PATH
    os.makedirs(target_dir, exist_ok=True)
    # Also ensure in base directory if different
    base_target = os.path.join(BASE_DIR, "uploads", folder) if folder else os.path.join(BASE_DIR, "uploads")
    os.makedirs(base_target, exist_ok=True)

app = Flask(__name__)

# -----------------------------
# Configuration
# -----------------------------
app.config.from_object("config")
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = SQLALCHEMY_TRACK_MODIFICATIONS
app.config["SECRET_KEY"] = SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

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
    resources={
        r"/*": {
            "origins": ALLOWED_ORIGINS,
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 86400,
        }
    },
    supports_credentials=True,
)

# -----------------------------
# CORS Preflight & Header Safeguards
# -----------------------------
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin")
        response = make_response()
        if origin and (origin in ALLOWED_ORIGINS or origin.rstrip("/") in [o.rstrip("/") for o in ALLOWED_ORIGINS]):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        elif ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]
            response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response, 200

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and (origin in ALLOWED_ORIGINS or origin.rstrip("/") in [o.rstrip("/") for o in ALLOWED_ORIGINS]):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    elif "Access-Control-Allow-Origin" not in response.headers and ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS[0]
        response.headers["Access-Control-Allow-Credentials"] = "true"

    if "Access-Control-Allow-Headers" not in response.headers:
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept, Origin"
    if "Access-Control-Allow-Methods" not in response.headers:
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    return response

# -----------------------------
# Register Blueprints
# -----------------------------
app.register_blueprint(auth)
app.register_blueprint(upload)
app.register_blueprint(chat)
app.register_blueprint(generate)
app.register_blueprint(designs)
app.register_blueprint(statistics)

# -----------------------------
# Home & Health Route
# -----------------------------
@app.route("/")
def home():
    return {
        "success": True,
        "message": "AI Interior Designer Backend Running Successfully",
        "status": "online"
    }

@app.route("/health")
def health():
    return {
        "success": True,
        "status": "healthy"
    }

# -----------------------------
# Static File Helper
# -----------------------------
def _serve_from_candidates(candidates, filename):
    clean_fn = str(filename).replace("\\", "/").strip("/")
    for base in candidates:
        full = os.path.normpath(os.path.join(base, clean_fn))
        if os.path.exists(full) and os.path.isfile(full):
            parent = os.path.dirname(full)
            base_fn = os.path.basename(full)
            return send_from_directory(parent, base_fn)
    return jsonify({"success": False, "message": "File not found"}), 404

# -----------------------------
# Uploaded & Generated Images
# -----------------------------
@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    candidates = [
        UPLOADS_ABS_PATH,
        os.path.join(ROOT_DIR, "uploads"),
        os.path.join(BASE_DIR, "uploads"),
    ]
    return _serve_from_candidates(candidates, filename)

@app.route("/uploads/results/<path:filename>")
def result_file(filename):
    candidates = [
        os.path.join(UPLOADS_ABS_PATH, "results"),
        os.path.join(ROOT_DIR, "uploads", "results"),
        os.path.join(BASE_DIR, "uploads", "results"),
    ]
    return _serve_from_candidates(candidates, filename)

@app.route("/uploads/generated/<path:filename>")
def generated_file(filename):
    candidates = [
        os.path.join(UPLOADS_ABS_PATH, "generated"),
        os.path.join(ROOT_DIR, "uploads", "generated"),
        os.path.join(BASE_DIR, "uploads", "generated"),
    ]
    return _serve_from_candidates(candidates, filename)

@app.route("/uploads/extracted_objects/<path:filename>")
def extracted_object_file(filename):
    candidates = [
        os.path.join(UPLOADS_ABS_PATH, "extracted_objects"),
        os.path.join(ROOT_DIR, "uploads", "extracted_objects"),
        os.path.join(BASE_DIR, "uploads", "extracted_objects"),
    ]
    return _serve_from_candidates(candidates, filename)

@app.route("/uploads/cleaned/<path:filename>")
def cleaned_file(filename):
    candidates = [
        os.path.join(UPLOADS_ABS_PATH, "cleaned"),
        os.path.join(ROOT_DIR, "uploads", "cleaned"),
        os.path.join(BASE_DIR, "uploads", "cleaned"),
    ]
    return _serve_from_candidates(candidates, filename)

# -----------------------------
# Furniture Dataset Images
# -----------------------------
@app.route("/furniture_dataset/<path:filename>")
def dataset_file(filename):
    candidates = [
        os.path.join(ROOT_DIR, "frontend", "public", "furniture_dataset"),
        os.path.join(BASE_DIR, "frontend", "public", "furniture_dataset"),
        os.path.join(ROOT_DIR, "furniture_dataset"),
        os.path.join(BASE_DIR, "furniture_dataset"),
    ]
    return _serve_from_candidates(candidates, filename)

# -----------------------------
# Run Server
# -----------------------------
if __name__ == "__main__":
    with app.app_context():
        try:
            db.create_all()
            run_migration(db)
        except Exception as e:
            print(f"Warning: Database initialization error: {e}")

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=True
    )