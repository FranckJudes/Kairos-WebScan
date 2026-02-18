"""
Configuration de la base de données MongoDB avec Motor et Beanie ODM
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv
from typing import AsyncGenerator

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/kairos_webscan")

client: AsyncIOMotorClient = None


async def connect_to_mongo():
    """
    Établit la connexion à MongoDB et initialise Beanie
    """
    global client

    client = AsyncIOMotorClient(MONGODB_URL)
    await init_beanie(
        database=client.get_default_database(),
        document_models=[]
    )

    try:
        await client.admin.command('ping')
    except Exception as e:
        raise


async def close_mongo_connection():
    """
    Ferme la connexion à MongoDB
    """
    global client
    if client:
        client.close()


async def get_database():
    """
    Retourne l'instance de la base de données

    Returns:
        Database: Instance MongoDB
    """
    if not client:
        await connect_to_mongo()

    return client.get_default_database()


def get_mongo_client():
    """
    Retourne le client MongoDB

    Returns:
        AsyncIOMotorClient: Client MongoDB
    """
    return client
