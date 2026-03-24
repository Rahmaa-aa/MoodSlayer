"""
MoodSlayer ML Service — Configuration
Reads from environment variables (.env or Railway/Render env).
"""

import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/mood_tracker")
DB_NAME = os.getenv("DB_NAME", "mood_tracker")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
