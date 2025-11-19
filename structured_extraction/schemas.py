"""
Data models and Kor schemas describing the hospital database tables.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from kor.nodes import Number, Object, Text
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Pydantic models mirroring the relational schema
# ---------------------------------------------------------------------------


class Adresse(BaseModel):
    id_adresse: Optional[int] = Field(None, description="Identifiant interne si fourni.")
    numero: Optional[str] = Field(None, description="Numéro de rue.")
    rue: Optional[str] = Field(None, description="Nom de la rue.")
    code_postal: Optional[str] = Field(None, description="Code postal.")
    commune: Optional[str] = Field(None, description="Commune.")
    ville: Optional[str] = Field(None, description="Ville.")
    region: Optional[str] = Field(None, description="Région administrative.")
    pays: Optional[str] = Field("France", description="Pays, valeur par défaut France.")


class AccesTransport(BaseModel):
    id_acces_transport: Optional[int] = Field(None, description="Identifiant si disponible.")
    type_transport: Optional[str] = Field(
        None, description="Type de transport (bus, métro, tram, etc.)."
    )
    ligne: Optional[str] = Field(None, description="Numéro ou nom de la ligne.")
    arret: Optional[str] = Field(None, description="Arrêt desservant l'hôpital.")



class Service(BaseModel):
    id_service: Optional[int] = Field(None, description="Identifiant unique du service.")
    nom_service: Optional[str] = None
    type_service: Optional[str] = None
    description: Optional[str] = None
    capacite: Optional[int] = None
    code_service: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    # horaires: Optional[str] = None
    id_hopital: Optional[int] = Field(None, description="FK vers hopital.id_hopital.")



class Hopital(BaseModel):
    id_hopital: Optional[int] = Field(None, description="Identifiant interne unique de l'hôpital.")
    nom: Optional[str] = Field(None, description="Nom officiel de l'hôpital.")
    id_adresse: Optional[int] = Field(None, description="Référence vers l'adresse associée (FK).")
    type: Optional[str] = Field(None, description="Type d'établissement (ex : CHU, clinique, etc.).")
    statut: Optional[str] = Field(None, description="Statut juridique (public, privé, ESPIC, etc.).")
    nb_lits: Optional[int] = Field(None, description="Nombre de lits disponibles.")
    nb_personnel: Optional[int] = Field(None, description="Nombre total d'employés ou de personnel.")
    nb_place: Optional[int] = Field(None, description="Nombre de places hors lits, si précisé (ex : places d'hôpital de jour).")


class DonneesHospitalieres(BaseModel):
    id_donnee: Optional[int] = Field(None, description="Identifiant unique de la donnée hospitalière.")
    id_hopital: Optional[int] = Field(None, description="Référence à l'hôpital concerné (FK vers hopital.id_hopital).")
    annee: Optional[int] = Field(None, description="Année de référence des données.")
    nb_patients: Optional[int] = Field(None, description="Nombre total de patients pour l'année.")
    nb_admissions: Optional[int] = Field(None, description="Nombre total d'admissions enregistrées.")
    budget_total: Optional[float] = Field(None, description="Budget total annuel (en euros, si précisé).")
    depenses: Optional[float] = Field(None, description="Dépenses annuelles totales.")
    recettes: Optional[float] = Field(None, description="Recettes annuelles totales.")
    taux_occupation: Optional[float] = Field(None, description="Taux d’occupation des lits (en %).")
    taux_mortalite: Optional[float] = Field(None, description="Taux de mortalité observé (en % ou nb absolu).")
    taux_satisfaction: Optional[float] = Field(None, description="Taux de satisfaction des patients (en %).")
    document_id: Optional[int] = Field(None, description="Référence au document source pour cette donnée.")
    date_insertion: Optional[str] = Field(
        None, description="Date/horodatage de référence associé à la donnée, si disponible."
    )
    


class Document(BaseModel):
    id_document: Optional[int] = Field(None, description="Identifiant unique du document.")
    nom_fichier: Optional[str] = Field(None, description="Nom du fichier source du document.")
    chemin_fichier: Optional[str] = Field(None, description="Chemin d'accès complet du fichier sur le système.")
    type_document: Optional[str] = Field(None, description="Type ou nature du document (PDF, site web, rapport, etc.).")
    annee_document: Optional[int] = Field(None, description="Année de publication ou de rédaction du document.")


class HospitalExtraction(BaseModel):
    adresses: List[Adresse] = Field(default_factory=list, description="Liste des adresses extraites.")
    acces_transport: List[AccesTransport] = Field(default_factory=list, description="Informations sur les accès transports extraites.")
    services: List[Service] = Field(default_factory=list, description="Services hospitaliers extraits.")
    hopitaux: List[Hopital] = Field(default_factory=list, description="Structures hospitalières extraites.")
    donnees_hospitalieres: List[DonneesHospitalieres] = Field(default_factory=list, description="Données hospitalières structurées.")
    documents: List[Document] = Field(default_factory=list, description="Sources documentaires analysées.")

# ---------------------------------------------------------------------------
# Kor schema definition
# ---------------------------------------------------------------------------


adresse_schema = Object(
    id="adresses",
    description=(
        "Adresses physiques complètes des hôpitaux. "
        "Extrais TOUTES les adresses mentionnées dans le document, même si elles sont présentées sur plusieurs lignes ou dans différents formats. "
        "Si une adresse est présentée ligne par ligne (ex: '184 rue du Faubourg Saint-Antoine' sur une ligne, '75012 Paris' sur la suivante), "
        "reconstitue-la en une seule adresse complète. "
        "Exemple: '184 rue du Faubourg Saint-Antoine, 75012 Paris, Île-de-France, France' doit être extraite comme une adresse complète avec tous ses champs remplis."
    ),
    many=True,
    attributes=[
        Number(
            id="id_adresse",
            description="Identifiant numérique interne de l'adresse si mentionné explicitement dans le document (rare, généralement absent)."
        ),
        Text(
            id="numero",
            description=(
                "Numéro de la voie, extrait du début de l'adresse. "
                "Exemples: '184', '12', '12 bis', '15A'. "
                "Si l'adresse commence directement par le nom de la rue sans numéro, laisse vide."
            )
        ),
        Text(
            id="rue",
            description=(
                "Nom complet de la rue, avenue, boulevard, place, etc. "
                "Inclus le type de voie (rue, avenue, boulevard, etc.) et le nom complet. "
                "Exemples: 'rue du Faubourg Saint-Antoine', 'avenue de la République', 'boulevard Pasteur', 'place de la République'. "
                "N'inclus PAS le numéro dans ce champ."
            )
        ),
        Text(
            id="code_postal",
            description=(
                "Code postal français à 5 chiffres. "
                "Exemples: '75012', '69001', '13001', '33000'. "
                "Extrais-le même s'il est présenté séparément de la ville."
            )
        ),
        Text(
            id="commune",
            description=(
                "Nom de la commune si mentionné séparément de la ville. "
                "En France, la commune est souvent la même que la ville, mais peut être différente (ex: arrondissements de Paris). "
                "Si seule la ville est mentionnée, laisse ce champ vide."
            )
        ),
        Text(
            id="ville",
            description=(
                "Nom de la ville principale. "
                "Exemples: 'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'. "
                "Extrais toujours la ville même si elle fait partie d'une agglomération plus large."
            )
        ),
        Text(
            id="region",
            description=(
                "Région administrative française. "
                "Exemples: 'Île-de-France', 'Auvergne-Rhône-Alpes', 'Provence-Alpes-Côte d'Azur', 'Nouvelle-Aquitaine', 'Occitanie'. "
                "Utilise le nom complet de la région, pas les abréviations."
            )
        ),
        Text(
            id="pays",
            description=(
                "Pays de l'adresse. "
                "Par défaut, utilise 'France' si le pays n'est pas mentionné explicitement. "
                "Si un autre pays est mentionné, utilise son nom complet (ex: 'Belgique', 'Suisse')."
            )
        ),
    ],
)

acces_transport_schema = Object(
    id="acces_transport",
    description=(
        "Moyens d'accès en transports en commun à l'hôpital. "
        "Extrais CHAQUE ligne de transport mentionnée séparément. "
        "Si plusieurs lignes du même type sont mentionnées (ex: 'Bus : Lignes 46, 76, 86'), crée un objet séparé pour chaque ligne. "
        "Exemple: 'Métro : Ligne 1, station Faidherbe-Chaligny' doit être extrait comme un accès transport avec type_transport='métro', ligne='1', arret='Faidherbe-Chaligny'. "
        "Exemple: 'Bus : Ligne 46, arrêt Hôpital Saint-Antoine' doit être extrait avec type_transport='bus', ligne='46', arret='Hôpital Saint-Antoine'."
    ),
    many=True,
    attributes=[
        Number(
            id="id_acces_transport",
            description="Identifiant numérique interne si donné explicitement dans le document (rare, généralement absent)."
        ),
        Text(
            id="type_transport",
            description=(
                "Type de transport en minuscules. "
                "Valeurs possibles: 'métro', 'bus', 'tram', 'RER', 'train', 'tramway', 'navette', 'vélo', 'parking'. "
                "Normalise les variations: 'Métro' → 'métro', 'Bus' → 'bus', 'Tramway' → 'tram'."
            )
        ),
        Text(
            id="ligne",
            description=(
                "Numéro ou nom de la ligne de transport. "
                "Peut être un nombre (ex: '1', '8', '46', '76') ou une lettre (ex: 'A', 'B', 'C' pour RER). "
                "Extrais uniquement le numéro/lettre de la ligne, sans le mot 'Ligne' ou 'ligne'. "
                "Exemples: '1', '8', '46', 'A', 'B', 'T1'."
            )
        ),
        Text(
            id="arret",
            description=(
                "Nom complet de l'arrêt, de la station ou du point d'arrêt le plus proche de l'hôpital. "
                "Exemples: 'Faidherbe-Chaligny', 'Ledru-Rollin', 'Hôpital Saint-Antoine', 'Faubourg Saint-Antoine'. "
                "Inclus les informations supplémentaires si mentionnées (ex: 'Faidherbe-Chaligny (sortie rue du Faubourg Saint-Antoine)' → 'Faidherbe-Chaligny'). "
                "Si plusieurs arrêts sont mentionnés pour la même ligne, crée un objet séparé pour chaque arrêt."
            )
        ),
    ],
)

service_schema = Object(
    id="services",
    description=(
        "Services hospitaliers décrits dans le document. "
        "Extrais TOUS les services mentionnés: services médicaux, chirurgicaux, diagnostiques, médico-techniques, services de support, etc. "
        "Chaque service mentionné (même brièvement) doit être extrait comme un objet séparé. "
        "Exemples de services: Neurologie, ORL, Réanimation, Cardiologie, Chirurgie générale, Pédiatrie, Radiologie, Urgences, Pharmacie, Laboratoire, etc."
    ),
    many=True,
    attributes=[
        Number(
            id="id_service",
            description="Identifiant numérique du service si mentionné explicitement dans le document (ex: code interne, numéro de service). Généralement absent."
        ),
        Text(
            id="nom_service",
            description=(
                "Nom complet et officiel du service. "
                "Exemples: 'Service de Neurologie', 'ORL (Oto-Rhino-Laryngologie)', 'Service de Réanimation', 'Cardiologie', 'Chirurgie générale', 'Pédiatrie', 'Radiologie et Imagerie médicale'. "
                "Conserve la casse et la ponctuation exactes du document."
            )
        ),
        Text(
            id="description",
            description=(
                "Description détaillée du service si disponible. "
                "Inclus les activités principales, spécialités, pathologies traitées. "
                "Exemple: 'Prise en charge des pathologies neurologiques aiguës et chroniques, accidents vasculaires cérébraux, épilepsie, sclérose en plaques'. "
                "Si aucune description n'est fournie, laisse vide."
            )
        ),
        Number(
            id="capacite",
            description=(
                "Capacité totale du service exprimée en nombre. "
                "Si plusieurs capacités sont mentionnées (lits + places), additionne-les. "
                "Exemples: '35 lits' → 35, '28 lits, 15 places' → 43, '40 lits' → 40. "
                "Si seule la capacité en places est mentionnée, utilise cette valeur. "
                "Si aucune capacité n'est mentionnée, laisse vide (pas 0)."
            )
        ),
        Text(
            id="code_service",
            description=(
                "Code interne du service si mentionné. "
                "Exemples: 'NEU-001', 'ORL-002', 'REA-003', 'CAR-004', 'RAD-007'. "
                "Peut être un code alphanumérique. Conserve le format exact du document."
            )
        ),
        Text(
            id="telephone",
            description=(
                "Numéro de téléphone du service au format français. "
                "Exemples: '01 49 28 21 10', '01.49.28.21.25', '+33 1 49 28 22 00'. "
                "Conserve le format exact du document (espaces, points, tirets)."
            )
        ),
        Text(
            id="email",
            description=(
                "Adresse email du service si mentionnée. "
                "Exemples: 'neurologie.saint-antoine@aphp.fr', 'contact@hopital.fr'. "
                "Extrais l'email complet tel qu'il apparaît dans le document."
            )
        ),
        Number(
            id="id_hopital",
            description=(
                "Identifiant de l'hôpital auquel appartient le service. "
                "Si un seul hôpital est mentionné dans le document, utilise 1. "
                "Si plusieurs hôpitaux sont mentionnés, associe chaque service à l'hôpital approprié. "
                "Généralement 1 si un seul hôpital est documenté."
            )
        ),
    ],
)

hopital_schema = Object(
    id="hopitaux",
    description=(
        "Informations générales sur les hôpitaux et établissements de santé mentionnés dans le document. "
        "Extrais chaque hôpital, clinique, ou établissement de santé comme un objet séparé. "
        "Si plusieurs établissements sont mentionnés, crée un objet pour chacun."
    ),
    many=True,
    attributes=[
        Number(
            id="id_hopital",
            description=(
                "Identifiant unique numérique de l'hôpital. "
                "Si un seul hôpital est mentionné, utilise 1. "
                "Si plusieurs hôpitaux sont mentionnés, numérote-les séquentiellement (1, 2, 3, etc.). "
                "Si un identifiant explicite est mentionné dans le document (ex: FINESS), utilise-le."
            )
        ),
        Text(
            id="nom",
            description=(
                "Nom complet et officiel de l'hôpital ou établissement. "
                "Exemples: 'Centre Hospitalier Universitaire de Paris - Hôpital Saint-Antoine', 'Hôpital Saint-Antoine', 'CHU de Paris', 'Clinique Pasteur'. "
                "Conserve le nom exact tel qu'il apparaît dans le document, y compris les sigles et tirets."
            )
        ),
        Number(
            id="id_adresse",
            description=(
                "Référence vers l'adresse associée. "
                "Si une seule adresse est extraite, utilise 1. "
                "Si plusieurs adresses sont extraites, associe chaque hôpital à son adresse correspondante (1, 2, etc.). "
                "Si aucune adresse n'est extraite, utilise 0 ou laisse vide."
            )
        ),
        Text(
            id="type",
            description=(
                "Type d'établissement de santé. "
                "Exemples: 'CHU' (Centre Hospitalier Universitaire), 'CH' (Centre Hospitalier), 'Clinique', 'Hôpital', 'Hôpital privé', 'Centre de santé', 'Établissement public de santé'. "
                "Conserve la terminologie exacte du document."
            )
        ),
        Text(
            id="statut",
            description=(
                "Statut juridique de l'établissement. "
                "Valeurs possibles: 'Public', 'Privé', 'Privé à but non lucratif', 'ESPIC' (Établissement de Santé Privé d'Intérêt Collectif), 'Associatif'. "
                "Si le statut n'est pas explicitement mentionné mais peut être déduit (ex: 'CHU' implique généralement 'Public'), utilise la déduction. "
                "Sinon, laisse vide."
            )
        ),
        Number(
            id="nb_lits",
            description=(
                "Nombre total de lits de l'établissement. "
                "Extrais uniquement le nombre de lits, pas les places. "
                "Exemples: '850 lits' → 850, '1200 lits' → 1200. "
                "Si le nombre est mentionné de manière approximative (ex: 'environ 850 lits'), extrais quand même le nombre. "
                "Si non mentionné, laisse vide (pas 0)."
            )
        ),
        Number(
            id="nb_personnel",
            description=(
                "Nombre total d'employés, de personnels ou de personnes travaillant dans l'établissement. "
                "Peut être mentionné comme 'personnel', 'employés', 'personnes', 'effectifs'. "
                "Exemples: '3200 personnes' → 3200, 'environ 5000 employés' → 5000. "
                "Si non mentionné, laisse vide (pas 0)."
            )
        ),
        Number(
            id="nb_place",
            description=(
                "Nombre de places hors lits (places d'hôpital de jour, places de consultations, places ambulatoires). "
                "Exemples: '120 places d'hôpital de jour' → 120, '50 places de consultations' → 50. "
                "N'inclus PAS les lits dans ce nombre. "
                "Si non mentionné, laisse vide (pas 0)."
            )
        ),
    ],
)

donnees_hospitalieres_schema = Object(
    id="donnees_hospitalieres",
    description=(
        "Indicateurs statistiques et données chiffrées extraits des rapports d'activité, rapports annuels, ou documents statistiques. "
        "IMPORTANT: N'extrais des données_hospitalieres QUE si le texte contient réellement des statistiques chiffrées (nombre de patients, admissions, budget, taux, etc.). "
        "Ne crée PAS d'entrée si seules l'année ou des métadonnées sont mentionnées sans données statistiques réelles. "
        "Extrais toutes les données numériques relatives à l'activité, au budget, aux performances de l'hôpital. "
        "Si plusieurs années sont mentionnées, crée un objet séparé pour chaque année."
    ),
    many=True,
    attributes=[
        Number(
            id="id_donnee",
            description="Identifiant unique numérique de la donnée. Si plusieurs ensembles de données sont extraits, numérote-les séquentiellement (1, 2, 3, etc.)."
        ),
        Number(
            id="id_hopital",
            description=(
                "Référence vers l'hôpital concerné. "
                "Si un seul hôpital est mentionné dans le document, utilise 1. "
                "Si plusieurs hôpitaux sont mentionnés, associe chaque donnée à l'hôpital approprié."
            )
        ),
        Number(
            id="annee",
            description=(
                "Année de référence des données statistiques. "
                "Exemples: 2023, 2024, 2022. "
                "Extrais l'année même si elle est mentionnée de manière implicite (ex: 'rapport 2023' → 2023). "
                "Si aucune année n'est mentionnée mais peut être déduite du contexte (ex: 'rapport annuel' dans un document daté de 2024), utilise cette année."
            )
        ),
        Number(
            id="nb_patients",
            description=(
                "Nombre total de patients pris en charge, traités, ou suivis sur la période. "
                "Peut être mentionné comme 'patients', 'patients pris en charge', 'patients traités', 'patients suivis'. "
                "Exemples: '45 230 patients' → 45230, 'environ 50000 patients' → 50000. "
                "N'inclus PAS les admissions dans ce nombre (utilise nb_admissions pour cela)."
            )
        ),
        Number(
            id="nb_admissions",
            description=(
                "Nombre total d'admissions enregistrées sur la période. "
                "Peut être mentionné comme 'admissions', 'entrées', 'admissions enregistrées'. "
                "Exemples: '18 750 admissions' → 18750, '20000 entrées' → 20000. "
                "Distinct du nombre de patients (un patient peut avoir plusieurs admissions)."
            )
        ),
        Number(
            id="budget_total",
            description=(
                "Budget total annuel de l'établissement en euros. "
                "Peut être mentionné comme 'budget', 'budget total', 'budget annuel', 'budget global'. "
                "Exemples: '125 450 000 euros' → 125450000, '125,45 millions d'euros' → 125450000, '125M€' → 125000000. "
                "Convertis toutes les unités en euros (millions → multiplier par 1000000)."
            )
        ),
        Number(
            id="depenses",
            description=(
                "Dépenses totales annuelles en euros. "
                "Peut être mentionné comme 'dépenses', 'dépenses totales', 'charges', 'coûts'. "
                "Exemples: '122 800 000 euros' → 122800000, '122,8 millions' → 122800000. "
                "Convertis toutes les unités en euros."
            )
        ),
        Number(
            id="recettes",
            description=(
                "Recettes totales annuelles en euros. "
                "Peut être mentionné comme 'recettes', 'recettes totales', 'revenus', 'produits'. "
                "Exemples: '128 200 000 euros' → 128200000, '128,2 millions' → 128200000. "
                "Convertis toutes les unités en euros."
            )
        ),
        Number(
            id="taux_occupation",
            description=(
                "Taux d'occupation des lits exprimé en pourcentage. "
                "Peut être mentionné comme 'taux d'occupation', 'occupation', 'taux d'occupation des lits'. "
                "Exemples: '87,5%' → 87.5, '87.5%' → 87.5, '85 pour cent' → 85. "
                "Extrais uniquement le nombre, pas le symbole %."
            )
        ),
        Number(
            id="taux_mortalite",
            description=(
                "Taux de mortalité observé, exprimé en pourcentage ou en nombre absolu. "
                "Peut être mentionné comme 'taux de mortalité', 'mortalité', 'taux de mortalité hospitalière'. "
                "Exemples: '2,3%' → 2.3, '2.3%' → 2.3, '2,3 pour cent' → 2.3. "
                "Si exprimé en nombre absolu, convertis en pourcentage si possible, sinon garde le nombre absolu."
            )
        ),
        Number(
            id="taux_satisfaction",
            description=(
                "Taux de satisfaction des patients exprimé en pourcentage ou sur une échelle. "
                "Peut être mentionné comme 'taux de satisfaction', 'satisfaction', 'satisfaction des patients'. "
                "Exemples: '84%' → 84, '4,2/5' → 84 (convertis en %: 4.2/5 * 100), '4.2 sur 5' → 84. "
                "Si exprimé sur une échelle (ex: /5, /10), convertis en pourcentage."
            )
        ),
        Number(
            id="document_id",
            description=(
                "Référence vers le document source. "
                "Si un seul document est analysé, utilise 1. "
                "Si plusieurs documents sont analysés, associe chaque donnée au document approprié."
            )
        ),
        Text(
            id="date_insertion",
            description=(
                "Date d'insertion ou de génération des données si mentionnée. "
                "Format préféré: ISO (YYYY-MM-DD) ou format libre si ISO non disponible. "
                "Exemples: '2024-01-15', '15 janvier 2024', '2024-03-01'. "
                "Si non mentionnée, laisse vide."
            )
        ),
    ],
)

document_schema = Object(
    id="documents",
    description=(
        "Métadonnées sur le ou les documents sources analysés. "
        "Extrais les informations disponibles sur le document lui-même: nom, type, année, source. "
        "Si plusieurs documents sont mentionnés dans le texte, crée un objet pour chacun."
    ),
    many=True,
    attributes=[
        Number(
            id="id_document",
            description=(
                "Identifiant unique numérique du document. "
                "Si un seul document est analysé, utilise 1. "
                "Si plusieurs documents sont mentionnés, numérote-les séquentiellement (1, 2, 3, etc.)."
            )
        ),
        Text(
            id="nom_fichier",
            description=(
                "Nom du fichier source si mentionné dans le document. "
                "Exemples: 'rapport_activite_2023.pdf', 'livret_accueil_2024.pdf', 'donnees_hospitalieres.xlsx'. "
                "Si le nom du fichier n'est pas mentionné dans le texte mais peut être déduit du contexte, utilise cette déduction. "
                "Sinon, laisse vide."
            )
        ),
        Text(
            id="chemin_fichier",
            description=(
                "Chemin d'accès complet du fichier, URL, ou localisation si mentionnée. "
                "Exemples: '/data/rapports/2023.pdf', 'https://www.hopital.fr/rapport.pdf', 'C:\\Documents\\rapport.pdf'. "
                "Si non mentionné, laisse vide."
            )
        ),
        Text(
            id="type_document",
            description=(
                "Type ou nature du document analysé. "
                "Exemples: 'Livret d'accueil', 'Rapport d'activité', 'Rapport annuel', 'Site web', 'PDF', 'Document Word', 'Rapport statistique'. "
                "Extrais le type tel qu'il apparaît dans le document ou déduis-le du contexte (ex: 'livret d'accueil 2024' → 'Livret d'accueil')."
            )
        ),
        Number(
            id="annee_document",
            description=(
                "Année de publication, de rédaction, ou de référence du document. "
                "Exemples: 2024, 2023, 2022. "
                "Extrais l'année même si elle est mentionnée de manière implicite (ex: 'livret 2024' → 2024, 'rapport annuel' dans un document daté → année du document). "
                "Si aucune année n'est mentionnée, laisse vide."
            )
        ),
    ],
)

hospital_dataset_schema = Object(
    id="jeu_donnees_hospitalier",
    description=(
        "Schéma combiné pour l'extraction complète de données hospitalières. "
        "Extrais toutes les informations disponibles dans le document concernant: "
        "les adresses, les accès transports, les services, les hôpitaux, les données statistiques, et les métadonnées du document. "
        "Assure-toi d'extraire TOUTES les informations mentionnées, même si elles sont présentées de manière dispersée dans le texte."
    ),
    attributes=[
        adresse_schema,
        acces_transport_schema,
        service_schema,
        hopital_schema,
        donnees_hospitalieres_schema,
        document_schema,
    ],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ensure_list(value: Any) -> List[Dict[str, Any]]:
    if not value:
        return []
    if isinstance(value, list):
        return value
    return [value]  # type: ignore[list-item]


def parse_extraction_payload(payload: Dict[str, Any]) -> HospitalExtraction:
    """
    Convert the raw Kor output into strongly typed Pydantic models.
    Handles both formats:
    - Direct keys: {"adresses": [...], "services": [...]}
    - Nested under root key: {"jeu_donnees_hospitalier": {"adresses": [...], "services": [...]}}
    """
    import logging
    
    logger = logging.getLogger(__name__)
    
    data = payload or {}
    
    # Debug: log what we received
    logger.debug(f"parse_extraction_payload received payload with keys: {list(data.keys())}")
    
    # Extract data from jeu_donnees_hospitalier if present, otherwise use data directly
    if "jeu_donnees_hospitalier" in data:
        logger.debug("Found 'jeu_donnees_hospitalier' key, extracting nested data")
        nested_data = data["jeu_donnees_hospitalier"]
        if isinstance(nested_data, dict):
            data = nested_data
        else:
            logger.warning(f"'jeu_donnees_hospitalier' is not a dict, it's {type(nested_data)}")
            data = {}
    elif any(key in data for key in ["adresses", "acces_transport", "services", "hopitaux", "donnees_hospitalieres", "documents"]):
        logger.debug("Found direct keys in payload, using data directly")
        # Data is already in the right format
        pass
    else:
        # If data doesn't have expected keys, log what we have
        logger.warning(f"Payload doesn't have expected keys. Available keys: {list(data.keys())}")
        if data:
            logger.warning(f"Payload content (first 1000 chars): {json.dumps(data, indent=2, ensure_ascii=False)[:1000]}")
        # Don't set data to {} yet, let's see if _coerce can handle it

    def _coerce(model, items):
        instances = []
        items_list = _ensure_list(items)
        logger.debug(f"_coerce({model.__name__}): received {len(items_list)} items (type: {type(items)})")
        for idx, item in enumerate(items_list):
            if not item:
                logger.debug(f"_coerce({model.__name__}): skipping empty item at index {idx}")
                continue
            
            # Ensure item is a dict
            if not isinstance(item, dict):
                logger.warning(f"_coerce({model.__name__}): item at index {idx} is not a dict, it's {type(item)}: {item}")
                continue
            
            # Clean the item: convert empty strings and "NULL" to None
            clean_item = {k: (v if v not in ("", "NULL", "null") else None) for k, v in item.items()}
            logger.debug(f"_coerce({model.__name__}): processing item {idx}: {list(clean_item.keys())}")
            try:
                instance = model(**clean_item)
                instances.append(instance)
                logger.debug(f"_coerce({model.__name__}): successfully created instance {idx}")
            except Exception as e:
                # Skip items that can't be coerced to the model
                logger.warning(f"Failed to create {model.__name__} from item {idx}: {e}")
                logger.debug(f"Item data: {clean_item}")
        logger.debug(f"_coerce({model.__name__}): returning {len(instances)} instances")
        return instances

    # Log what we're about to extract
    logger.debug(f"Extracting from data with keys: {list(data.keys())}")
    for key in ["adresses", "acces_transport", "services", "hopitaux", "donnees_hospitalieres", "documents"]:
        value = data.get(key)
        if value:
            logger.debug(f"Found {key}: {type(value)} with {len(value) if isinstance(value, list) else 'non-list'} items")
        else:
            logger.debug(f"Key {key} not found or empty")
    
    adresses = _coerce(Adresse, data.get("adresses", []))
    for adresse in adresses:
        if not adresse.pays:
            adresse.pays = "France"

    donnees = _coerce(DonneesHospitalieres, data.get("donnees_hospitalieres", []))

    result = HospitalExtraction(
        adresses=adresses,
        acces_transport=_coerce(AccesTransport, data.get("acces_transport", [])),
        services=_coerce(Service, data.get("services", [])),
        hopitaux=_coerce(Hopital, data.get("hopitaux", [])),
        donnees_hospitalieres=donnees,
        documents=_coerce(Document, data.get("documents", [])),
    )
    
    logger.debug(f"Final extraction result: {len(result.adresses)} adresses, {len(result.services)} services, {len(result.hopitaux)} hopitaux")
    
    return result