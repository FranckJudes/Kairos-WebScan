from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from starlette.requests import Request
import os

from .database import engine, Base, get_db
from .routers import scan_profiles_router
from .routers import proxy as proxy_router
from .routers import typology as typology_router
from .routers import websocket as websocket_router
from .routers import classification as classification_router
from .routers import documents as documents_router
from .routers import upload as upload_router
from .routers import bannettes as bannettes_router
from .cache import init_cache
from .websocket import init_websocket

# Créer les tables de la base de données
Base.metadata.create_all(bind=engine)

# Créer le dossier uploads s'il n'existe pas
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Créer l'application FastAPI
app = FastAPI(
    title="Kairos WebScan API",
    description="API pour gérer les profils de scan et les opérations de numérisation",
    version="1.0.0"
)

# Configuration CORS pour permettre les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Inclure les routers
app.include_router(scan_profiles_router)
app.include_router(proxy_router.router)
app.include_router(typology_router.router)
app.include_router(websocket_router.router)
app.include_router(classification_router.router)
app.include_router(documents_router.router)
app.include_router(upload_router.router)
app.include_router(bannettes_router.router)

# Route personnalisée pour servir les fichiers uploads avec CORS
@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Servir les fichiers uploadés avec support CORS"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    # Déterminer le type de média
    media_type = "application/pdf" if filename.endswith('.pdf') else "application/octet-stream"
    
    # Créer la réponse avec headers CORS explicites
    response = FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Cross-Origin-Embedder-Policy": "require-corp"
        }
    )
    return response


# Route racine
@app.get("/")
def read_root():
    return {
        "message": "Kairos WebScan API",
        "version": "1.0.0",
        "docs": "/docs",
        "profiles": "/scan-profiles/",
        "websocket": "/ws",
        "features": {
            "redis_cache": True,
            "websocket": True,
            "classification": True
        }
    }


# Route de santé
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "cache": "enabled" if init_cache().is_available() else "disabled",
        "websocket": "enabled"
    }


# Profil par défaut si aucun n'existe
@app.on_event("startup")
async def startup_event():
    # Initialiser le gestionnaire WebSocket
    init_websocket()
    print("✅ Gestionnaire WebSocket initialisé")

    # Initialiser le cache Redis
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", "6379"))
    redis_db = int(os.getenv("REDIS_DB", "0"))
    redis_password = os.getenv("REDIS_PASSWORD", None)

    cache = init_cache(
        host=redis_host,
        port=redis_port,
        db=redis_db,
        password=redis_password
    )

    if cache.is_available():
        print("✅ Cache Redis connecté")
    else:
        print("⚠️ Cache Redis non disponible (le serveur fonctionnera sans cache)")

    # Initialiser les données par défaut
    db: Session = next(get_db())
    from .models.models import ScanProfile
    from .models.typology import DocumentType, INITIAL_TYPOLOGY

    # Vérifier s'il y a des profils
    profiles_count = db.query(ScanProfile).count()

    if profiles_count == 0:
        # Créer un profil par défaut
        default_profile = ScanProfile(
            libele="Standard",
            paper_size="A4",
            horizontal_align="center",
            resolution=300,
            scale="100%",
            brightness=50,
            contrast=50,
            blank_page="0",
            sensibility="Auto",
            default="1"
        )
        db.add(default_profile)
        db.commit()
        print("✅ Profil de scan 'Standard' créé par défaut")
    else:
        print(f"✅ {profiles_count} profil(s) de scan trouvé(s)")

    # Initialiser la typologie si elle n'existe pas
    typology_count = db.query(DocumentType).count()
    if typology_count == 0:
        for type_data in INITIAL_TYPOLOGY:
            doc_type = DocumentType(**type_data)
            db.add(doc_type)
        db.commit()
        print(f"✅ Typologie initialisée avec {len(INITIAL_TYPOLOGY)} types de documents")
    else:
        print(f"✅ {typology_count} type(s) de document trouvé(s)")
