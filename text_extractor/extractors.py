import os
import mimetypes
import fitz  # PyMuPDF
import pandas as pd
import docx2txt
from bs4 import BeautifulSoup
from PIL import Image
import tempfile
from .utils import ensure_dir
import logging
import easyocr
import uuid
import warnings
import glob
from html import unescape
import re
import json 



# Désactiver les warnings
warnings.filterwarnings("ignore", category=UserWarning)



# ============
# EXTRACTEURS
# ============


ocr_reader = easyocr.Reader(['fr', 'en'], gpu=False, verbose=False)


def extract_text_from_pdf(path):
    """Extrait le texte d'un fichier PDF (natif ou scanné)."""
    try:
        text = ""
        with fitz.open(path) as doc:
            for page in doc:
                page_text = page.get_text().strip()
                if page_text:
                    text += page_text + "\n"
                else:
                    # PDF scanné sans texte donc OCR avec EasyOCR
                    pix = page.get_pixmap(dpi=200)
                    temp_name = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.png")
                    pix.save(temp_name)
                    try:
                        results = ocr_reader.readtext(temp_name, detail=0)
                        text += '\n'.join(results) + "\n"
                    finally:
                        if os.path.exists(temp_name):
                            os.remove(temp_name)
        return text
    except Exception as e:
        logging.error(f"Erreur extraction PDF {path}: {e}")
        return ""


def extract_text_from_docx(path):
    """Extrait le texte d’un fichier DOCX."""
    try:
        return docx2txt.process(path)
    except Exception as e:
        logging.error(f"Erreur extraction DOCX {path}: {e}")
        return ""


def extract_text_from_excel(path):
    """Extrait le texte de toutes les feuilles d’un fichier Excel."""
    try:
        text = ""
        xls = pd.ExcelFile(path)
        for sheet in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet, dtype=str)
            text += f"\n=== Feuille: {sheet} ===\n"
            text += "\n".join(df.astype(str).apply(lambda x: " | ".join(x), axis=1))
        return text
    except Exception as e:
        logging.error(f"Erreur extraction Excel {path}: {e}")
        return ""


def extract_text_from_csv(path):
    """Extrait le texte d’un fichier CSV."""
    try:
        df = pd.read_csv(path, encoding="utf-8", dtype=str)
        return "\n".join(df.astype(str).apply(lambda x: " | ".join(x), axis=1))
    except Exception as e:
        logging.error(f"Erreur extraction CSV {path}: {e}")
        return ""


def extract_text_from_html(path):
    """Extrait proprement le texte utile d'un fichier HTML (nettoyé et structuré)."""
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")

    # Supprimer les balises inutiles
    for tag in soup(["script", "style", "noscript", "iframe", "header", "footer", "nav", "aside"]):
        tag.decompose()

    # EXTRACTION SPECIALE DES ADRESSES -------------------------------------
    address_blocks = []

    # Rechercher un bloc contenant le mot "Adresse" 
    for div in soup.find_all(["div", "p"]):
        text = div.get_text(separator=" ", strip=True)
        if "Adresse" in text or "adresse" in text:
            address_blocks.append(text)

    # Fusionner les adresses trouvées
    address_text = "\n".join(address_blocks)
    # -------------------------------------------------------------------------

    # Extraire le titre
    title = soup.title.string.strip() if soup.title and soup.title.string else ""

    # Extraire les métadonnées
    metas = []
    for meta in soup.find_all("meta"):
        if meta.get("name") and meta.get("content"):
            metas.append(f"{meta['name']}: {meta['content']}")
    meta_text = "\n".join(metas)

    # Extraire le contenu structuré (titres + paragraphes + listes)
    lines = []

    # Ajouter l’adresse avant le reste du contenu
    if address_text:
        lines.append("### ADRESSE")
        lines.append(address_text)

    for element in soup.find_all(["h1", "h2", "h3", "h4", "p", "li", "td"]):
        text = element.get_text(separator=" ", strip=True)
        if len(text) > 2:
            lines.append(text)

    # Nettoyage
    clean_text = "\n".join(lines)
    clean_text = unescape(clean_text)
    clean_text = re.sub(r"\n{2,}", "\n", clean_text)
    clean_text = re.sub(r"[ \t]+", " ", clean_text)

    # Concat final
    result = f"TITRE: {title}\n\n{meta_text}\n\n{clean_text}".strip()
    return result

def extract_text_from_json(path):
    """
    Extrait proprement le texte d'un fichier JSON, en explorant récursivement
    tous les champs texte pertinents.
    """
    def extract_values(obj):
        """Explore récursivement un dictionnaire ou une liste et récupère les chaînes de caractères."""
        texts = []
        if isinstance(obj, dict):
            for key, value in obj.items():
                # Si la valeur est une chaîne, on l’ajoute
                if isinstance(value, str):
                    # On ignore les URLs, IDs ou champs techniques
                    if not re.match(r"^(https?://|www\.|[A-Za-z0-9_-]*id[A-Za-z0-9_-]*$)", key.lower()):
                        texts.append(f"{key}: {value.strip()}")
                # Si c’est un autre objet (dict ou list), on appelle récursivement
                elif isinstance(value, (dict, list)):
                    texts.extend(extract_values(value))
        elif isinstance(obj, list):
            for item in obj:
                texts.extend(extract_values(item))
        return texts

    # Lecture du fichier JSON
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            return f"[ERREUR] Le fichier {path} n'est pas un JSON valide."

    # Extraction récursive du texte
    texts = extract_values(data)

    # Nettoyage léger
    clean_text = "\n".join(texts)
    clean_text = re.sub(r"\n{2,}", "\n", clean_text)
    clean_text = re.sub(r"[ \t]+", " ", clean_text)

    # Résultat final
    result = f"FICHIER: {path}\n\n{clean_text}".strip()
    return result



def extract_text_from_image(path):
    """Extrait le texte d'une image (OCR)."""
    try:
        # Remplace pytesseract.image_to_string()
        results = ocr_reader.readtext(path, detail=0)
        return '\n'.join(results)
    except Exception as e:
        logging.error(f"Erreur extraction image {path}: {e}")
        return ""

def extract_text_from_txt(path):
    """Lit directement le contenu d’un fichier texte."""
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        logging.error(f"Erreur lecture TXT {path}: {e}")
        return ""




# ==================
# ROUTEUR DÉTECTEUR
# ==================

def detect_and_extract(file_path):
    """Détecte automatiquement le type de fichier et choisit la bonne extraction."""
    mime_type, _ = mimetypes.guess_type(file_path)
    ext = os.path.splitext(file_path)[1].lower()

    if not os.path.isfile(file_path):
        logging.warning(f"Fichier introuvable: {file_path}")
        return ""

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    elif ext in [".xls", ".xlsx"]:
        return extract_text_from_excel(file_path)
    elif ext == ".csv":
        return extract_text_from_csv(file_path)
    elif ext in [".html", ".htm"]:
        return extract_text_from_html(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".tiff"]:
        return extract_text_from_image(file_path)
    elif ext == ".txt":
        return extract_text_from_txt(file_path)
    elif ext == ".json":
        return extract_text_from_json(file_path)
    else:
        logging.warning(f"Type de fichier non supporté : {file_path}")
        return ""



OUTPUT_FILE = "corpus.txt"

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    for file in glob.glob("static/texts/*.txt"):
        name = file.split("/")[-1]
        out.write(f"\n\n===== {name} =====\n\n")
        text = open(file, encoding="utf-8").read()
        out.write(text)

print(f"Corpus global sauvegardé dans : {OUTPUT_FILE}")
