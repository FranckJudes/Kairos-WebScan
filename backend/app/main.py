from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import engine, Base, get_db
from .routers import scan_profiles_router
from .routers import proxy as proxy_router

# Créer les tables de la base de données
Base.metadata.create_all(bind=engine)

# Créer l'application FastAPI
app = FastAPI(
    title="Kairos WebScan API",
    description="API pour gérer les profils de scan et les opérations de numérisation",
    version="1.0.0"
)

# Configuration CORS pour permettre les requêtes du frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routers
app.include_router(scan_profiles_router)
app.include_router(proxy_router.router)


# Route racine
@app.get("/")
def read_root():
    return {
        "message": "Kairos WebScan API",
        "version": "1.0.0",
        "docs": "/docs",
        "profiles": "/scan-profiles/"
    }


# Route de santé
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Profil par défaut si aucun n'existe
@app.on_event("startup")
async def startup_event():
    db: Session = next(get_db())
    from .models.models import ScanProfile

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
