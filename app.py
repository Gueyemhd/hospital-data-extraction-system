from __future__ import annotations

import json
import logging
import os
from pathlib import Path

from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.utils import secure_filename

from structured_extraction.pipeline import KorHospitalExtractor
from structured_extraction.db import (
    DatabaseConfigurationError,
    persist_extraction,
)
from structured_extraction.schemas import HospitalExtraction

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "data" / "uploads"
ALLOWED_EXTENSIONS = {".txt"}


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")
    app.config["UPLOAD_FOLDER"] = str(UPLOAD_DIR)
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB
    app.config["JSON_AS_ASCII"] = False

    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    extractor: KorHospitalExtractor | None = None
    extractor_error: Exception | None = None

    try:
        extractor = KorHospitalExtractor()
    except Exception as exc:  # noqa: BLE001
        extractor_error = exc
        app.logger.exception("Impossible d'initialiser l'extracteur : %s", exc)

    def _allowed_file(filename: str) -> bool:
        return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

    def _build_summary(data: dict) -> dict:
        return {
            "hopitaux": len(data.get("hopitaux", [])),
            "services": len(data.get("services", [])),
            "adresses": len(data.get("adresses", [])),
            "documents": len(data.get("documents", [])),
            "donnees_hospitalieres": len(data.get("donnees_hospitalieres", [])),
        }

    @app.route("/", methods=["GET", "POST"])
    def index():
        result_dict = None
        result_json = None
        summary = None
        pending_validation = False

        stored_result = session.get("last_result")
        if stored_result:
            result_dict = stored_result.get("data")
            pending_validation = True

        if request.method == "POST":
            action = request.form.get("action", "upload")

            if extractor is None:
                flash(
                    "L'API OpenAI n'est pas configurée. "
                    "Définissez OPENAI_API_KEY avant de relancer le serveur.",
                    "error",
                )
                return redirect(url_for("index"))

            if action == "confirm":
                if not stored_result:
                    flash("Aucune extraction en attente de validation.", "error")
                    return redirect(url_for("index"))
                try:
                    extraction_model = HospitalExtraction(**stored_result["data"])
                    extraction_db_id = persist_extraction(
                        extraction_model, stored_result.get("filename")
                    )
                    flash(
                        f"Données insérées dans MySQL (extraction #{extraction_db_id}).",
                        "success",
                    )
                    pending_validation = False
                    session.pop("last_result", None)
                    result_dict = stored_result["data"]
                except DatabaseConfigurationError as exc:
                    flash(str(exc), "error")
                except Exception as exc:  # noqa: BLE001
                    logging.exception("Erreur lors de l'insertion en base : %s", exc)
                    flash(
                        f"Impossible d'insérer les données dans MySQL : {exc}",
                        "error",
                    )
                finally:
                    stored_result = session.get("last_result")
                # fall through to rendering result_json
            elif action == "reject":
                if stored_result:
                    session.pop("last_result", None)
                    flash("Extraction annulée. Vous pouvez relancer un upload.", "info")
                else:
                    flash("Aucune extraction en attente à annuler.", "error")
                return redirect(url_for("index"))
            else:
                uploaded_file = request.files.get("document")

                if not uploaded_file or uploaded_file.filename == "":
                    flash("Veuillez sélectionner un fichier .txt à analyser.", "error")
                    return redirect(url_for("index"))

                if not _allowed_file(uploaded_file.filename):
                    flash(
                        "Format non supporté. Merci d'uploader un fichier texte (.txt).",
                        "error",
                    )
                    return redirect(url_for("index"))

                filename = secure_filename(uploaded_file.filename)
                temp_path = UPLOAD_DIR / filename

                try:
                    uploaded_file.save(temp_path)
                    extraction_result = extractor.extract_from_file(temp_path)
                    result_dict = extraction_result.parsed.model_dump()
                    session["last_result"] = {
                        "data": result_dict,
                        "filename": filename,
                    }
                    pending_validation = True
                    flash(
                        "Extraction terminée. Vérifiez les données puis validez l'insertion.",
                        "success",
                    )
                except Exception as exc:  # noqa: BLE001
                    logging.exception("Erreur lors de l'extraction : %s", exc)
                    flash(f"Erreur lors de l'extraction : {exc}", "error")
                finally:
                    if temp_path.exists():
                        temp_path.unlink()

        if result_dict:
            summary = _build_summary(result_dict)
            result_json = json.dumps(result_dict, indent=2, ensure_ascii=False)

        return render_template(
            "index.html",
            result_json=result_json,
            summary=summary,
            extractor_error=extractor_error,
            pending_validation=pending_validation,
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)

