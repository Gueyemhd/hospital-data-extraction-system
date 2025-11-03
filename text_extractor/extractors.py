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



# Désactiver les warnings
warnings.filterwarnings("ignore", category=UserWarning)
fitz.TOOLS.mupdf_display_errors(False)



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
    """Extrait le texte d’un fichier HTML."""
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            soup = BeautifulSoup(f, "html.parser")
            return soup.get_text(separator="\n")
    except Exception as e:
        logging.error(f"Erreur extraction HTML {path}: {e}")
        return ""

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
