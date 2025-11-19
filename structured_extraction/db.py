"""
Utilities to persist extraction results into a MySQL database.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Dict, Iterable, Iterator, Optional

import mysql.connector
from mysql.connector.connection import MySQLConnection

from .schemas import (
    AccesTransport,
    Adresse,
    Document,
    DonneesHospitalieres,
    HospitalExtraction,
    Hopital,
    Service,
)


class DatabaseConfigurationError(RuntimeError):
    """Raised when the database configuration is incomplete."""


def _get_db_config() -> Dict[str, str]:
    required_keys = []
    missing = [key for key in required_keys if not os.getenv(key)]
    if missing:
        raise DatabaseConfigurationError(
            f"Variables d'environnement manquantes pour MySQL: {', '.join(missing)}"
        )
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "port": int(os.getenv("MYSQL_PORT", "3306")),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", "mysql2025"),
        "database": os.getenv("MYSQL_DATABASE", "hospital_data_extraction"),
        "auth_plugin": os.getenv("MYSQL_AUTH_PLUGIN") or None,
    }


@contextmanager
def db_connection() -> Iterator[MySQLConnection]:
    config = _get_db_config()
    conn = mysql.connector.connect(**{k: v for k, v in config.items() if v is not None})
    try:
        yield conn
    finally:
        conn.close()


def persist_extraction(
    extraction: HospitalExtraction, source_filename: Optional[str] = None
) -> int:
    """
    Persist a HospitalExtraction instance into the MySQL database.

    Returns the ID of the created extraction row.
    """

    with db_connection() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO extractions(
                    source_filename,
                    hopitaux_count,
                    services_count,
                    adresses_count,
                    donnees_count,
                    documents_count
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    source_filename,
                    len(extraction.hopitaux),
                    len(extraction.services),
                    len(extraction.adresses),
                    len(extraction.donnees_hospitalieres),
                    len(extraction.documents),
                ),
            )
            extraction_id = cursor.lastrowid

            adresse_map = _insert_adresses(cursor, extraction_id, extraction.adresses)
            hopital_map = _insert_hopitaux(
                cursor, extraction_id, extraction.hopitaux, adresse_map
            )

            _insert_acces_transport(
                cursor, extraction_id, extraction.acces_transport
            )
            _insert_services(cursor, extraction_id, extraction.services, hopital_map)
            _insert_donnees(
                cursor,
                extraction_id,
                extraction.donnees_hospitalieres,
            )
            _insert_documents(cursor, extraction_id, extraction.documents)

            conn.commit()
            return extraction_id
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()


def _insert_adresses(
    cursor, extraction_id: int, adresses: Iterable[Adresse]
) -> Dict[int, int]:
    id_map: Dict[int, int] = {}
    query = """
        INSERT INTO adresses(
            extraction_id,
            original_id,
            numero,
            rue,
            code_postal,
            commune,
            ville,
            region,
            pays
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    for adresse in adresses:
        cursor.execute(
            query,
            (
                extraction_id,
                adresse.id_adresse,
                adresse.numero,
                adresse.rue,
                adresse.code_postal,
                adresse.commune,
                adresse.ville,
                adresse.region,
                adresse.pays,
            ),
        )
        if adresse.id_adresse is not None:
            id_map[adresse.id_adresse] = cursor.lastrowid

    return id_map


def _insert_hopitaux(
    cursor,
    extraction_id: int,
    hopitaux: Iterable[Hopital],
    adresse_map: Dict[int, int],
) -> Dict[int, int]:
    id_map: Dict[int, int] = {}
    query = """
        INSERT INTO hopitaux(
            extraction_id,
            original_id,
            nom,
            id_adresse,
            type_etablissement,
            statut,
            nb_lits,
            nb_personnel,
            nb_place
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    for hopital in hopitaux:
        cursor.execute(
            query,
            (
                extraction_id,
                hopital.id_hopital,
                hopital.nom,
                adresse_map.get(hopital.id_adresse) if hopital.id_adresse else None,
                hopital.type,
                hopital.statut,
                hopital.nb_lits,
                hopital.nb_personnel,
                hopital.nb_place,
            ),
        )
        if hopital.id_hopital is not None:
            id_map[hopital.id_hopital] = cursor.lastrowid

    return id_map


def _insert_acces_transport(
    cursor, extraction_id: int, acces_list: Iterable[AccesTransport]
) -> None:
    query = """
        INSERT INTO acces_transport(
            extraction_id,
            original_id,
            type_transport,
            ligne,
            arret
        ) VALUES (%s,%s,%s,%s,%s)
    """

    for acces in acces_list:
        cursor.execute(
            query,
            (
                extraction_id,
                acces.id_acces_transport,
                acces.type_transport,
                acces.ligne,
                acces.arret,
            ),
        )


def _insert_services(
    cursor,
    extraction_id: int,
    services: Iterable[Service],
    hopital_map: Dict[int, int],
) -> None:
    query = """
        INSERT INTO services(
            extraction_id,
            original_id,
            nom_service,
            type_service,
            description,
            capacite,
            code_service,
            telephone,
            email,
            hopital_original_id
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    for service in services:
        cursor.execute(
            query,
            (
                extraction_id,
                service.id_service,
                service.nom_service,
                service.type_service,
                service.description,
                service.capacite,
                service.code_service,
                service.telephone,
                service.email,
                service.id_hopital,
            ),
        )


def _insert_donnees(
    cursor,
    extraction_id: int,
    donnees: Iterable[DonneesHospitalieres],
) -> None:
    query = """
        INSERT INTO donnees_hospitalieres(
            extraction_id,
            original_id,
            hopital_original_id,
            annee,
            nb_patients,
            nb_admissions,
            budget_total,
            depenses,
            recettes,
            taux_occupation,
            taux_mortalite,
            taux_satisfaction,
            document_original_id,
            date_insertion
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    for donnee in donnees:
        cursor.execute(
            query,
            (
                extraction_id,
                donnee.id_donnee,
                donnee.id_hopital,
                donnee.annee,
                donnee.nb_patients,
                donnee.nb_admissions,
                donnee.budget_total,
                donnee.depenses,
                donnee.recettes,
                donnee.taux_occupation,
                donnee.taux_mortalite,
                donnee.taux_satisfaction,
                donnee.document_id,
                donnee.date_insertion,
            ),
        )


def _insert_documents(
    cursor,
    extraction_id: int,
    documents: Iterable[Document],
) -> None:
    query = """
        INSERT INTO documents(
            extraction_id,
            original_id,
            nom_fichier,
            chemin_fichier,
            type_document,
            annee_document
        ) VALUES (%s,%s,%s,%s,%s,%s)
    """

    for document in documents:
        cursor.execute(
            query,
            (
                extraction_id,
                document.id_document,
                document.nom_fichier,
                document.chemin_fichier,
                document.type_document,
                document.annee_document,
            ),
        )

