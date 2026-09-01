from extensions import db


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))

    def __repr__(self):
        return f"<User {self.email}>"


class RoomUpload(db.Model):
    __tablename__ = "room_uploads"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)

    original_image_name = db.Column(db.String(255))
    original_image_path = db.Column(db.String(500))

    detected_image_name = db.Column(db.String(255))
    detected_image_path = db.Column(db.String(500))

    detected_objects = db.Column(db.Text(4294967295))
    total_objects = db.Column(db.Integer)
    status = db.Column(db.String(50))

    object_counts = db.Column(db.Text(4294967295))
    detection_details = db.Column(db.Text(4294967295))

    room_length = db.Column(db.Float)
    room_width = db.Column(db.Float)
    room_height = db.Column(db.Float)
    is_empty_room = db.Column(db.Boolean, default=False)

    furniture_state = db.Column(db.Text(4294967295))
    chat_history = db.Column(db.Text(4294967295))

    generated_image_name = db.Column(db.String(255))
    generated_image_path = db.Column(db.String(500))
    budget = db.Column(db.Float, default=50000.0)

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )


class EmailVerification(db.Model):
    __tablename__ = "email_verifications"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False, index=True)
    code = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    expires_at = db.Column(db.DateTime, nullable=False)
    is_verified = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<EmailVerification {self.email} - {self.code}>"

