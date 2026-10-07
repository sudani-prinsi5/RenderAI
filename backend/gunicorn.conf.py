import os

bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"
workers = int(os.environ.get("GUNICORN_WORKERS", "1"))
threads = int(os.environ.get("GUNICORN_THREADS", "4"))
worker_class = "gthread"
timeout = int(os.environ.get("GUNICORN_TIMEOUT", "120"))
keepalive = 5
max_requests = 1000
max_requests_jitter = 50
preload_app = False
