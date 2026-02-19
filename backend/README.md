# Kairos WebScan Backend

Backend FastAPI pour gérer les profils de scan.

## Installation

1. Créer un environnement virtuel :
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

## Lancer le serveur

```bash
python run.py
```

Ou avec uvicorn directement :
```bash
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Profils de Scan

- `GET /scan-profiles/` - Liste tous les profils
- `GET /scan-profiles/{id}` - Récupère un profil
- `POST /scan-profiles/` - Crée un nouveau profil
- `PUT /scan-profiles/{id}` - Met à jour un profil
- `DELETE /scan-profiles/{id}` - Supprime un profil

### Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Base de données

Par défaut, utilise SQLite (`kairos_webscan.db`). Pour changer de base de données :

Modifiez `backend/.env` :
```
DATABASE_URL=postgresql://user:password@localhost/dbname
```

## Structure du Projet

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application FastAPI
│   ├── database.py          # Configuration BDD
│   ├── models/
│   │   ├── __init__.py
│   │   ├── models.py        # Modèles SQLAlchemy
│   │   └── schemas.py       # Schémas Pydantic
│   └── routers/
│       ├── __init__.py
│       └── scan_profiles.py # Routes profils de scan
├── requirements.txt
├── run.py
└── .env
```


 venv/bin/celery -A celery_worker worker --loglevel=info
