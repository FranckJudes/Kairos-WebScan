#!/usr/bin/env python3
"""
Script pour démarrer le serveur FastAPI
"""
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    env = os.getenv("ENVIRONMENT", "development")

    print(f"🚀 Démarrage du serveur Kairos WebScan sur le port {port}...")
    print(f"📚 Documentation: http://localhost:{port}/docs")
    print(f"💚 Health: http://localhost:{port}/health")
    print(f"📊 Profils: http://localhost:{port}/scan-profiles/")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=(env == "development"),
        log_level="info"
    )
