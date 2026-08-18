import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import fitz

try:
    from app.services.analysis import perform_analysis
    from app.services.ocr import (
        extract_pdf_links,
        extract_text_and_links_from_pdf,
        normalize_linkedin_url,
    )
    from app.services.scoring import calculate_resume_strength
except ImportError:
    from app import (
        calculate_resume_strength,
        extract_pdf_links,
        extract_text_and_links_from_pdf,
        normalize_linkedin_url,
        perform_analysis,
    )


class TestPDFLinkExtraction(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.temp_dir.cleanup()

    def create_pdf(self, visible_text, link_annotations=None):
        pdf_path = os.path.join(self.temp_dir.name, "test_resume.pdf")
        doc = fitz.open()
        page = doc.new_page()
        page.insert_textbox(fitz.Rect(50, 50, 500, 300), visible_text)

        if link_annotations:
            for rect, uri in link_annotations:
                page.insert_link({"kind": fitz.LINK_URI, "from": rect, "uri": uri})

        doc.save(pdf_path)
        doc.close()
        return pdf_path

    # ---------------------------------------------------------
    # 1. LinkedIn URL Normalization Tests
    # ---------------------------------------------------------
    def test_normalize_linkedin_standard(self):
        self.assertEqual(
            normalize_linkedin_url("https://www.linkedin.com/in/johndoe"),
            "https://www.linkedin.com/in/johndoe",
        )
        self.assertEqual(
            normalize_linkedin_url("http://linkedin.com/in/johndoe/"),
            "https://www.linkedin.com/in/johndoe",
        )
        self.assertEqual(
            normalize_linkedin_url("linkedin.com/in/john-doe-123"),
            "https://www.linkedin.com/in/john-doe-123",
        )

    def test_normalize_linkedin_non_profiles(self):
        self.assertIsNone(normalize_linkedin_url("https://github.com/johndoe"))
        self.assertIsNone(normalize_linkedin_url("https://www.linkedin.com/company/google"))
        self.assertIsNone(normalize_linkedin_url("https://www.linkedin.com/jobs/view/12345"))
        self.assertIsNone(normalize_linkedin_url("mailto:john@example.com"))
        self.assertIsNone(normalize_linkedin_url(""))
        self.assertIsNone(normalize_linkedin_url(None))

    # ---------------------------------------------------------
    # 2. PyMuPDF Link Extraction Tests
    # ---------------------------------------------------------
    def test_extract_pdf_links(self):
        doc = fitz.open()
        page = doc.new_page()
        rect1 = fitz.Rect(50, 50, 150, 70)
        page.insert_textbox(rect1, "LinkedIn Profile")
        page.insert_link(
            {
                "kind": fitz.LINK_URI,
                "from": rect1,
                "uri": "https://www.linkedin.com/in/alexander-davis/",
            }
        )
        pdf_bytes = doc.tobytes()
        doc.close()

        doc_reloaded = fitz.open(stream=pdf_bytes, filetype="pdf")
        links = extract_pdf_links(doc_reloaded)
        self.assertIn("https://www.linkedin.com/in/alexander-davis/", links)
        doc_reloaded.close()

    def test_extract_pdf_links_empty(self):
        doc = fitz.open()
        page = doc.new_page()
        page.insert_textbox(fitz.Rect(50, 50, 200, 100), "Plain resume")
        links = extract_pdf_links(doc)
        self.assertEqual(links, [])
        doc.close()

    # ---------------------------------------------------------
    # 3. Case A — Visible URL
    # ---------------------------------------------------------
    def test_case_a_visible_linkedin_url(self):
        resume_text = (
            "John Doe\njohn@example.com | 555-123-4567 | https://www.linkedin.com/in/john-doe\n"
            "Experience: 5 years engineer\nProjects: Built APIs\nSkills: Python, Django\nEducation: BS CS\n"
        )
        pdf_path = self.create_pdf(resume_text)
        text, method = extract_text_and_links_from_pdf(pdf_path)
        score, breakdown = calculate_resume_strength(text.lower(), text)
        self.assertTrue(breakdown["contact_info"]["linkedin"])
        self.assertTrue(breakdown["contact_info"]["email"])

    # ---------------------------------------------------------
    # 4. Case B — Hyperlink Annotation (Visible text is just 'LinkedIn')
    # ---------------------------------------------------------
    def test_case_b_hyperlink_annotation_linkedin(self):
        resume_text = (
            "Jane Doe - Lead Engineer\njane@example.com | (555) 987-6543 | LinkedIn | GitHub\n"
            "Experience: 6 years web platforms\nProjects: Distributed backend\nSkills: Python, React\nEducation: MS CS\n"
        )
        annotations = [
            (fitz.Rect(200, 60, 260, 75), "https://www.linkedin.com/in/jane-doe-developer/"),
            (fitz.Rect(270, 60, 320, 75), "https://github.com/janedoe"),
        ]
        pdf_path = self.create_pdf(resume_text, annotations)
        text, method = extract_text_and_links_from_pdf(pdf_path)

        self.assertIn("https://www.linkedin.com/in/jane-doe-developer/", text)
        self.assertIn("https://github.com/janedoe", text)

        score, breakdown = calculate_resume_strength(text.lower(), text)
        self.assertTrue(breakdown["contact_info"]["linkedin"])
        self.assertTrue(breakdown["contact_info"]["github"])

        # Downstream analysis test
        jd = "Requirements: Python, React, Distributed systems."
        results = perform_analysis(text, jd, "Jane_Doe.pdf", method)
        self.assertTrue(results["checklist"]["linkedin"])
        self.assertTrue(results["checklist"]["github"])

    # ---------------------------------------------------------
    # 5. Case C — No LinkedIn
    # ---------------------------------------------------------
    def test_case_c_no_linkedin(self):
        resume_text = (
            "Alice Smith\nalice@example.com | 555-456-7890\n"
            "Experience: 3 years developer\nProjects: Task app\nSkills: Python, SQL\nEducation: BS IT\n"
        )
        pdf_path = self.create_pdf(resume_text)
        text, method = extract_text_and_links_from_pdf(pdf_path)
        score, breakdown = calculate_resume_strength(text.lower(), text)
        self.assertFalse(breakdown["contact_info"]["linkedin"])

        jd = "Requirements: Python, SQL."
        results = perform_analysis(text, jd, "Alice.pdf", method)
        self.assertFalse(results["checklist"]["linkedin"])

    # ---------------------------------------------------------
    # 6. Case D — Other Social Links Not Misclassified
    # ---------------------------------------------------------
    def test_case_d_other_social_links(self):
        resume_text = (
            "Bob Taylor\nbob@example.com | Portfolio | GitHub\n"
            "Experience: 4 years frontend\nProjects: Design kit\nSkills: React, CSS\nEducation: BS SE\n"
        )
        annotations = [
            (fitz.Rect(100, 60, 160, 75), "https://bobtaylor.dev"),
            (fitz.Rect(170, 60, 220, 75), "https://github.com/bobtaylor"),
        ]
        pdf_path = self.create_pdf(resume_text, annotations)
        text, method = extract_text_and_links_from_pdf(pdf_path)
        score, breakdown = calculate_resume_strength(text.lower(), text)
        self.assertFalse(breakdown["contact_info"]["linkedin"])
        self.assertTrue(breakdown["contact_info"]["github"])

    # ---------------------------------------------------------
    # 7. Case E — Duplicate Prevention
    # ---------------------------------------------------------
    def test_case_e_duplicate_prevention(self):
        full_url = "https://www.linkedin.com/in/charlie-brown"
        resume_text = f"Charlie Brown\n{full_url}\nExperience: Engineer\nProjects: CI/CD\nSkills: AWS\nEducation: BS\n"
        annotations = [(fitz.Rect(50, 60, 300, 75), full_url)]
        pdf_path = self.create_pdf(resume_text, annotations)
        text, method = extract_text_and_links_from_pdf(pdf_path)
        self.assertEqual(text.count(full_url), 1)


if __name__ == "__main__":
    unittest.main()
