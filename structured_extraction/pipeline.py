"""
Pipeline orchestrating LangChain + Kor structured extraction.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from kor.extraction import create_extraction_chain
from langchain_openai import ChatOpenAI

from .config import LLMConfig, resolve_model_config
from .schemas import (
    HospitalExtraction,
    hospital_dataset_schema,
    parse_extraction_payload,
)

@dataclass
class ExtractionResult:
    """Wrapper storing both the parsed models and the original JSON payload."""

    parsed: HospitalExtraction
    raw_payloads: List[dict] = field(default_factory=list)

    def to_json(self, indent: int = 2) -> str:
        """Return the merged and deduplicated result as JSON."""
        return json.dumps(self.parsed.model_dump(), indent=indent, ensure_ascii=False)
    
    def to_raw_json(self, indent: int = 2) -> str:
        """Return the raw payloads (one per chunk) as JSON for debugging."""
        return json.dumps([payload for payload in self.raw_payloads], indent=indent, ensure_ascii=False)


class KorHospitalExtractor:
    """High-level API to run Kor structured extraction on hospital documents."""

    def __init__(
        self,
        llm_config: Optional[LLMConfig] = None,
        model_override: Optional[str] = None,
        temperature_override: Optional[float] = None,
        chunk_size: int = 3500,
        chunk_overlap: int = 200,
    ) -> None:
        self.llm_config = llm_config or resolve_model_config(
            override_model=model_override,
            override_temperature=temperature_override,
        )
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self._chain = self._build_chain()

    def _build_chain(self):
        llm = ChatOpenAI(
            api_key=self.llm_config.api_key,
            model=self.llm_config.model,
            temperature=self.llm_config.temperature,
            max_tokens=self.llm_config.max_tokens,
        )
        return create_extraction_chain(
            llm=llm,
            node=hospital_dataset_schema,
            encoder_or_encoder_class="json",
            input_formatter="triple_quotes",
        )
    
    def extract_from_text(self, text: str, document_name: Optional[str] = None) -> ExtractionResult:
        """
        Extract structured data from text using Kor.
        The text is passed entirely to the LLM (no chunking).
        """
        import logging
        import re
        
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.DEBUG)
        
        logger.info(f"Starting extraction for document: {document_name or 'unknown'}")
        logger.debug(f"Text length: {len(text)} characters")
        
        try:
            raw = self._chain.invoke(text)
            logger.debug(f"Kor chain returned type: {type(raw)}")
            logger.debug(f"Kor chain returned keys: {list(raw.keys()) if isinstance(raw, dict) else 'not a dict'}")
        except Exception as e:
            logger.error(f"Error invoking Kor chain: {e}", exc_info=True)
            # Return empty result on error
            return ExtractionResult(
                parsed=HospitalExtraction(),
                raw_payloads=[{}],
            )

        # Extract payload from Kor output
        # Kor returns {"data": {...}, "raw": "...", "errors": [...]}
        payload = raw.get("data", {}) if isinstance(raw, dict) else {}
        
        logger.debug(f"Initial payload type: {type(payload)}")
        logger.debug(f"Initial payload keys: {list(payload.keys()) if isinstance(payload, dict) else 'not a dict'}")
        
        # Log errors if any
        if raw.get("errors"):
            logger.warning(f"Kor returned errors: {raw.get('errors')}")
        
        # Log raw output for debugging
        if raw.get("raw"):
            raw_output = raw.get("raw", "")
            logger.debug(f"Raw output length: {len(raw_output)} characters")
            logger.debug(f"Raw output preview (first 500 chars): {raw_output[:500]}")
        
        # Check if payload has meaningful data
        has_data = False
        if isinstance(payload, dict):
            # Check if we have the root key or direct keys
            if "jeu_donnees_hospitalier" in payload:
                nested = payload["jeu_donnees_hospitalier"]
                if isinstance(nested, dict) and nested:
                    has_data = True
                    logger.debug("Found data in 'jeu_donnees_hospitalier' key")
            elif any(key in payload for key in ["adresses", "acces_transport", "services", "hopitaux", "donnees_hospitalieres", "documents"]):
                has_data = True
                logger.debug("Found data in direct keys")
        
        # If payload doesn't have meaningful data but we have raw output, try to parse it manually
        if not has_data:
            logger.warning("Payload doesn't have expected structure, attempting to parse raw output")
            raw_text = raw.get("raw", "") if isinstance(raw, dict) else ""
            if raw_text:
                
                # Try to extract JSON from raw text
                json_match = re.search(r'<json>(.*?)</json>', raw_text, re.DOTALL)
                if json_match:
                    raw_text = json_match.group(1)
                    logger.debug("Found JSON in <json> tags")
                else:
                    # Try to find JSON object in the text
                    start_idx = raw_text.find('{')
                    if start_idx != -1:
                        brace_count = 0
                        end_idx = start_idx
                        for i in range(start_idx, len(raw_text)):
                            if raw_text[i] == '{':
                                brace_count += 1
                            elif raw_text[i] == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    end_idx = i + 1
                                    break
                        if end_idx > start_idx:
                            raw_text = raw_text[start_idx:end_idx]
                            logger.debug("Extracted JSON from raw text")
                
                try:
                    parsed_json = json.loads(raw_text.strip())
                    if isinstance(parsed_json, dict):
                        # Check if it's wrapped in jeu_donnees_hospitalier
                        if "jeu_donnees_hospitalier" in parsed_json:
                            payload = parsed_json["jeu_donnees_hospitalier"]
                            logger.debug("Parsed JSON and found 'jeu_donnees_hospitalier' key")
                        elif any(key in parsed_json for key in ["adresses", "acces_transport", "services", "hopitaux", "donnees_hospitalieres", "documents"]):
                            payload = parsed_json
                            logger.debug("Parsed JSON and found direct keys")
                        else:
                            payload = parsed_json
                            logger.debug("Parsed JSON but structure unclear")
                except (json.JSONDecodeError, AttributeError) as e:
                    logger.warning(f"Failed to parse JSON from raw text: {e}")
                    logger.debug(f"Raw text that failed to parse: {raw_text[:500]}")
        
        logger.debug(f"Final payload before parsing: {json.dumps(payload, indent=2, ensure_ascii=False)[:1000]}")
        
        # Parse the payload into structured models
        try:
            parsed = parse_extraction_payload(payload)
            logger.info(f"Extraction completed: {len(parsed.hopitaux)} hopitaux, {len(parsed.services)} services, {len(parsed.adresses)} adresses")
        except Exception as e:
            logger.error(f"Error parsing extraction payload: {e}", exc_info=True)
            parsed = HospitalExtraction()

        return ExtractionResult(
            parsed=parsed,
            raw_payloads=[payload],
        )

    def extract_from_file(self, file_path: Path) -> ExtractionResult:
        """
        Load a UTF-8 text file and run the extraction.
        """

        text = Path(file_path).read_text(encoding="utf-8")
        return self.extract_from_text(text=text, document_name=file_path.name)

    def extract_directory(self, input_dir: Path) -> List[ExtractionResult]:
        """
        Iterate over all .txt files in a directory.
        """

        input_dir = Path(input_dir)
        results = []
        for txt_file in sorted(input_dir.glob("*.txt")):
            results.append(self.extract_from_file(txt_file))
        return results



