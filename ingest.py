from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF file."""
    reader = PdfReader(BytesIO(file_bytes))

    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())

    if not pages:
        raise ValueError("Could not extract text from PDF — file may be scanned/image-only")

    return "\n\n".join(pages)