-- Schema SQL pour la base `hospital_data_extraction`
-- Créez la base, puis exécutez ce script :
--   CREATE DATABASE hospital_data_extraction CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE hospital_data_extraction;

CREATE TABLE IF NOT EXISTS extractions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_filename VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hopitaux_count INT DEFAULT 0,
    services_count INT DEFAULT 0,
    adresses_count INT DEFAULT 0,
    donnees_count INT DEFAULT 0,
    documents_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS adresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    extraction_id INT NOT NULL,
    original_id INT NULL,
    numero VARCHAR(50),
    rue VARCHAR(255),
    code_postal VARCHAR(20),
    commune VARCHAR(255),
    ville VARCHAR(255),
    region VARCHAR(255),
    pays VARCHAR(100),
    FOREIGN KEY (extraction_id) REFERENCES extractions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hopitaux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    extraction_id INT NOT NULL,
    original_id INT NULL,
    nom VARCHAR(255),
    id_adresse INT NULL,
    type_etablissement VARCHAR(100),
    statut VARCHAR(100),
    nb_lits INT,
    nb_personnel INT,
    nb_place INT,
    FOREIGN KEY (extraction_id) REFERENCES extractions(id) ON DELETE CASCADE,
    FOREIGN KEY (id_adresse) REFERENCES adresses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS acces_transport (
    id INT AUTO_INCREMENT PRIMARY KEY,
    extraction_id INT NOT NULL,
    original_id INT NULL,
    type_transport VARCHAR(50),
    ligne VARCHAR(50),
    arret VARCHAR(255),
    FOREIGN KEY (extraction_id) REFERENCES extractions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    extraction_id INT NOT NULL,
    original_id INT NULL,
    nom_service VARCHAR(255),
    type_service VARCHAR(100),
    description TEXT,
    capacite INT,
    code_service VARCHAR(100),
    telephone VARCHAR(50),
    email VARCHAR(255),
    hopital_original_id INT NULL,
    FOREIGN KEY (extraction_id) REFERENCES extractions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS donnees_hospitalieres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    extraction_id INT NOT NULL,
    original_id INT NULL,
    hopital_original_id INT NULL,
    annee INT,
    nb_patients INT,
    nb_admissions INT,
    budget_total DECIMAL(15,2),
    depenses DECIMAL(15,2),
    recettes DECIMAL(15,2),
    taux_occupation DECIMAL(6,2),
    taux_mortalite DECIMAL(6,2),
    taux_satisfaction DECIMAL(6,2),
    document_original_id INT NULL,
    date_insertion VARCHAR(50),
    FOREIGN KEY (extraction_id) REFERENCES extractions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    extraction_id INT NOT NULL,
    original_id INT NULL,
    nom_fichier VARCHAR(255),
    chemin_fichier TEXT,
    type_document VARCHAR(100),
    annee_document INT,
    FOREIGN KEY (extraction_id) REFERENCES extractions(id) ON DELETE CASCADE
);

