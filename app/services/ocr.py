import logging
import re

import fitz
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


def normalize_linkedin_url(url: str) -> str | None:
    """Normalizes a LinkedIn profile URL to a consistent format or returns None if not a valid profile."""
    if not url or not isinstance(url, str):
        return None
    url = url.strip()
    match = re.search(
        r"(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9_-]+)/?", url, re.IGNORECASE
    )
    if match:
        profile_slug = match.group(1).rstrip("/")
        return f"https://www.linkedin.com/in/{profile_slug}"
    return None


def extract_pdf_links(doc: fitz.Document) -> list[str]:
    """Extracts all hyperlink annotations (URIs) from a PyMuPDF document."""
    extracted_urls = []
    seen = set()
    for page in doc:
        try:
            links = page.get_links()
            for link in links:
                uri = link.get("uri")
                if uri and isinstance(uri, str):
                    clean_uri = uri.strip()
                    if clean_uri and clean_uri not in seen:
                        seen.add(clean_uri)
                        extracted_urls.append(clean_uri)
        except Exception as e:
            logger.error(f"Error extracting links from page: {e}", exc_info=True)
    return extracted_urls


def extract_text_with_ocr(filepath: str) -> str:
    """Extracts text from a PDF file page-by-page rendering pixmaps and calling pytesseract OCR."""
    extracted_text = ""
    try:
        with fitz.open(filepath) as doc:
            for page in doc:
                try:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
                    text = pytesseract.image_to_string(img)
                    extracted_text += text + "\n"
                except Exception as e:
                    logger.error(f"OCR failed for a page in {filepath}: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"Failed to open PDF document {filepath} for OCR: {e}", exc_info=True)

    return extracted_text


def extract_text_and_links_from_pdf(filepath: str) -> tuple[str, str]:
    """Extracts both visible text and hyperlink annotations from a PDF file with OCR fallback."""
    extracted_text = ""
    extracted_links = []
    extraction_method = "PDF Text Extraction"

    try:
        with fitz.open(filepath) as doc:
            extracted_links = extract_pdf_links(doc)
            for page in doc:
                text = page.get_text()
                if text:
                    extracted_text += text + "\n"

        if len(extracted_text.strip()) < 100:
            logger.info("PDF text extraction weak. Switching to OCR...")
            extracted_text = extract_text_with_ocr(filepath)
            extraction_method = "OCR Extraction"

        if extracted_links:
            links_to_append = []
            for link_url in extracted_links:
                if link_url.lower() not in extracted_text.lower():
                    links_to_append.append(link_url)
            if links_to_append:
                extracted_text += "\n\n" + "\n".join(links_to_append)

    except Exception as e:
        logger.error(f"Error during PDF extraction for {filepath}: {e}", exc_info=True)
        raise

    return extracted_text, extraction_method
