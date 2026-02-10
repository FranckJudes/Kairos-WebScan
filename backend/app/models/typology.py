from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class DocumentType(Base):
    """Modèle pour les types de documents (typologie)"""
    __tablename__ = "document_types"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)  # Code unique pour le type
    description = Column(String(500), nullable=True)
    icon = Column(String(50), default="folder")  # Material icon name
    parent_id = Column(Integer, ForeignKey("document_types.id"), nullable=True)
    order = Column(Integer, default=0)  # Ordre d'affichage
    is_active = Column(Boolean, default=True)

    # Relation parent-enfant pour la structure hiérarchique
    children = relationship("DocumentType", backref="parent", remote_side=[id])


# Jeu de données initial pour la typologie
INITIAL_TYPOLOGY = [
    {
        "id": 1,
        "name": "Documents Administratifs",
        "code": "ADMIN",
        "description": "Documents administratifs généraux",
        "icon": "folder_open",
        "parent_id": None,
        "order": 1
    },
    {
        "id": 2,
        "name": "Pièces d'Identité",
        "code": "IDENTITY",
        "description": "Cartes d'identité, passeports, permis",
        "icon": "badge",
        "parent_id": 1,
        "order": 1
    },
    {
        "id": 3,
        "name": "Carte d'Identité Nationale",
        "code": "CIN",
        "description": "Carte d'identité nationale",
        "icon": "credit_card",
        "parent_id": 2,
        "order": 1
    },
    {
        "id": 4,
        "name": "Passeport",
        "code": "PASSPORT",
        "description": "Passeport",
        "icon": "book",
        "parent_id": 2,
        "order": 2
    },
    {
        "id": 5,
        "name": "Permis de Conduire",
        "code": "DRIVER_LICENSE",
        "description": "Permis de conduire",
        "icon": "directions_car",
        "parent_id": 2,
        "order": 3
    },
    {
        "id": 6,
        "name": "Documents Financiers",
        "code": "FINANCIAL",
        "description": "Factures, relevés, justificatifs",
        "icon": "account_balance",
        "parent_id": None,
        "order": 2
    },
    {
        "id": 7,
        "name": "Factures",
        "code": "INVOICES",
        "description": "Factures et bons de commande",
        "icon": "receipt",
        "parent_id": 6,
        "order": 1
    },
    {
        "id": 8,
        "name": "Facture d'Électricité",
        "code": "ELEC_INVOICE",
        "description": "Facture d'électricité",
        "icon": "bolt",
        "parent_id": 7,
        "order": 1
    },
    {
        "id": 9,
        "name": "Facture d'Eau",
        "code": "WATER_INVOICE",
        "description": "Facture d'eau",
        "icon": "water_drop",
        "parent_id": 7,
        "order": 2
    },
    {
        "id": 10,
        "name": "Facture Internet/Téléphone",
        "code": "TEL_INVOICE",
        "description": "Facture internet ou téléphone",
        "icon": "phone",
        "parent_id": 7,
        "order": 3
    },
    {
        "id": 11,
        "name": "Relevés Bancaires",
        "code": "BANK_STATEMENTS",
        "description": "Relevés de compte bancaire",
        "icon": "account_balance_wallet",
        "parent_id": 6,
        "order": 2
    },
    {
        "id": 12,
        "name": "Documents Juridiques",
        "code": "LEGAL",
        "description": "Contrats, actes, documents juridiques",
        "icon": "gavel",
        "parent_id": None,
        "order": 3
    },
    {
        "id": 13,
        "name": "Contrats",
        "code": "CONTRACTS",
        "description": "Contrats divers",
        "icon": "description",
        "parent_id": 12,
        "order": 1
    },
    {
        "id": 14,
        "name": "Contrat de Location",
        "code": "RENTAL_CONTRACT",
        "description": "Bail ou contrat de location",
        "icon": "home",
        "parent_id": 13,
        "order": 1
    },
    {
        "id": 15,
        "name": "Contrat de Travail",
        "code": "EMPLOYMENT_CONTRACT",
        "description": "Contrat de travail",
        "icon": "work",
        "parent_id": 13,
        "order": 2
    },
    {
        "id": 16,
        "name": "Documents Médicaux",
        "code": "MEDICAL",
        "description": "Documents de santé et médicaux",
        "icon": "medical_services",
        "parent_id": None,
        "order": 4
    },
    {
        "id": 17,
        "name": "Ordonnances",
        "code": "PRESCRIPTIONS",
        "description": "Ordonnances médicales",
        "icon": "medication",
        "parent_id": 16,
        "order": 1
    },
    {
        "id": 18,
        "name": "Résultats d'Analyses",
        "code": "LAB_RESULTS",
        "description": "Résultats d'analyses médicales",
        "icon": "biotech",
        "parent_id": 16,
        "order": 2
    },
    {
        "id": 19,
        "name": "Autres Documents",
        "code": "OTHERS",
        "description": "Autres types de documents",
        "icon": "folder",
        "parent_id": None,
        "order": 5
    }
]
