"""
Command line interface to launch the Kor/LangChain extraction pipeline.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

import typer

from .pipeline import KorHospitalExtractor

app = typer.Typer(help="Extraction structurée des données hospitalières avec Kor + LangChain")


def _dump_result(result, output_path: Optional[Path]):
    if not output_path:
        return
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(result.to_json(), encoding="utf-8")


def _default_output_path(input_path: Path) -> Path:
    return Path('data/structured_extraction/') / input_path.with_suffix(".kor.json")


@app.command()
def fichier(
    input_path: Path = typer.Argument(..., exists=True, dir_okay=False, readable=True),
    output: Optional[Path] = typer.Option(
        None,
        "--output",
        "-o",
        help=(
            "Chemin du fichier JSON pour sauvegarder le résultat brut de Kor. "
        ),
    ),
    model: Optional[str] = typer.Option(None, "--model", help="Nom du modèle OpenAI."),
    temperature: Optional[float] = typer.Option(
        None,
        "--temperature",
        min=0.0,
        max=1.0,
        help="Température du LLM.",
    ),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Activer les logs détaillés."),
) -> None:
    """
    Extrait les informations structurées d'un fichier texte.
    """
    # Configure logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    extractor = KorHospitalExtractor(model_override=model, temperature_override=temperature)
    result = extractor.extract_from_file(input_path)

    typer.echo("Extraction terminée ✅")
    typer.echo(f"Résultats: {len(result.parsed.hopitaux)} hôpitaux, {len(result.parsed.services)} services, {len(result.parsed.adresses)} adresses")
    typer.echo(json.dumps(result.parsed.model_dump(), indent=2, ensure_ascii=False))

    _dump_result(result, output or _default_output_path(input_path))
    
    # Also save raw output for debugging
    if verbose:
        raw_output_path = (output or _default_output_path(input_path)).with_suffix(".raw.json")
        raw_output_path.parent.mkdir(parents=True, exist_ok=True)
        raw_output_path.write_text(result.to_raw_json(), encoding="utf-8")
        typer.echo(f"Sortie brute sauvegardée dans: {raw_output_path}")



@app.command()
def dossier(
    input_dir: Path = typer.Argument(..., exists=True, file_okay=False, readable=True),
    output_dir: Optional[Path] = typer.Option(
        None,
        "--output-dir",
        "-o",
        help="Répertoire où sauvegarder chaque JSON de sortie.",
    ),
    model: Optional[str] = typer.Option(None, "--model", help="Nom du modèle OpenAI."),
    temperature: Optional[float] = typer.Option(
        None,
        "--temperature",
        min=0.0,
        max=1.0,
        help="Température du LLM.",
    ),
) -> None:
    """
    Traite l'ensemble des fichiers .txt d'un dossier.
    """

    extractor = KorHospitalExtractor(model_override=model, temperature_override=temperature)
    results = extractor.extract_directory(input_dir)

    typer.echo(f"{len(results)} fichier(s) traités ✅")

    for source_file, result in zip(sorted(input_dir.glob("*.txt")), results, strict=False):
        typer.echo(f"- {source_file.name}: {len(result.parsed.hopitaux)} hôpitaux détectés")
        if output_dir:
            target = Path(output_dir) / (source_file.stem + ".kor.json")
        else:
            target = _default_output_path(source_file)
        _dump_result(result, target)


def run():
    """Entry-point compatible avec `python -m structured_extraction.cli`."""

    app()


if __name__ == "__main__":
    run()

