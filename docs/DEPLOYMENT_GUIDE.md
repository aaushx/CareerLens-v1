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

---

## Production Monitoring & Health Checks

CareerLens AI exposes a lightweight health-check endpoint for deployment monitoring.

### Health Check URL
`GET /health`

### Purpose
Lightweight application liveness endpoint for deployment monitoring (e.g., UptimeRobot or Render's built-in checks).

### Example Response
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "status": "ok"
}
```

> [!IMPORTANT]
> The `/health` endpoint is strictly an indicator that the Flask application process is alive and responsive. It executes very quickly and does not run expensive operations (no OCR, no NLP, no database calls, no session checks, and no PDF generation).
> 
> Periodic health pings from an external service can help detect process crashes. However, it does not guarantee that the Render Free tier instance will never sleep. Do not add background ping threads or artificial loops inside the Flask application to generate fake traffic.

