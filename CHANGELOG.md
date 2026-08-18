# Changelog

All notable changes to **CareerLens AI** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [5.0.0] - 2026-08-18

### Added
- **Official Branding**: Rebranded publicly as **CareerLens AI** with updated landing page, header, and dashboard themes.
- **PDF Hyperlink Annotation Extraction**: Automatic extraction of embedded PDF links and annotations for accurate detection of LinkedIn, GitHub, and portfolio URLs.
- **Interactive Dashboard Data Binding**: Complete bidirectional rendering for Overview, Analysis, Skills, and Deep Analytics tabs with responsive Chart.js visual models.
- **Continuous Integration**: GitHub Actions CI workflow for test validation and quality checks.

### Changed
- **Stitch Obsidian Design**: Elevated design system with Obsidian Dark and High-Contrast Light mode, floating pill navigation, and refined micro-interactions.
- **Security Hardening**: Secure JSON script payload data transmission mechanism to prevent XSS.

### Fixed
- Fixed LinkedIn profile detection when URLs are formatted as anchor link annotations in PDFs.
- Fixed scroll reveal opacity thresholds for above-the-fold landing page rendering.
- Fixed historical scan log reload synchronization across all dashboard tabs.
