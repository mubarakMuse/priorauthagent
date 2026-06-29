from priorauth.llm.chains.extraction import run_extraction_chain
from priorauth.models.clinical import ClinicalExtraction


def extract_clinical_data(note: str) -> ClinicalExtraction:
    """Extract structured clinical data from a note via LangChain."""
    return run_extraction_chain(note)
