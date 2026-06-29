from langchain_core.prompts import ChatPromptTemplate

from priorauth.llm.model import get_chat_model
from priorauth.llm.prompts import EXTRACTION_SYSTEM_PROMPT
from priorauth.models.clinical import ClinicalExtraction

_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages(
    [
        ("system", "{system_prompt}"),
        ("human", "Extract structured clinical data from this note:\n\n{note}"),
    ]
)


def run_extraction_chain(note: str) -> ClinicalExtraction:
    llm = get_chat_model().with_structured_output(ClinicalExtraction)
    chain = _EXTRACTION_PROMPT | llm
    return chain.invoke({"system_prompt": EXTRACTION_SYSTEM_PROMPT, "note": note})
