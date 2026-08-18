# CareerLens AI 🚀

[![CI Workflow](https://github.com/aaushx/CareerLens-v1/actions/workflows/ci.yml/badge.svg)](https://github.com/aaushx/CareerLens-v1/actions)
[![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Framework: Flask](https://img.shields.io/badge/Framework-Flask%203.1-black.svg)](https://flask.palletsprojects.com/)

**CareerLens AI** is an AI-powered ATS resume analysis platform that evaluates resumes against job descriptions using NLP, semantic similarity, skill matching, OCR, and actionable optimization insights.

It allows candidates and professionals to see their resume through the eyes of enterprise Applicant Tracking Systems and technical recruiters — providing instant ATS scoring, keyword match density, semantic fit analysis, skill gap identification with interactive roadmaps, and downloadable executive PDF reports.

---

## 🌟 Key Features

1. **AI ATS Scoring Engine** — Simulates how enterprise parsing algorithms score candidate resumes against target job specifications.
2. **Semantic Similarity Analysis** — Uses TF-IDF vectorization with cosine similarity to evaluate semantic context alignment without heavy model memory overhead.
3. **Skill Gap Intelligence** — Cross-references technical terms, tools, frameworks, and programming languages to detect missing qualifications with priority impact metrics.
4. **PDF Link Annotation Extraction** — Inspects embedded clickable hyperlink annotations (e.g. LinkedIn, GitHub, portfolio) to ensure contact profiles are detected even when formatted as anchor text.
5. **Actionable Learning Roadmaps** — Generates step-by-step, phased learning schedules to help candidates bridge identified technical gaps.
6. **Executive PDF Reports** — Generates clean, downloadable PDF summary reports via ReportLab.
7. **OCR Fallback Support** — Uses Tesseract OCR to scan image-only or poorly formatted PDF resumes when standard text layers cannot be read.
8. **Session-Isolated Scan History** — Persistent SQLite database storing scan history securely scoped to each visitor's session.

---

## 🛠 Technology Stack

* **Frontend**: Vanilla HTML5, Vanilla CSS3 (Obsidian Dark & High-Contrast Light Design System), Vanilla JavaScript (Modular ES6), Chart.js (Radar & Component Breakdown charts), Material Symbols, Bootstrap 5 (modal components).
* **Backend**: Python 3.10+, Flask, SQLite (Data persistence), PyMuPDF (PDF text & annotation extraction), PyTesseract (OCR layers), scikit-learn (TF-IDF semantic similarity), ReportLab (PDF reporting).

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/aaushx/CareerLens-v1.git
cd CareerLens-v1
```

### 2. Configure Virtual Environment & Install Dependencies
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Tesseract OCR (Optional for scanned PDFs)
* **Windows**: Download installer from UB-Mannheim and install to `C:\Program Files\Tesseract-OCR\`.
* **macOS**: `brew install tesseract`
* **Linux**: `sudo apt-get install tesseract-ocr`

### 4. Run the Application
```bash
python app.py
```
Access the application at `http://127.0.0.1:5000/`.

---

## 🧪 Running Tests

Run the automated test suite with:
```bash
python tests/test_ocr.py
```

---

## 🐳 Docker Deployment

A production-ready `Dockerfile` and `docker-compose.yml` are included:

```bash
# Build and run with Docker Compose
docker-compose up --build
```
Access the containerized application at `http://localhost:5000`.

---

## ☁️ Cloud Deployment (Render Blueprint)

CareerLens AI includes a `render.yaml` blueprint:
1. Connect this repository to your **Render Dashboard**.
2. Select **Blueprints** and deploy.
3. Render automatically builds the Docker container with Tesseract OCR pre-installed and maps Port 5000.

---

## 📂 Project Structure

```
CareerLens/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions continuous integration workflow
├── static/
│   ├── css/
│   │   └── style.css          # Obsidian Dark & Light design system
│   └── js/
│       └── app.js             # Client-side UI & dashboard rendering logic
├── templates/
│   ├── index.html             # Landing page & upload drawer
│   └── result.html            # Executive analysis dashboard
├── tests/
│   └── test_ocr.py            # Unit tests for OCR and link extraction
├── docs/                      # Architectural and deployment guides
├── app.py                     # Core Flask application and analysis engine
├── database.py                # SQLite database interface
├── Dockerfile                 # Multi-stage container definition
├── docker-compose.yml         # Container orchestration configuration
├── render.yaml                # Render cloud deployment blueprint
├── requirements.txt           # Production dependencies
├── .env.example               # Example environment variables
├── .gitignore                 # Version control exclusions
├── LICENSE                    # MIT License
├── SECURITY.md                # Security policy and vulnerability disclosure
├── CODE_OF_CONDUCT.md         # Community code of conduct
├── CHANGELOG.md               # Version release history
└── README.md                  # Project overview and documentation
```

---

## 🔒 Security

* Secure session data transfer via JSON payload parsing.
* Temporary resume uploads are automatically cleaned up after processing.
* User history is scoped strictly to visitor session UUIDs.
* Input validation on file size (5MB max) and file types (PDF only).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
