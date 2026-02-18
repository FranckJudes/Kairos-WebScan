"""
Modèles pour la typologie des documents avec MongoDB/Beanie
"""
from typing import Optional, List
from datetime import datetime
from beanie import Document, Indexed


class DocumentType(Document):
    """Modèle pour les types de documents (typologie)"""

    # Champs principaux
    name: str
    code: str  # Code unique pour le type
    description: Optional[str] = None
    icon: str = "folder"  # Material icon name
    parent_id: Optional[str] = None  # ObjectId du parent en string
    order: int = 0  # Ordre d'affichage
    is_active: bool = True

    # Dates
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "document_types"
        indexes = [
            "code",
            "parent_id",
            "order",
        ]


# Données initiales pour la typologie
INITIAL_TYPOLOGY = [
    {
        "name": "Documents Administratifs",
        "code": "ADMIN",
        "description": "Documents administratifs généraux",
        "icon": "folder_open",
        "parent_id": None,
        "order": 1
    },
    {
        "name": "Pièces d'Identité",
        "code": "IDENTITY",
        "description": "Cartes d'identité, passeports, permis",
        "icon": "badge",
        "parent_id": None,
        "order": 2
    },
    {
        "name": "Carte d'Identité Nationale",
        "code": "CIN",
        "description": "Carte d'identité nationale",
        "icon": "credit_card",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 1
    },
    {
        "name": "Passeport",
        "code": "PASSPORT",
        "description": "Passeport",
        "icon": "book",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 2
    },
    {
        "name": "Permis de Conduire",
        "code": "DRIVER_LICENSE",
        "description": "Permis de conduire",
        "icon": "directions_car",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 3
    },
    {
        "name": "Documents Financiers",
        "code": "FINANCIAL",
        "description": "Factures, relevés, justificatifs",
        "icon": "account_balance",
        "parent_id": None,
        "order": 3
    },
    {
        "name": "Factures",
        "code": "INVOICES",
        "description": "Factures et bons de commande",
        "icon": "receipt",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 1
    },
    {
        "name": "Facture d'Électricité",
        "code": "ELEC_INVOICE",
        "description": "Facture d'électricité",
        "icon": "bolt",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 1
    },
    {
        "name": "Facture d'Eau",
        "code": "WATER_INVOICE",
        "description": "Facture d'eau",
        "icon": "water_drop",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 2
    },
    {
        "name": "Facture Internet/Téléphone",
        "code": "TEL_INVOICE",
        "description": "Facture internet ou téléphone",
        "icon": "phone",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 3
    },
    {
        "name": "Relevés Bancaires",
        "code": "BANK_STATEMENTS",
        "description": "Relevés de compte bancaire",
        "icon": "account_balance_wallet",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 2
    },
    {
        "name": "Documents Juridiques",
        "code": "LEGAL",
        "description": "Contrats, actes, documents juridiques",
        "icon": "gavel",
        "parent_id": None,
        "order": 4
    },
    {
        "name": "Contrats",
        "code": "CONTRACTS",
        "description": "Contrats divers",
        "icon": "description",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 1
    },
    {
        "name": "Contrat de Location",
        "code": "RENTAL_CONTRACT",
        "description": "Bail ou contrat de location",
        "icon": "home",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 1
    },
    {
        "name": "Contrat de Travail",
        "code": "EMPLOYMENT_CONTRACT",
        "description": "Contrat de travail",
        "icon": "work",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 2
    },
    {
        "name": "Documents Médicaux",
        "code": "MEDICAL",
        "description": "Documents de santé et médicaux",
        "icon": "medical_services",
        "parent_id": None,
        "order": 5
    },
    {
        "name": "Ordonnances",
        "code": "PRESCRIPTIONS",
        "description": "Ordonnances médicales",
        "icon": "medication",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 1
    },
    {
        "name": "Résultats d'Analyses",
        "code": "LAB_RESULTS",
        "description": "Résultats d'analyses médicales",
        "icon": "biotech",
        "parent_id": None,  # Sera mis à jour après insertion
        "order": 2
    },
    {
        "name": "Autres Documents",
        "code": "OTHERS",
        "description": "Autres types de documents",
        "icon": "folder",
        "parent_id": None,
        "order": 6
    }
]
