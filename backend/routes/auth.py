from flask import Blueprint, request, jsonify
from extensions import db, mail
from models import User, EmailVerification
from flask_mail import Message
from datetime import datetime, timedelta
import bcrypt
import random
import re

auth = Blueprint("auth", __name__)

# ===========================
# Helper: Email Templates
# ===========================
def send_verification_email(recipient_email, full_name, code):
    """Sends a 6-digit OTP verification code to the user's email."""
    name_display = full_name if full_name else "Valued User"
    msg = Message(
        subject="Your Verification Code - AI Interior Designer",
        recipients=[recipient_email]
    )
    
    msg.body = f"""Hello {name_display},

Your verification code for AI Interior Designer is: {code}

This code is valid for 10 minutes. Please enter this code to complete your registration.

If you did not request this code, please ignore this email.

Best regards,
AI Interior Designer Team
"""

    msg.html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
        .container {{ max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; margin-bottom: 28px; }}
        .brand {{ font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .title {{ font-size: 20px; font-weight: 700; color: #f1f5f9; margin-top: 10px; }}
        .content {{ font-size: 15px; line-height: 1.6; color: #94a3b8; text-align: center; }}
        .otp-box {{ margin: 28px auto; padding: 18px 24px; background: #0f172a; border: 2px dashed #6366f1; border-radius: 12px; display: inline-block; }}
        .otp-code {{ font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #a5b4fc; font-family: 'Courier New', monospace; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">📐 AI Interior Designer</div>
          <div class="title">Verify Your Email Address</div>
        </div>
        <div class="content">
          <p>Hello <strong style="color: #f1f5f9;">{name_display}</strong>,</p>
          <p>Thank you for starting your registration. Use the 6-digit verification code below to verify your email address:</p>
          
          <div class="otp-box">
            <div class="otp-code">{code}</div>
          </div>
          
          <p style="font-size: 13px; color: #cbd5e1;">⏱️ This code will expire in <strong>10 minutes</strong>.</p>
          <p style="font-size: 13px; color: #64748b;">If you did not request this verification code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} AI Interior Designer. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
    mail.send(msg)


def send_welcome_email(recipient_email, full_name, password):
    """Sends a Registration Successful welcome confirmation email with user's created password."""
    name_display = full_name if full_name else "User"
    msg = Message(
        subject="🎉 Registration Successful - Welcome to AI Interior Designer!",
        recipients=[recipient_email]
    )

    msg.body = f"""Hello {name_display},

Congratulations! Your registration with AI Interior Designer is completed successfully.

Your account details:
• Email: {recipient_email}
• Password: {password}

Security Note: Keep your password confidential. You can change your password at any time in the Settings section.

Best regards,
AI Interior Designer Team
"""

    msg.html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
        .container {{ max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .brand {{ font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .badge {{ display: inline-block; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 12px; }}
        .title {{ font-size: 22px; font-weight: 700; color: #f1f5f9; margin-top: 14px; }}
        .content {{ font-size: 14px; line-height: 1.6; color: #94a3b8; }}
        .cred-box {{ margin: 20px 0; background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #6366f1; }}
        .cred-title {{ font-size: 13px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }}
        .cred-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }}
        .cred-label {{ color: #94a3b8; }}
        .cred-value {{ color: #f8fafc; font-family: 'Courier New', monospace; font-weight: 600; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">📐 AI Interior Designer</div>
          <div class="badge">✓ Registration Completed</div>
          <div class="title">Registration Successful!</div>
        </div>
        <div class="content">
          <p>Hello <strong style="color: #f1f5f9;">{name_display}</strong>,</p>
          <p>Welcome to <strong>AI Interior Designer</strong>! Your account has been created and verified successfully. Below are your account credentials:</p>
          
          <div class="cred-box">
            <div class="cred-title">🔑 Your Account Credentials</div>
            <div class="cred-row">
              <span class="cred-label">Registered Email:</span>
              <span class="cred-value">{recipient_email}</span>
            </div>
            <div class="cred-row" style="border-bottom: none;">
              <span class="cred-label">Created Password:</span>
              <span class="cred-value" style="color: #38bdf8;">{password}</span>
            </div>
          </div>
          
          <p style="font-size: 12px; color: #64748b;">🔒 Please keep your credentials secure. You can manage or change your password anytime under the Settings section.</p>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} AI Interior Designer. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
    mail.send(msg)


def send_forgot_password_code_email(recipient_email, full_name, code):
    """Sends a 6-digit OTP verification code for password reset."""
    name_display = full_name if full_name else "User"
    msg = Message(
        subject="🔑 Password Reset Verification Code - AI Interior Designer",
        recipients=[recipient_email]
    )

    msg.body = f"""Hello {name_display},

We received a request to reset the password for your AI Interior Designer account.

Your verification code is: {code}

This code is valid for 10 minutes. Enter this code to verify your identity and set a new password.

If you did not request a password reset, please ignore this email or update your security settings.

Best regards,
AI Interior Designer Team
"""

    msg.html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
        .container {{ max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; margin-bottom: 28px; }}
        .brand {{ font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .title {{ font-size: 20px; font-weight: 700; color: #f1f5f9; margin-top: 10px; }}
        .content {{ font-size: 15px; line-height: 1.6; color: #94a3b8; text-align: center; }}
        .otp-box {{ margin: 28px auto; padding: 18px 24px; background: #0f172a; border: 2px dashed #f59e0b; border-radius: 12px; display: inline-block; }}
        .otp-code {{ font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #fbbf24; font-family: 'Courier New', monospace; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">📐 AI Interior Designer</div>
          <div class="title">Password Reset Verification</div>
        </div>
        <div class="content">
          <p>Hello <strong style="color: #f1f5f9;">{name_display}</strong>,</p>
          <p>We received a request to reset your account password. Use the verification code below to proceed:</p>
          
          <div class="otp-box">
            <div class="otp-code">{code}</div>
          </div>
          
          <p style="font-size: 13px; color: #cbd5e1;">⏱️ This code will expire in <strong>10 minutes</strong>.</p>
          <p style="font-size: 13px; color: #64748b;">If you did not request this password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} AI Interior Designer. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
    mail.send(msg)


def send_password_reset_success_email(recipient_email, full_name, new_password):
    """Sends confirmation after successful password reset containing the newly created password."""
    name_display = full_name if full_name else "User"
    msg = Message(
        subject="🔒 Password Reset Successful - Your New Password",
        recipients=[recipient_email]
    )

    msg.body = f"""Hello {name_display},

Your password for AI Interior Designer has been reset successfully.

Your updated credentials:
• Email: {recipient_email}
• New Password: {new_password}

You can now log in with your new password.

If you did not make this change, please contact support or reset your password immediately.

Best regards,
AI Interior Designer Team
"""

    msg.html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
        .container {{ max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .brand {{ font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .badge {{ display: inline-block; background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 12px; }}
        .title {{ font-size: 22px; font-weight: 700; color: #f1f5f9; margin-top: 14px; }}
        .content {{ font-size: 14px; line-height: 1.6; color: #94a3b8; }}
        .cred-box {{ margin: 20px 0; background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #22c55e; }}
        .cred-title {{ font-size: 13px; font-weight: 700; color: #4ade80; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }}
        .cred-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }}
        .cred-label {{ color: #94a3b8; }}
        .cred-value {{ color: #f8fafc; font-family: 'Courier New', monospace; font-weight: 600; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">📐 AI Interior Designer</div>
          <div class="badge">✓ Password Reset Completed</div>
          <div class="title">Password Reset Successful!</div>
        </div>
        <div class="content">
          <p>Hello <strong style="color: #f1f5f9;">{name_display}</strong>,</p>
          <p>Your password has been successfully reset. You can now use your newly created password to sign in:</p>
          
          <div class="cred-box">
            <div class="cred-title">🔑 Updated Account Credentials</div>
            <div class="cred-row">
              <span class="cred-label">Account Email:</span>
              <span class="cred-value">{recipient_email}</span>
            </div>
            <div class="cred-row" style="border-bottom: none;">
              <span class="cred-label">Newly Created Password:</span>
              <span class="cred-value" style="color: #4ade80;">{new_password}</span>
            </div>
          </div>
          
          <p style="font-size: 12px; color: #64748b;">🔒 If you did not make this change, please reset your password immediately or contact our support team.</p>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} AI Interior Designer. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
    mail.send(msg)


def send_password_changed_email(recipient_email, full_name, new_password):
    """Sends confirmation after user changes password in Settings containing the newly created password."""
    name_display = full_name if full_name else "User"
    msg = Message(
        subject="🔐 Password Changed Successfully - AI Interior Designer",
        recipients=[recipient_email]
    )

    msg.body = f"""Hello {name_display},

Your account password for AI Interior Designer has been updated successfully via Settings.

Your new credentials:
• Email: {recipient_email}
• New Password: {new_password}

Security Note: If you did not authorize this change, please reset your password immediately.

Best regards,
AI Interior Designer Team
"""

    msg.html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
        .container {{ max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 36px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .brand {{ font-size: 26px; font-weight: 800; background: linear-gradient(135deg, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        .badge {{ display: inline-block; background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 12px; }}
        .title {{ font-size: 22px; font-weight: 700; color: #f1f5f9; margin-top: 14px; }}
        .content {{ font-size: 14px; line-height: 1.6; color: #94a3b8; }}
        .cred-box {{ margin: 20px 0; background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #6366f1; }}
        .cred-title {{ font-size: 13px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }}
        .cred-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }}
        .cred-label {{ color: #94a3b8; }}
        .cred-value {{ color: #f8fafc; font-family: 'Courier New', monospace; font-weight: 600; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #64748b; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">📐 AI Interior Designer</div>
          <div class="badge">✓ Password Updated</div>
          <div class="title">Password Changed Successfully!</div>
        </div>
        <div class="content">
          <p>Hello <strong style="color: #f1f5f9;">{name_display}</strong>,</p>
          <p>Your password was updated successfully in your account settings. Below are your new credentials:</p>
          
          <div class="cred-box">
            <div class="cred-title">🔑 Your New Password</div>
            <div class="cred-row">
              <span class="cred-label">Account Email:</span>
              <span class="cred-value">{recipient_email}</span>
            </div>
            <div class="cred-row" style="border-bottom: none;">
              <span class="cred-label">Newly Created Password:</span>
              <span class="cred-value" style="color: #a5b4fc;">{new_password}</span>
            </div>
          </div>
          
          <p style="font-size: 12px; color: #64748b;">🔒 If you did not make this change, please reset your password immediately or notify support.</p>
        </div>
        <div class="footer">
          &copy; {datetime.now().year} AI Interior Designer. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
    mail.send(msg)


# ===========================
# 1. Send Verification Code API (Registration)
# ===========================
@auth.route("/send-verification-code", methods=["POST"])
def send_verification_code():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        full_name = data.get("full_name", "").strip()

        if not email:
            return jsonify({
                "success": False,
                "message": "Email address is required."
            }), 400

        # Simple email format check
        email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        if not re.match(email_regex, email):
            return jsonify({
                "success": False,
                "message": "Please provide a valid email address."
            }), 400

        # Check if email is already registered
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                "success": False,
                "message": "This email is already registered. Please sign in instead."
            }), 409

        # Generate 6-digit numeric verification code
        code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Clear previous unverified codes for this email
        try:
            EmailVerification.query.filter_by(email=email, is_verified=False).delete()
            verification = EmailVerification(
                email=email,
                code=code,
                expires_at=expires_at,
                is_verified=False
            )
            db.session.add(verification)
            db.session.commit()
        except Exception as db_err:
            db.session.rollback()
            print("[DB Error saving verification code]:", db_err)

        # Send verification email strictly via SMTP
        try:
            send_verification_email(email, full_name, code)
            print(f"[AUTH] Verification code email sent to {email}")
        except Exception as mail_err:
            print(f"[AUTH Mail Error]: {mail_err}")
            return jsonify({
                "success": False,
                "message": "Failed to send verification code email. Please check that your Gmail SMTP App Password is correctly configured."
            }), 500

        return jsonify({
            "success": True,
            "message": f"A 6-digit verification code has been sent to {email}. Please check your Gmail inbox."
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500


# ===========================
# 2. Verify & Register API (Delivers password to email)
# ===========================
@auth.route("/verify-and-register", methods=["POST"])
@auth.route("/register", methods=["POST"])
def verify_and_register():
    try:
        data = request.get_json() or {}

        full_name = data.get("full_name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        phone = data.get("phone", "").strip()
        verification_code = str(data.get("verification_code", "")).strip()

        if not full_name or not email or not password:
            return jsonify({
                "success": False,
                "message": "Full Name, Email, and Password are required."
            }), 400

        # Check if email is already registered
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({
                "success": False,
                "message": "Email is already registered."
            }), 409

        # If verification code is provided, validate it
        if verification_code:
            verification = EmailVerification.query.filter_by(
                email=email,
                is_verified=False
            ).order_by(EmailVerification.id.desc()).first()

            if not verification or verification.code != verification_code:
                return jsonify({
                    "success": False,
                    "message": "Invalid verification code. Please check and try again."
                }), 400

            if datetime.utcnow() > verification.expires_at:
                return jsonify({
                    "success": False,
                    "message": "Verification code has expired. Please request a new one."
                }), 400

            verification.is_verified = True

        # Hash password
        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        new_user = User(
            full_name=full_name,
            email=email,
            password_hash=hashed_password,
            phone=phone
        )

        db.session.add(new_user)
        db.session.commit()

        # Send "Registration Successful" confirmation email with created password
        try:
            send_welcome_email(email, full_name, password)
            print(f"[AUTH] Welcome email with password sent to {email}")
        except Exception as mail_err:
            print(f"[AUTH Welcome Mail Error]: {mail_err}")

        return jsonify({
            "success": True,
            "message": "Registration Successful! Confirmation and your password have been sent to your email.",
            "user": {
                "user_id": new_user.user_id,
                "full_name": new_user.full_name,
                "email": new_user.email,
                "phone": new_user.phone
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ===========================
# 3. Login API
# ===========================
@auth.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not email or not password:
            return jsonify({
                "success": False,
                "message": "Email and Password are required."
            }), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "success": False,
                "message": "No account found with this email address."
            }), 401

        if bcrypt.checkpw(
            password.encode("utf-8"),
            user.password_hash.encode("utf-8")
        ):
            return jsonify({
                "success": True,
                "message": "Login Successful.",
                "user": {
                    "user_id": user.user_id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone
                }
            }), 200

        return jsonify({
            "success": False,
            "message": "Incorrect Password."
        }), 401

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ===========================
# 4. Forgot Password: Send Verification Code
# ===========================
@auth.route("/forgot-password/send-code", methods=["POST"])
def forgot_password_send_code():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()

        if not email:
            return jsonify({
                "success": False,
                "message": "Please enter your registered email address."
            }), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({
                "success": False,
                "message": "No registered account found with this email address."
            }), 404

        # Generate 6-digit numeric verification code
        code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        try:
            EmailVerification.query.filter_by(email=email, is_verified=False).delete()
            verification = EmailVerification(
                email=email,
                code=code,
                expires_at=expires_at,
                is_verified=False
            )
            db.session.add(verification)
            db.session.commit()
        except Exception as db_err:
            db.session.rollback()
            print("[DB Error saving reset verification code]:", db_err)

        # Send OTP email
        try:
            send_forgot_password_code_email(email, user.full_name, code)
            print(f"[AUTH] Forgot password code sent to {email}")
        except Exception as mail_err:
            print(f"[AUTH Mail Error]: {mail_err}")
            return jsonify({
                "success": False,
                "message": "Failed to send reset code email. Please check your SMTP configuration."
            }), 500

        return jsonify({
            "success": True,
            "message": f"A 6-digit verification code has been sent to {email}. Please check your inbox."
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500


# ===========================
# 5. Forgot Password: Verify Code & Reset Password
# ===========================
@auth.route("/forgot-password/reset", methods=["POST"])
def forgot_password_reset():
    try:
        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        verification_code = str(data.get("verification_code", "")).strip()
        new_password = data.get("new_password", "")

        if not email or not verification_code or not new_password:
            return jsonify({
                "success": False,
                "message": "Email, verification code, and new password are required."
            }), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({
                "success": False,
                "message": "User account not found."
            }), 404

        # Validate verification code
        verification = EmailVerification.query.filter_by(
            email=email,
            is_verified=False
        ).order_by(EmailVerification.id.desc()).first()

        if not verification or verification.code != verification_code:
            return jsonify({
                "success": False,
                "message": "Invalid verification code. Please check and try again."
            }), 400

        if datetime.utcnow() > verification.expires_at:
            return jsonify({
                "success": False,
                "message": "Verification code has expired. Please request a new one."
            }), 400

        # Validate password strength
        password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        if not re.match(password_regex, new_password):
            return jsonify({
                "success": False,
                "message": "Password must be at least 8 characters and contain 1 uppercase, 1 lowercase, 1 digit, and 1 special character (@$!%*?&)."
            }), 400

        # Update password
        hashed_password = bcrypt.hashpw(
            new_password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        user.password_hash = hashed_password
        verification.is_verified = True
        db.session.commit()

        # Send confirmation email containing newly created password
        try:
            send_password_reset_success_email(email, user.full_name, new_password)
            print(f"[AUTH] Password reset success email sent to {email}")
        except Exception as mail_err:
            print(f"[AUTH Reset Mail Error]: {mail_err}")

        return jsonify({
            "success": True,
            "message": "Password reset successful! Your newly created password has been sent to your registered email address."
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# ===========================
# 6. Change Password API (Settings)
# ===========================
@auth.route("/change-password", methods=["POST"])
def change_password():
    try:
        data = request.get_json() or {}

        email = data.get("email", "").strip().lower()
        user_id = data.get("user_id")
        current_password = data.get("current_password", "")
        new_password = data.get("new_password", "")

        if not new_password:
            return jsonify({
                "success": False,
                "message": "New password is required."
            }), 400

        user = None
        if user_id:
            user = User.query.filter_by(user_id=user_id).first()
        if not user and email:
            user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found. Please sign in again."
            }), 404

        # If current password provided, verify it
        if current_password:
            if not bcrypt.checkpw(current_password.encode("utf-8"), user.password_hash.encode("utf-8")):
                return jsonify({
                    "success": False,
                    "message": "Current password is incorrect."
                }), 400

        # Validate password strength
        password_regex = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
        if not re.match(password_regex, new_password):
            return jsonify({
                "success": False,
                "message": "Password must be at least 8 characters and contain 1 uppercase, 1 lowercase, 1 digit, and 1 special character (@$!%*?&)."
            }), 400

        # Update password
        hashed_password = bcrypt.hashpw(
            new_password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        user.password_hash = hashed_password
        db.session.commit()

        # Send confirmation email containing newly created password
        try:
            send_password_changed_email(user.email, user.full_name, new_password)
            print(f"[AUTH] Password changed confirmation email sent to {user.email}")
        except Exception as mail_err:
            print(f"[AUTH Change Mail Error]: {mail_err}")

        return jsonify({
            "success": True,
            "message": "Password changed successfully!"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500