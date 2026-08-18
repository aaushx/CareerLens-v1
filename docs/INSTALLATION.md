# CareerLens AI — Installation Guide

## System Requirements

- **Python**: 3.10, 3.11, 3.12, 3.13, or 3.14
- **Operating System**: Windows, macOS, or Linux
- **Tesseract OCR** (Optional, recommended for scanned resumes)

---

## Step-by-Step Installation

### 1. Clone the Repository
```bash
git clone https://github.com/aaushx/CareerLens-v1.git
cd CareerLens-v1
```

### 2. Set Up a Virtual Environment
```bash
# Create the virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows (PowerShell):
.venv\Scripts\activate

# macOS / Linux:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Install Tesseract OCR (Optional)
- **Windows**: [UB-Mannheim Installer](https://github.com/UB-Mannheim/tesseract/wiki)
- **macOS**: `brew install tesseract`
- **Ubuntu/Debian**: `sudo apt-get install tesseract-ocr`

### 5. Launch the Server
```bash
python app.py
```
Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.
