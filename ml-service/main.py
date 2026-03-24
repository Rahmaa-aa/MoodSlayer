"""
MoodSlayer ML Service — FastAPI Entry Point

Endpoints:
  POST /predict   — Mood prediction + SHAP explanations
  POST /train     — Trigger model retrain for a user
  GET  /insights  — Correlations & archetype
  GET  /health    — Service readiness check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from pymongo import MongoClient
from bson import ObjectId

import config
from pipeline.predictor import get_prediction
from pipeline.trainer import train_user_model

# ─── App Setup ───────────────────────────────────────────────
app = FastAPI(
    title="MoodSlayer ML Service",
    version="1.0.0",
    description="Per-user mood prediction with SHAP explainability"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── MongoDB Connection ─────────────────────────────────────
client = MongoClient(config.MONGODB_URI)
db = client[config.DB_NAME]


# ─── Request / Response Models ───────────────────────────────
class UserRequest(BaseModel):
    userId: str


class TrainResponse(BaseModel):
    status: str
    modelVersion: Optional[int] = None
    f1Score: Optional[float] = None
    dataPointsUsed: Optional[int] = None
    tier: Optional[str] = None
    warnings: list[str] = []


class PredictResponse(BaseModel):
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    tier: str
    probabilities: Optional[dict] = None
    explanations: Optional[dict] = None
    progress: Optional[dict] = None
    message: Optional[str] = None
    tip: Optional[str] = None
    modelVersion: Optional[int] = None
    dataPointsUsed: Optional[int] = None
    cycleDay: Optional[int] = None
    cyclePhase: Optional[str] = None


# ─── Routes ──────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Service readiness check."""
    try:
        client.admin.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}


@app.post("/train", response_model=TrainResponse)
async def train(req: UserRequest):
    """Trigger model retraining for a specific user."""
    try:
        result = train_user_model(db, req.userId)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.post("/predict", response_model=PredictResponse)
async def predict(req: UserRequest):
    """Get mood prediction + SHAP explanations for a user."""
    try:
        result = get_prediction(db, req.userId)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/insights")
async def insights(userId: str):
    """Get correlations and archetype for a user."""
    try:
        from pipeline.predictor import get_insights
        result = get_insights(db, userId)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insights failed: {str(e)}")


# ─── Run ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=config.PORT, reload=True)
