
# from sqlalchemy.engine import URL

# DB_USERNAME = "root"
# DB_PASSWORD = "Prinsi@1405"
# DB_HOST = "localhost"
# DB_PORT = 3306
# DB_NAME = "ai_interior_designer"

# SQLALCHEMY_DATABASE_URI = URL.create(
#     drivername="mysql+pymysql",
#     username=DB_USERNAME,
#     password=DB_PASSWORD,
#     host=DB_HOST,
#     port=DB_PORT,
#     database=DB_NAME,
# )

# SQLALCHEMY_TRACK_MODIFICATIONS = False
# SECRET_KEY = "InteriorDesigner123"

import os
from sqlalchemy.engine import URL

# =========================
# Simple Custom dotenv Parser
# =========================
def load_dotenv(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key:
                        os.environ[key] = val

config_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(config_dir, ".env"))

# Also load from root directory if present
root_dir = os.path.abspath(os.path.join(config_dir, ".."))
load_dotenv(os.path.join(root_dir, ".env"))

# =========================
# Database Configuration
# =========================

DB_USERNAME = os.getenv("DB_USERNAME", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Prinsi@1405")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_NAME = os.getenv("DB_NAME", "ai_interior_designer")

# Support direct DATABASE_URL / MYSQL_URL (common on Render / cloud platforms)
raw_db_url = os.getenv("DATABASE_URL") or os.getenv("SQLALCHEMY_DATABASE_URI") or os.getenv("MYSQL_URL")

if raw_db_url:
    # Ensure MySQL URLs use pymysql driver
    if raw_db_url.startswith("mysql://"):
        raw_db_url = raw_db_url.replace("mysql://", "mysql+pymysql://", 1)
    elif raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = raw_db_url
else:
    SQLALCHEMY_DATABASE_URI = URL.create(
        drivername="mysql+pymysql",
        username=DB_USERNAME,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
    )

SQLALCHEMY_TRACK_MODIFICATIONS = False

SECRET_KEY = os.getenv("SECRET_KEY", "InteriorDesigner123")

# =========================
# CORS Origins Configuration
# =========================
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://render-ai-tau.vercel.app",
]

custom_origins = os.getenv("CORS_ORIGINS", "") or os.getenv("FRONTEND_URL", "")
ALLOWED_ORIGINS = list(DEFAULT_ALLOWED_ORIGINS)
if custom_origins:
    for o in custom_origins.split(","):
        cleaned = o.strip().rstrip("/")
        if cleaned and cleaned not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(cleaned)

# =========================
# Email Configuration
# =========================

MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))

# Smart defaults based on standard SMTP ports (465 = SSL, 587 = TLS)
if "MAIL_USE_TLS" in os.environ:
    MAIL_USE_TLS = str(os.getenv("MAIL_USE_TLS")).lower() in ("true", "1", "yes")
else:
    MAIL_USE_TLS = MAIL_PORT == 587

if "MAIL_USE_SSL" in os.environ:
    MAIL_USE_SSL = str(os.getenv("MAIL_USE_SSL")).lower() in ("true", "1", "yes")
else:
    MAIL_USE_SSL = MAIL_PORT == 465

MAIL_USERNAME = os.getenv("MAIL_USERNAME", "sudaniprinsi5@gmail.com").strip()
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "").strip()
MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", MAIL_USERNAME or "sudaniprinsi5@gmail.com").strip()

# Maximum payload size (32MB) for photo and composite uploads
MAX_CONTENT_LENGTH = 32 * 1024 * 1024