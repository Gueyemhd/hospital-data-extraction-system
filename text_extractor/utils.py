import os
import logging

def setup_logger(log_file="extraction.log"):
    """Configure le logger global."""
    logging.basicConfig(
        filename=log_file,
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    formatter = logging.Formatter("%(levelname)s: %(message)s")
    console.setFormatter(formatter)
    logging.getLogger().addHandler(console)


def ensure_dir(path):
    """Crée le dossier s’il n’existe pas."""
    os.makedirs(path, exist_ok=True)
