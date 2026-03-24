"""
MoodSlayer — Model Trainer

Handles the complete training lifecycle:
  1. Fetch user data from MongoDB
  2. Clean & engineer features
  3. Train with cross-validation
  4. Detect under/overfitting
  5. Compare models (GB vs RF)
  6. Serialize best model to MongoDB GridFS
  7. Save model metadata
"""

import numpy as np
import warnings as python_warnings
from datetime import datetime, timezone
from collections import Counter

import joblib
import io
from bson import ObjectId
from sklearn.model_selection import TimeSeriesSplit, cross_val_score, cross_val_predict
from sklearn.metrics import classification_report

from pipeline.preprocessor import clean_entries
from pipeline.feature_engineer import (
    engineer_temporal_features,
    add_lag_features,
    get_feature_names,
)
from models.mood_classifier import build_mood_pipeline, build_comparison_candidates


def train_user_model(db, user_id: str) -> dict:
    """
    Full training pipeline for a single user.

    Args:
        db: PyMongo database instance
        user_id: MongoDB user ID string

    Returns:
        Training result dict with status, metrics, and warnings
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

    # ── Fetch trackable definitions ──
    trackables = list(db.trackables.find({"userId": user_id}))
    if not trackables:
        # Try fetching default trackables
        trackables = list(db.trackables.find({"userId": {"$exists": False}}))

    # ── Fetch entries ──
    entries = list(db.entries.find({"userId": user_id}).sort("date", 1))
    entry_count = len(entries)

    # ── Tier check ──
    tier = _get_tier(entry_count)
    if tier == "COLD_START":
        return {
            "status": "insufficient_data",
            "tier": tier,
            "dataPointsUsed": entry_count,
            "warnings": [f"Only {entry_count} entries. Need at least 5 to begin analysis."],
        }

    # ── Clean data ──
    df = clean_entries(entries, trackables)
    if df.empty or "mood" not in df.columns:
        return {
            "status": "no_mood_data",
            "tier": tier,
            "dataPointsUsed": 0,
            "warnings": ["No valid mood data found in entries."],
        }

    # Drop rows where mood is missing
    df = df.dropna(subset=["mood"])
    if len(df) < 5:
        return {
            "status": "insufficient_data",
            "tier": "COLD_START",
            "dataPointsUsed": len(df),
            "warnings": ["Not enough entries with mood data."],
        }

    # ── Feature engineering ──
    user_profile["_available_columns"] = list(df.columns)
    df = engineer_temporal_features(df, user_profile)
    df = add_lag_features(df, mood_col="mood")

    # Get feature name categories
    feat_names = get_feature_names(trackables, user_profile)

    # ── Prepare X and y ──
    target = "mood"
    y = df[target].values

    # Collect all feature columns that actually exist in the DataFrame
    all_features = []
    for cat in ["numeric", "boolean", "text", "temporal", "lag"]:
        for f in feat_names[cat]:
            if f in df.columns:
                all_features.append(f)
            else:
                # Remove missing features from the category
                feat_names[cat] = [x for x in feat_names[cat] if x in df.columns]

    if not all_features:
        return {
            "status": "no_features",
            "tier": tier,
            "dataPointsUsed": len(df),
            "warnings": ["No trackable features found to train on."],
        }

    X = df[all_features]

    # ── Training warnings ──
    train_warnings = []
    unique_classes = np.unique(y)
    if len(unique_classes) < 2:
        return {
            "status": "single_class",
            "tier": tier,
            "dataPointsUsed": len(df),
            "warnings": [f"All entries have mood='{unique_classes[0]}'. Need variety to train."],
        }

    # Class imbalance check
    distribution = Counter(y)
    max_ratio = max(distribution.values()) / max(min(distribution.values()), 1)
    if max_ratio > 3:
        train_warnings.append(
            f"Class imbalance detected (ratio {max_ratio:.1f}x). "
            f"Applying balanced weights."
        )

    # ── Model comparison (if ML_READY, otherwise just use GB) ──
    n_splits = min(4, max(2, len(df) // 7))
    tscv = TimeSeriesSplit(n_splits=n_splits)

    if tier == "ML_READY" and len(df) >= 30:
        best_name, best_score, best_model = _compare_models(
            X, y, feat_names, tscv
        )
        train_warnings.append(f"Best model: {best_name} (F1={best_score:.3f})")
    else:
        best_model = build_mood_pipeline(
            feat_names["numeric"], feat_names["boolean"],
            feat_names["text"], feat_names["temporal"],
            feat_names["lag"], y_train=y,
        )
        best_name = "GradientBoosting"
        best_score = 0.0

    # ── Train final model ──
    best_model.fit(X, y)

    # ── Cross-validation metrics ──
    try:
        cv_scores = cross_val_score(best_model, X, y, cv=tscv, scoring="f1_weighted")
        f1_mean = float(np.mean(cv_scores))
        f1_std = float(np.std(cv_scores))
    except Exception:
        f1_mean = best_score
        f1_std = 0.0

    # ── Underfitting check ──
    if f1_mean < 0.40 and len(df) >= 15:
        train_warnings.append(
            f"Low F1 score ({f1_mean:.3f}). Model may be underfitting."
        )

    if f1_std > 0.3:
        train_warnings.append(
            f"High variance across CV folds (std={f1_std:.3f}). "
            f"Predictions may be unreliable."
        )

    # ── Serialize model to GridFS ──
    model_version = _save_model_to_gridfs(db, user_id, best_model, {
        "userId": user_id,
        "modelName": best_name,
        "trainedAt": datetime.now(timezone.utc),
        "f1Score": f1_mean,
        "f1Std": f1_std,
        "featureNames": all_features,
        "featureCategories": feat_names,
        "dataPointsUsed": len(df),
        "tier": tier,
        "classes": list(best_model.classes_) if hasattr(best_model, "classes_") else list(unique_classes),
        "tracksCycle": user_profile.get("tracksCycle", False),
        "warnings": train_warnings,
    })

    return {
        "status": "trained",
        "modelVersion": model_version,
        "f1Score": f1_mean,
        "dataPointsUsed": len(df),
        "tier": tier,
        "warnings": train_warnings,
    }


def _get_tier(entry_count: int) -> str:
    """Progressive unlock tiers based on data volume."""
    if entry_count < 5:
        return "COLD_START"
    elif entry_count < 15:
        return "EARLY_SIGNAL"
    elif entry_count < 30:
        return "WARM_UP"
    return "ML_READY"


def _compare_models(X, y, feat_names, tscv) -> tuple:
    """Compare GB vs RF, return (name, score, model) of the best."""
    candidates = build_comparison_candidates(
        feat_names["numeric"], feat_names["boolean"],
        feat_names["text"], feat_names["temporal"],
        feat_names["lag"],
    )

    best_name, best_score, best_model = None, -1, None

    for name, pipeline in candidates.items():
        try:
            scores = cross_val_score(pipeline, X, y, cv=tscv, scoring="f1_weighted")
            mean_score = np.mean(scores)
            if mean_score > best_score:
                best_name = name
                best_score = mean_score
                best_model = pipeline
        except Exception:
            continue

    if best_model is None:
        # Fallback to GB
        from models.mood_classifier import build_mood_pipeline
        best_model = build_mood_pipeline(
            feat_names["numeric"], feat_names["boolean"],
            feat_names["text"], feat_names["temporal"],
            feat_names["lag"], y_train=y,
        )
        best_name = "GradientBoosting"
        best_score = 0.0

    return best_name, best_score, best_model


def _save_model_to_gridfs(db, user_id: str, model, metadata: dict) -> int:
    """
    Serialize the model with joblib and store in MongoDB GridFS.
    Returns the new model version number.
    """
    from gridfs import GridFS

    fs = GridFS(db, collection="ml_models")

    # Serialize model to bytes
    buffer = io.BytesIO()
    joblib.dump(model, buffer)
    buffer.seek(0)

    # Get current version
    existing = db.ml_model_metadata.find_one(
        {"userId": user_id},
        sort=[("modelVersion", -1)]
    )
    new_version = (existing.get("modelVersion", 0) + 1) if existing else 1

    # Delete old model blob if exists
    if existing and existing.get("modelBlobId"):
        try:
            fs.delete(existing["modelBlobId"])
        except Exception:
            pass

    # Store new model blob
    blob_id = fs.put(
        buffer.read(),
        filename=f"model_{user_id}_v{new_version}",
        userId=user_id,
    )

    # Save metadata
    metadata["modelVersion"] = new_version
    metadata["modelBlobId"] = blob_id

    db.ml_model_metadata.update_one(
        {"userId": user_id},
        {"$set": metadata},
        upsert=True,
    )

    return new_version
