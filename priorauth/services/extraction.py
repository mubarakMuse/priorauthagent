from priorauth.config import get_settings
from priorauth.llm.client import get_client, parse_json_response
from priorauth.llm.prompts import EXTRACTION_SYSTEM_PROMPT
from priorauth.models.clinical import ClinicalExtraction


def extract_clinical_data(note: str) -> ClinicalExtraction:
    """Call Claude and return structured clinical data parsed from the note."""
    settings = get_settings()
    client = get_client()

    response = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1024,
        temperature=0,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": f"Extract structured clinical data from this note:\n\n{note}",
            }
        ],
    )

    raw_text = parse_json_response(response.content[0].text)
    return ClinicalExtraction.model_validate_json(raw_text)
