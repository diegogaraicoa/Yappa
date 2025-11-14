"""
Main module - Database singleton
"""
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection singleton
_client = None
_db = None

def get_database():
    """Get database instance"""
    global _client, _db
    
    if _db is None:
        mongo_url = os.environ['MONGO_URL']
        _client = AsyncIOMotorClient(mongo_url)
        _db = _client[os.environ.get('DB_NAME', 'test_database')]
    
    return _db
