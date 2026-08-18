# CareerLens AI — API Documentation

## Endpoints

### 1. `GET /`
- **Description**: Renders the landing page and upload portal.
- **Response**: HTML

---

### 2. `POST /demo`
- **Description**: Runs a real end-to-end NLP analysis using sample developer data.
- **Response**: HTML (`result.html`) with embedded JSON payload (`#cl-initial-data`).

---

### 3. `POST /upload_temp_resume`
- **Description**: Asynchronously uploads and validates a temporary resume PDF.
- **Payload**: `multipart/form-data` with `resume` file field.
- **Response**:
  ```json
  {
    "success": true,
    "filename": "uuid_Resume.pdf",
    "original_filename": "Resume.pdf"
  }
  ```

---

### 4. `POST /upload`
- **Description**: Analyzes the uploaded resume against a job description.
- **Payload**: `multipart/form-data` with `temp_filename` and `job_description`.
- **Response**: HTML (`result.html`) with embedded analysis results.

---

### 5. `GET /api/history`
- **Description**: Returns all historical scan summaries for the current session.
- **Response**:
  ```json
  [
    {
      "id": 1,
      "filename": "Alexander_Davis.pdf",
      "timestamp": "2026-08-18T10:00:00",
      "final_score": 87.3,
      "skill_match": 90.0,
      "semantic_match": 33.0,
      "extraction_method": "PDF Text Extraction"
    }
  ]
  ```

---

### 6. `GET /api/history/<id>`
- **Description**: Retrieves full historical analysis payload for a specific scan.
- **Response**:
  ```json
  {
    "success": true,
    "results": { ... }
  }
  ```

---

### 7. `POST /api/history/clear`
- **Description**: Permanently clears scan history for the current visitor session.
- **Response**:
  ```json
  {
    "success": true
  }
  ```

---

### 8. `GET /download_pdf`
- **Description**: Generates and downloads a formatted ReportLab PDF report for the active scan.
- **Response**: Binary PDF file (`application/pdf`).
