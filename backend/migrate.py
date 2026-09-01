"""Safe database migration – adds new columns without dropping data."""

from sqlalchemy import inspect, text


def run_migration(db):
    inspector = inspect(db.engine)
    table_names = inspector.get_table_names()

    # Create any missing tables (including email_verifications)
    db.create_all()

    if "room_uploads" not in table_names:
        return

    existing = {
        column["name"]
        for column in inspector.get_columns("room_uploads")
    }

    additions = [
        ("room_length", "FLOAT NULL"),
        ("room_width", "FLOAT NULL"),
        ("room_height", "FLOAT NULL"),
        ("is_empty_room", "BOOLEAN DEFAULT 0"),
        ("furniture_state", "TEXT NULL"),
        ("chat_history", "TEXT NULL"),
        ("detection_details", "TEXT NULL"),
        ("generated_image_name", "VARCHAR(255) NULL"),
        ("generated_image_path", "VARCHAR(500) NULL"),
        ("budget", "FLOAT DEFAULT 50000.0"),
    ]

    for column_name, column_type in additions:
        if column_name not in existing:
            db.session.execute(
                text(
                    f"ALTER TABLE room_uploads "
                    f"ADD COLUMN {column_name} {column_type}"
                )
            )

    db.session.commit()
