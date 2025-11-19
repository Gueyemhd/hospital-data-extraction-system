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


def merge_texts_by_hopital(texts_dir, output_dir):
    """
    Fusionne les fichiers TXT par hôpital en se basant sur le nom du fichier.
    Exemple : 'Hôpital Bicêtre_01.txt' -> 'Hôpital Bicêtre.txt'
    """
    ensure_dir(output_dir)
    hopital_files = {}

    # Rassemblement des fichiers par hôpital
    for file in os.listdir(texts_dir):
        if file.endswith(".txt"):
            hopital_name = file.replace(".txt", "")
            if "_" in hopital_name:
                hopital_name = hopital_name.split("_")[0]
            hopital_name = hopital_name.strip()

            full_path = os.path.join(texts_dir, file)
            hopital_files.setdefault(hopital_name, []).append(full_path)
        if file.lower().startswith("finess"):
            continue


    # Concaténation
    for hopital_name, files in hopital_files.items():
        output_path = os.path.join(output_dir, f"{hopital_name}.txt")

        with open(output_path, "a", encoding="utf-8") as out:
            out.write(f"===== DOSSIER : {hopital_name} =====\n\n")

            for fpath in files:
                out.write(f"\n--- FICHIER : {os.path.basename(fpath)} ---\n\n")
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    out.write(f.read() + "\n")

        logging.info(f"[OK] Fichier hôpital généré -> {output_path}")



if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Extraction automatique de texte hospitalier")
    parser.add_argument("--input", required=True, help="Dossier contenant les fichiers sources")
    parser.add_argument("--output", required=True, help="Dossier de sortie pour les .txt")
    parser.add_argument("--corpus", action="store_true", help="Fusionner en corpus.txt")
    parser.add_argument("--by-hopital", action="store_true",
                    help="Fusionner les fichiers TXT par nom d'hôpital")
    parser.add_argument("--output-hopital", required=False, default="output_hopitaux",
                    help="Dossier où sauvegarder les fichiers fusionnés par hôpital")



    args = parser.parse_args()

    setup_logger()
    process_all_files(args.input, args.output)
    

    if args.by_hopital:
        merge_texts_by_hopital(args.output, args.output_hopital)


 
