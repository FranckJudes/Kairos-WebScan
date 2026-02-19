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
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=(env == "development"),
        log_level="info",
        timeout_keep_alive=300,  
    )
