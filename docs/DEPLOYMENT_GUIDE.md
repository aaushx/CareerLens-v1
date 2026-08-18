# CareerLens AI — Deployment Guide

## Render Deployment (Recommended)

CareerLens AI is optimized for fast cold-starts and low memory footprint (~50MB RAM).

### Deployment using `render.yaml` Blueprint

1. Fork or push your code to GitHub.
2. Log in to [Render](https://render.com).
3. Click **New +** → **Blueprint**.
4. Connect your `CareerLens-v1` repository.
5. Render will automatically configure the Web Service with Docker and Tesseract OCR.

---

## Docker Deployment

### Using Docker Compose
```bash
docker-compose up --build -d
```
The application will run on port `5000`.

### Manual Docker Build
```bash
docker build -t careerlens-ai .
docker run -p 5000:5000 careerlens-ai
```
