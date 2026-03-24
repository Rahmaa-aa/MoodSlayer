"""
MoodSlayer — Predictor

Handles the 4-tier progressive unlock system:
  COLD_START    (0-4 entries):  Rule-based tips
  EARLY_SIGNAL  (5-14):        Simple correlations
  WARM_UP       (15-29):       Correlations + low-confidence preview
  ML_READY      (30+):         Full prediction + SHAP explanations

Also provides insights (correlations & basic stats).
"""

import numpy as np
import pandas as pd
import joblib
import io
from datetime import datetime, timezone
from bson import ObjectId

from pipeline.preprocessor import clean_entries
from pipeline.feature_engineer import (
    engineer_temporal_features,
    add_lag_features,
    get_feature_names,
)
from pipeline.explainer import explain_prediction


def get_prediction(db, user_id: str) -> dict:
    """
    Get mood prediction for a user, adapted to their data tier.

    Args:
        db: PyMongo database instance
        user_id: MongoDB user ID string

    Returns:
        Prediction result dict (matches PredictResponse model)
    """
    # ── Fetch user profile ──
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValueError(f"User {user_id} not found")

    user_profile = {
        "tracksCycle": user.get("tracksCycle", False),
        "lastPeriodStart": user.get("lastPeriodStart"),
        "cycleLength": user.get("cycleLength", 28),
    }

    # ── Fetch entries ──
    entries = list(db.entries.find({"userId": user_id}).sort("date", 1))
    entry_count = len(entries)
    tier = _get_tier(entry_count)

    # ── Cycle info (if tracking) ──
    cycle_day = None
    cycle_phase = None
    if user_profile.get("tracksCycle") and user_profile.get("lastPeriodStart"):
        cycle_day, cycle_phase = _get_current_cycle_info(user_profile)

    # ── Tier-based response ──
    progress = {
        "current": entry_count,
        "target": 30,
        "percent": min(100, round(entry_count / 30 * 100)),
    }

    if tier == "COLD_START":
        return _cold_start_response(entry_count, progress, cycle_day, cycle_phase)

    # Fetch trackables for data processing
    trackables = list(db.trackables.find({"userId": user_id}))
    if not trackables:
        trackables = list(db.trackables.find({"userId": {"$exists": False}}))

    df = clean_entries(entries, trackables)
    if df.empty or "mood" not in df.columns:
        return _cold_start_response(entry_count, progress, cycle_day, cycle_phase)

    df = df.dropna(subset=["mood"])

    if tier == "EARLY_SIGNAL":
        correlations = _compute_correlations(df, trackables)
        return {
            "prediction": None,
            "confidence": None,
            "tier": tier,
            "progress": progress,
            "message": "📊 Early patterns emerging! Keep logging to unlock predictions.",
            "tip": _generate_correlation_tip(correlations),
            "dataPointsUsed": len(df),
            "cycleDay": cycle_day,
            "cyclePhase": cycle_phase,
        }

    if tier == "WARM_UP":
        correlations = _compute_correlations(df, trackables)
        return {
            "prediction": None,
            "confidence": None,
            "tier": tier,
            "progress": progress,
            "message": "🔮 Your Oracle is warming up... almost ready for full predictions!",
            "tip": _generate_correlation_tip(correlations),
            "dataPointsUsed": len(df),
            "cycleDay": cycle_day,
            "cyclePhase": cycle_phase,
        }

    # ── ML_READY: Load model and predict ──
    return _ml_predict(db, user_id, user_profile, df, trackables,
                       entry_count, progress, cycle_day, cycle_phase)


def _ml_predict(db, user_id, user_profile, df, trackables,
                entry_count, progress, cycle_day, cycle_phase) -> dict:
    """Full ML prediction with SHAP explanations."""

    # Load model from GridFS
    metadata = db.ml_model_metadata.find_one({"userId": user_id})
    if not metadata or not metadata.get("modelBlobId"):
        return {
            "prediction": None,
            "confidence": None,
            "tier": "ML_READY",
            "progress": progress,
            "message": "⚡ Ready for predictions! Training your Oracle now...",
            "tip": "Your model hasn't been trained yet. It will train automatically.",
            "dataPointsUsed": entry_count,
            "cycleDay": cycle_day,
            "cyclePhase": cycle_phase,
        }

    # Deserialize model
    from gridfs import GridFS
    fs = GridFS(db, collection="ml_models")

    try:
        model_blob = fs.get(metadata["modelBlobId"])
        model = joblib.load(io.BytesIO(model_blob.read()))
    except Exception as e:
        return {
            "prediction": None,
            "confidence": None,
            "tier": "ML_READY",
            "message": f"Oracle is recharging 🔮",
            "tip": "Model loading failed. It will retrain automatically.",
            "dataPointsUsed": entry_count,
            "cycleDay": cycle_day,
            "cyclePhase": cycle_phase,
        }

    # Prepare latest entry for prediction
    user_profile["_available_columns"] = list(df.columns)
    df = engineer_temporal_features(df, user_profile)
    df = add_lag_features(df, mood_col="mood")

    # Get the feature columns from metadata
    feature_names = metadata.get("featureNames", [])
    available = [f for f in feature_names if f in df.columns]

    if not available:
        return {
            "prediction": None,
            "tier": "ML_READY",
            "message": "Feature mismatch — retrain needed.",
            "dataPointsUsed": entry_count,
            "cycleDay": cycle_day,
            "cyclePhase": cycle_phase,
        }

    # Use last row as "today" — predict tomorrow's mood based on today
    X_latest = df[available].iloc[[-1]]

    try:
        prediction_proba = model.predict_proba(X_latest)[0]
        prediction_label = model.predict(X_latest)[0]
        classes = list(model.classes_)

        # Build probability dict
        probabilities = {
            c: round(float(p), 4)
            for c, p in zip(classes, prediction_proba)
        }

        # Confidence = probability of predicted class
        confidence = float(max(prediction_proba))

        # SHAP explanations
        predicted_idx = classes.index(prediction_label)

        # Get preprocessed X for SHAP
        preprocessor = model.named_steps.get("preprocessor")
        if preprocessor:
            X_processed = preprocessor.transform(X_latest)
            # Get transformed feature names
            explanations = explain_prediction(
                model, X_processed, available, predicted_idx, top_n=5
            )
        else:
            explanations = {}

        return {
            "prediction": prediction_label,
            "confidence": round(confidence, 3),
            "tier": "ML_READY",
            "probabilities": probabilities,
            "explanations": explanations,
            "modelVersion": metadata.get("modelVersion"),
            "dataPointsUsed": entry_count,
            "cycleDay": cycle_day,
            "cyclePhase": cycle_phase,
        }

    except Exception as e:
        return {
            "prediction": None,
            "confidence": None,
            "tier": "ML_READY",
            "message": f"Prediction error — retrain may fix this.",
            "dataPointsUsed": entry_count,
            "cycleDay": cycle_day,
            "cyclePhase": cycle_phase,
        }


def get_insights(db, user_id: str) -> dict:
    """
    Get correlations and basic stats for a user.
    Available from EARLY_SIGNAL tier (5+ entries).
    """
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValueError(f"User {user_id} not found")

    entries = list(db.entries.find({"userId": user_id}).sort("date", 1))
    if len(entries) < 5:
        return {"correlations": [], "message": "Need at least 5 entries for insights."}

    trackables = list(db.trackables.find({"userId": user_id}))
    if not trackables:
        trackables = list(db.trackables.find({"userId": {"$exists": False}}))

    df = clean_entries(entries, trackables)
    if df.empty or "mood" not in df.columns:
        return {"correlations": [], "message": "No mood data available."}

    correlations = _compute_correlations(df, trackables)

    # Mood distribution
    mood_counts = df["mood"].value_counts().to_dict()
    total = sum(mood_counts.values())
    mood_distribution = {k: round(v / total, 3) for k, v in mood_counts.items()}

    return {
        "correlations": correlations,
        "moodDistribution": mood_distribution,
        "totalEntries": len(df),
        "dateRange": {
            "start": str(df["date"].min().date()) if not df.empty else None,
            "end": str(df["date"].max().date()) if not df.empty else None,
        },
    }


# ─── Helper Functions ────────────────────────────────────────

def _get_tier(entry_count: int) -> str:
    if entry_count < 5:
        return "COLD_START"
    elif entry_count < 15:
        return "EARLY_SIGNAL"
    elif entry_count < 30:
        return "WARM_UP"
    return "ML_READY"


def _cold_start_response(entry_count, progress, cycle_day, cycle_phase) -> dict:
    messages = {
        0: "Start logging to awaken your Oracle 🌱",
        1: "First entry logged! Keep going...",
        2: "2 days tracked — patterns need more data 📊",
        3: "Day 3! Your Oracle is listening... 👁️",
        4: "Almost at the first milestone (5 days)! 🚀",
    }
    return {
        "prediction": None,
        "confidence": None,
        "tier": "COLD_START",
        "progress": progress,
        "message": messages.get(entry_count, "Keep logging! 🌱"),
        "tip": "Consistency is key — log every day to unlock predictions faster.",
        "dataPointsUsed": entry_count,
        "cycleDay": cycle_day,
        "cyclePhase": cycle_phase,
    }


def _get_current_cycle_info(user_profile: dict) -> tuple:
    """Returns (cycle_day, cycle_phase) for today."""
    from datetime import date
    last_start = pd.Timestamp(user_profile["lastPeriodStart"])
    today = pd.Timestamp(date.today())
    cycle_len = user_profile.get("cycleLength", 28)

    days_since = (today - last_start).days
    cycle_day = (days_since % cycle_len) + 1

    scale = cycle_len / 28
    if cycle_day <= round(5 * scale):
        phase = "menstrual"
    elif cycle_day <= round(13 * scale):
        phase = "follicular"
    elif cycle_day <= round(16 * scale):
        phase = "ovulation"
    else:
        phase = "luteal"

    return cycle_day, phase


def _compute_correlations(df: pd.DataFrame, trackables: list) -> list:
    """Compute simple correlations between trackable features and mood."""
    if "mood" not in df.columns:
        return []

    mood_map = {"Happy": 3, "Energetic": 2, "Chill": 1, "Sad": 0}
    mood_numeric = df["mood"].map(mood_map)

    correlations = []
    for t in trackables:
        col = t.get("id", t.get("name", ""))
        if col not in df.columns:
            continue

        if t.get("type") == "boolean":
            col_data = df[col].apply(lambda v: 1 if v else 0)
        elif t.get("type") == "number":
            col_data = pd.to_numeric(df[col], errors="coerce")
        else:
            continue

        # Compute Pearson correlation
        valid = col_data.notna() & mood_numeric.notna()
        if valid.sum() < 3:
            continue

        try:
            corr = col_data[valid].corr(mood_numeric[valid])
            if pd.notna(corr):
                correlations.append({
                    "feature": col,
                    "correlation": round(float(corr), 3),
                    "direction": "positive" if corr > 0 else "negative",
                    "strength": (
                        "strong" if abs(corr) > 0.5 else
                        "moderate" if abs(corr) > 0.3 else
                        "weak"
                    ),
                })
        except Exception:
            continue

    # Sort by absolute correlation descending
    correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)
    return correlations


def _generate_correlation_tip(correlations: list) -> str:
    """Generate a user-friendly tip from the top correlation."""
    if not correlations:
        return "Keep logging — we need more data to spot patterns."

    top = correlations[0]
    feature = top["feature"].replace("_", " ").title()
    direction = "boosts" if top["direction"] == "positive" else "lowers"

    return f"Early pattern: {feature} tends to {direction[:-1]} your mood."
