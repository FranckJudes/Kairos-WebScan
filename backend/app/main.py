from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
import os

from beanie import init_beanie
from .database import connect_to_mongo, close_mongo_connection, get_mongo_client
from .models.mongo_models import User, License, RecentDocument, ScanProfile, DocumentModel, BannetteModel
from .models.typology_mongo import DocumentType, INITIAL_TYPOLOGY
from .routers import scan_profiles_router
from .routers import proxy as proxy_router
from .routers import typology as typology_router
from .routers import websocket as websocket_router
from .routers import auth as auth_router
from .routers import documents as documents_router
from .routers import bannettes as bannettes_router
from .cache import init_cache
from .websocket import init_websocket
from .redis_listener import start_redis_listener, stop_redis_listener

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Kairos WebScan API",
    description="API pour gérer les profils de scan et les opérations de numérisation",
    version="1.0.0"
)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("JWT_SECRET_KEY", "votre-clé-secrète-par-défaut-à-changer"),
    session_cookie="kairos_session",
)

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
app.include_router(auth_router.router)
app.include_router(proxy_router.router)
app.include_router(typology_router.router)
app.include_router(websocket_router.router)
app.include_router(documents_router.router)
app.include_router(bannettes_router.router)


# ==================== EVENTS ====================

@app.on_event("startup")
async def startup_event():
    """Initialisation au démarrage de l'application"""
    
    await connect_to_mongo()
    client = get_mongo_client()

    await init_beanie(
        database=client.get_default_database(),
        document_models=[
            User,
            License,
            RecentDocument,
            ScanProfile,
            DocumentType,
            DocumentModel,
            BannetteModel
        ]
    )

    # Initialiser le gestionnaire WebSocket
    init_websocket()

    # Démarrer le listener Redis pour les mises à jour en temps réel
    await start_redis_listener()

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
        print("Cache Redis connecté")
    else:
        print("Cache Redis non disponible (le serveur fonctionnera sans cache)")

    profiles_count = await ScanProfile.count()

    if profiles_count == 0:
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
        await default_profile.insert()
    else:
        print(f"{profiles_count} profil(s) de scan trouvé(s)")

    typology_count = await DocumentType.count()
    if typology_count == 0:
        created_types = {}
        for type_data in INITIAL_TYPOLOGY:
            if type_data["parent_id"] is None:
                doc_type = DocumentType(**type_data)
                await doc_type.insert()
                created_types[type_data["code"]] = doc_type

        for type_data in INITIAL_TYPOLOGY:
            if type_data["parent_id"] is not None:
                # Trouver le parent par code
                parent_code = None
                if type_data["code"] in ["CIN", "PASSPORT", "DRIVER_LICENSE"]:
                    parent_code = "IDENTITY"
                elif type_data["code"] in ["ELEC_INVOICE", "WATER_INVOICE", "TEL_INVOICE"]:
                    parent_code = "INVOICES"
                elif type_data["code"] == "INVOICES":
                    parent_code = "FINANCIAL"
                elif type_data["code"] == "BANK_STATEMENTS":
                    parent_code = "FINANCIAL"
                elif type_data["code"] in ["RENTAL_CONTRACT", "EMPLOYMENT_CONTRACT"]:
                    parent_code = "CONTRACTS"
                elif type_data["code"] == "CONTRACTS":
                    parent_code = "LEGAL"
                elif type_data["code"] in ["PRESCRIPTIONS", "LAB_RESULTS"]:
                    parent_code = "MEDICAL"

                if parent_code and parent_code in created_types:
                    type_data["parent_id"] = str(created_types[parent_code].id)

                doc_type = DocumentType(**type_data)
                await doc_type.insert()

    else:
        print(f"✅ {typology_count} type(s) de document trouvé(s)")


@app.on_event("shutdown")
async def shutdown_event():
    """Fermeture des connexions"""
    await stop_redis_listener()
    await close_mongo_connection()



@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Servir les fichiers uploadés avec support CORS"""
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    # Détecter le type MIME correct pour éviter ORB
    import mimetypes
    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        # Fallback basé sur l'extension
        if filename.endswith('.pdf'):
            media_type = "application/pdf"
        elif filename.endswith(('.jpg', '.jpeg')):
            media_type = "image/jpeg"
        elif filename.endswith('.png'):
            media_type = "image/png"
        elif filename.endswith('.tiff', '.tif'):
            media_type = "image/tiff"
        elif filename.endswith('.bmp'):
            media_type = "image/bmp"
        elif filename.endswith('.webp'):
            media_type = "image/webp"
        else:
            media_type = "application/octet-stream"

    response = FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cross-Origin-Resource-Policy": "cross-origin"
        }
    )
    return response


@app.get("/uploads/pages/{document_id}/{filename}")
async def get_page_image(document_id: str, filename: str):
    """Servir les pages extraites des documents"""
    file_path = os.path.join(UPLOAD_DIR, "pages", document_id, filename)
    if not os.path.exists(file_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Page non trouvée")

    # Détecter le type MIME
    import mimetypes
    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        if filename.endswith(('.jpg', '.jpeg')):
            media_type = "image/jpeg"
        elif filename.endswith('.png'):
            media_type = "image/png"
        else:
            media_type = "image/jpeg"

    response = FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cross-Origin-Resource-Policy": "cross-origin"
        }
    )
    return response


@app.get("/")
def read_root():
    return {
        "message": "Kairos WebScan API",
        "version": "1.0.0",
        "database": "MongoDB",
        "docs": "/docs",
        "profiles": "/scan-profiles/",
        "websocket": "/ws",
        "features": {
            "mongodb": True,
            "redis_cache": True,
            "websocket": True,
            "classification": True
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "MongoDB",
        "cache": "enabled" if init_cache().is_available() else "disabled",
        "websocket": "enabled"
    }
