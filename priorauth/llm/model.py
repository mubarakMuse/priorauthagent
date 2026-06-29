from functools import lru_cache

from langchain_anthropic import ChatAnthropic

from priorauth.config import get_settings


@lru_cache
def get_chat_model(*, temperature: float = 0) -> ChatAnthropic:
    settings = get_settings()
    return ChatAnthropic(
        model=settings.anthropic_model,
        temperature=temperature,
    )
