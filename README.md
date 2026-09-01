# RenderAI - AI Interior Designer 🛋️✨

RenderAI is an intelligent AI-powered interior design and room styling platform that analyzes interior and bedroom spaces using computer vision (YOLOv8) and generates tailored furniture recommendations, realistic step-by-step room layout placements, and real Amazon India product suggestions with direct purchase links.

---

## 🚀 Key Features

- **Object & Furniture Detection**: Identifies furniture items in uploaded room images using YOLOv8 models.
- **Empty vs. Furnished Room Intelligence**: Automatically detects whether a room is empty or furnished, adapting the AI recommendation workflow accordingly.
- **Step-by-Step Interactive Room Styling**:
  - Ask *"What would you like to add first?"* based on the chosen room type (Master Bedroom, Kids Room, Living Room, etc.).
  - Select categories (Bed, Wardrobe, Bedside Tables, Study Desk, Lamps, Sofa, TV Unit, Curtains).
  - Add furniture items one-by-one with realistic placement, perspective, and scale in the room canvas.
- **Real Amazon India Integration**:
  - Real Amazon products with verified ASINs, direct purchase links (`https://www.amazon.in/dp/{ASIN}`), pricing in INR, dimensions, and ratings.
  - Dedicated interactive product tray below the room canvas.
- **Drag-and-Drop & Custom Positioning**: Drag Amazon products directly into the room canvas to place them exactly where you want.
- **Curated Themes**: Modern Minimalist, Parisian Chic, Luxury Royale, Gaming Battlestation, Bohemian, Scandinavian, and Kids Playful themes.
- **Authentication & User Profiles**: Secure user registration, email verification (OTP), password reset, and saved user designs.
- **Modern Full-Stack Architecture**:
  - **Frontend**: Next.js 16 (Turbopack, App Router), React 19, TailwindCSS, Lucide React icons.
  - **Backend**: Flask REST API, SQLAlchemy, PyMySQL, Flask-Mail, PyJWT, bcrypt.
  - **AI / Computer Vision**: Ultralytics YOLOv8, PyTorch, Pillow, OpenCV.

---

## 🛠️ Project Structure

```text
RenderAI/
├── backend/
│   ├── ai_modules/         # AI models & inference pipelines
│   ├── assets/             # Theme room assets & reference images
│   ├── routes/             # API route blueprints (auth, upload, chat, designs, etc.)
│   ├── services/           # Chat AI, Amazon catalog, Image generation
│   ├── tests/              # Automated test suites
│   ├── app.py              # Flask application entrypoint
│   ├── config.py           # Application configurations
│   ├── extensions.py       # SQLAlchemy & Mail extensions
│   ├── migrate.py          # Database migration scripts
│   ├── models.py           # Database models (User, RoomUpload, EmailVerification)
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variable template
├── frontend/
│   ├── app/                # Next.js App Router (chat, upload, dashboard, auth, designs, etc.)
│   ├── public/             # Static images, avatars, icons
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── uploads/                # Local runtime upload directories (.gitkeep)
├── datatable.sql           # Database schema definition
├── yolov8n.pt              # Pretrained YOLOv8 weights
├── requirements.txt        # Root Python requirements
└── README.md
```

---

## 📦 Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm
- **MySQL Database Server**

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your MySQL credentials and mail settings

# Initialize / migrate database
python migrate.py

# Start Flask backend server
python app.py
```
Backend runs on `http://localhost:5000`.

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Frontend runs on `http://localhost:3000`.

---

## 📄 License
This project is licensed under the MIT License.
