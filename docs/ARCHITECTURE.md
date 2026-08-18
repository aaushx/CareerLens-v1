# CareerLens AI — Architecture Overview

## High-Level Architecture

CareerLens AI is built as an asynchronous-ready Flask web application combining OCR extraction, NLP semantic matching, skill ontology gap detection, and dynamic reporting.

```
+-------------------------------------------------------------------+
|                        Client Frontend                            |
|  - Obsidian Dark & Light Design System (Vanilla CSS3)             |
|  - Micro-interactions & Gauge Animations (Vanilla JS)             |
|  - Radar & Breakdown Visualizations (Chart.js)                    |
+---------------------------------+---------------------------------+
                                  | HTTP / JSON
                                  v
+-------------------------------------------------------------------+
|                        Flask Application                          |
|  - Route Handlers (/demo, /upload, /api/history, /download_pdf)   |
|  - Session Isolation (UUID Scoped)                                |
+---------------------------------+---------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  Text & Link Pipeline |                   |  Scoring & NLP Engine |
|  - PyMuPDF Extraction |                   |  - TF-IDF Vectorizer  |
|  - Annotation Parsing |                   |  - Cosine Similarity  |
|  - Tesseract OCR Layer|                   |  - Skill Gap Matching |
+-----------------------+                   +-----------------------+
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                        Storage & Export                           |
|  - SQLite (careerlens.db / scans table)                           |
|  - ReportLab PDF Generation Engine                                |
+-------------------------------------------------------------------+
```

## Core Modules

1. **Extraction Pipeline (`extract_text_and_links_from_pdf`)**:
   - Single-pass PDF traversal using PyMuPDF.
   - Extracts page text and inspects hyperlink annotations (e.g. LinkedIn, GitHub).
   - Falls back to Tesseract OCR for scanned/image-only PDFs (< 100 characters).

2. **NLP & Scoring Engine (`perform_analysis`)**:
   - Computes Skill Match % against target job requirements.
   - Computes Semantic Fit % via scikit-learn TF-IDF and Cosine Similarity.
   - Computes Resume Structural Strength % across critical sections and contact info.
   - Generates weighted ATS Score and category coverage breakdown.

3. **Reporting & Roadmaps**:
   - Dynamic learning schedule generation for top missing technical skills.
   - ReportLab PDF generation for downloadable audit reports.
