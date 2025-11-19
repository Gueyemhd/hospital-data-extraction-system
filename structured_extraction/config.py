"""
Configuration helpers for the Kor + LangChain extraction pipeline.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

DEFAULT_MODEL_NAME = "gpt-4o-mini"



@dataclass
class LLMConfig:
    """Runtime configuration for the language model."""

    api_key: str
    model: str = DEFAULT_MODEL_NAME
    temperature: float = 0.0
    max_tokens: int = 3200

    @classmethod
    def from_env(cls) -> "LLMConfig":
        """Load configuration from environment variables."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is missing. Define it in your environment to run the extractor."
            )
        model = os.getenv("OPENAI_MODEL", DEFAULT_MODEL_NAME)
        temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.0"))
        max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "3200"))
        return cls(
            api_key=api_key,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )


def resolve_model_config(
    override_model: Optional[str] = None,
    override_temperature: Optional[float] = None,
) -> LLMConfig:
    """Return an `LLMConfig`, preferring CLI overrides when provided."""

    config = LLMConfig.from_env()
    if override_model:
        config.model = override_model
    if override_temperature is not None:
        config.temperature = override_temperature
    return config

