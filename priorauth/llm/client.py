from anthropic import Anthropic


def get_client() -> Anthropic:
    return Anthropic()


def parse_json_response(raw_text: str) -> str:
    """Strip optional markdown fences from an LLM JSON response."""
    text = raw_text.strip()
    if not text.startswith("```"):
        return text

    text = text.split("```", 2)[1]
    if text.startswith("json"):
        text = text[4:]
    return text.strip()
