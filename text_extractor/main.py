import os
import logging
from .utils import ensure_dir, setup_logger
from .extractors import detect_and_extract

def process_all_files(input_dir, output_dir):
    """
    Parcourt un répertoire et extrait le texte de chaque fichier
    vers un fichier .txt dans output_dir.
    """
    ensure_dir(output_dir)
    files = [f for f in os.listdir(input_dir) if os.path.isfile(os.path.join(input_dir, f))]

    for file in files:
        path = os.path.join(input_dir, file)
        logging.info(f"Traitement de : {file}")
        text = detect_and_extract(path)

        if text.strip():
            output_path = os.path.join(output_dir, f"{os.path.splitext(file)[0]}.txt")
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(text)
            logging.info(f"Texte extrait -> {output_path}")
        else:
            logging.warning(f"Aucun texte extrait pour : {file}")

    logging.info("Extraction terminée pour tous les fichiers.")


def merge_texts_to_corpus(texts_dir, output_file="corpus.txt"):
    """Fusionne tous les fichiers texte extraits en un seul corpus."""
    ensure_dir(os.path.dirname(output_file) or ".")
    with open(output_file, "w", encoding="utf-8") as out:
        for file in os.listdir(texts_dir):
            if file.endswith(".txt"):
                path = os.path.join(texts_dir, file)
                with open(path, encoding="utf-8") as f:
                    content = f.read()
                out.write(f"\n\n===== {file} =====\n\n{content}\n")
    logging.info(f"Corpus global créé : {output_file}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extraction automatique de texte hospitalier")
    parser.add_argument("--input", required=True, help="Dossier contenant les fichiers sources")
    parser.add_argument("--output", required=True, help="Dossier de sortie pour les .txt")
    parser.add_argument("--corpus", action="store_true", help="Fusionner en corpus.txt")

    args = parser.parse_args()

    setup_logger()
    process_all_files(args.input, args.output)

    if args.corpus:
        merge_texts_to_corpus(args.output)
