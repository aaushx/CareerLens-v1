# Security Policy — CareerLens AI

## Supported Versions

The following versions of CareerLens AI are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 5.x.x   | :white_check_mark: |
| < 5.0   | :x:                |

## Reporting a Vulnerability

We take the security of CareerLens AI seriously. If you believe you have found a security vulnerability, please follow these steps:

1. **Do not create a public GitHub issue.**
2. Send an email with vulnerability details, reproduction steps, and potential impact to `security@careerlens.ai` (or via private GitHub repository advisory).
3. We will acknowledge receipt of your vulnerability report within 48 hours and provide an estimated timeline for a fix.

## Security Practices in CareerLens AI

- **Session Isolation**: User scan data and history logs are strictly isolated to temporary session UUIDs.
- **XSS & Injection Protection**: Data payloads in templates are transferred via strict JSON element parsing rather than inline JavaScript code execution.
- **Temporary File Lifecycle**: Uploaded PDF files are deleted immediately after parsing or stored temporarily with randomized UUID prefixes before automated cleanup.
- **Safe Parsing**: External URLs and PDF link annotations are treated as untrusted text and validated before downstream processing.
