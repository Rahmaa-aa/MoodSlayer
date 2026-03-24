"""
MoodSlayer — SHAP Explainer

Generates per-prediction SHAP explanations using TreeExplainer.
Returns top positive and negative contributors with human-readable labels.
"""

import numpy as np


def explain_prediction(model, X_processed: np.ndarray, feature_names: list,
                       prediction_class_idx: int, top_n: int = 5) -> dict:
    """
    Generates SHAP-based feature attributions for a single prediction.

    Args:
        model: Trained sklearn Pipeline (must have a tree-based classifier)
        X_processed: Preprocessed feature array (1 row)
        feature_names: List of feature names matching X_processed columns
        prediction_class_idx: Index of the predicted class in model.classes_
        top_n: Number of top contributors to return

    Returns:
        Dict of {feature_name: {impact, direction, rank}}
    """
    try:
        import shap
    except ImportError:
        # SHAP not available (e.g., Python 3.13) — return empty explanations
        return {}

    # Extract the classifier step from the pipeline
    classifier = model.named_steps.get("classifier", model)

    try:
        explainer = shap.TreeExplainer(classifier)
        shap_values = explainer.shap_values(X_processed)
    except Exception:
        # Fallback: return empty explanations if SHAP fails
        return {}

    # shap_values shape: [n_classes][n_samples][n_features] or [n_samples][n_features]
    if isinstance(shap_values, list):
        # Multi-class: pick the values for the predicted class
        values = shap_values[prediction_class_idx][0]
    else:
        values = shap_values[0]

    # Build explanation dict
    explanations = {}
    for i, (name, val) in enumerate(zip(feature_names, values)):
        explanations[name] = {
            "impact": round(float(val), 4),
            "direction": "positive" if val > 0 else "negative",
            "abs_impact": abs(float(val)),
        }

    # Sort by absolute impact, return top_n
    sorted_items = sorted(
        explanations.items(),
        key=lambda x: x[1]["abs_impact"],
        reverse=True,
    )[:top_n]

    result = {}
    for rank, (name, info) in enumerate(sorted_items, 1):
        result[_humanize_feature(name)] = {
            "impact": info["impact"],
            "direction": info["direction"],
            "rank": rank,
        }

    return result


def _humanize_feature(name: str) -> str:
    """Convert internal feature names to user-friendly labels."""
    mapping = {
        "day_sin": "day_of_week",
        "day_cos": "day_of_week",
        "month_sin": "season",
        "month_cos": "season",
        "cycle_sin": "cycle_position",
        "cycle_cos": "cycle_position",
        "hour_sin": "time_of_logging",
        "hour_cos": "time_of_logging",
        "mood_lag1": "yesterdays_mood",
        "mood_lag2": "mood_2_days_ago",
        "mood_rolling_7": "weekly_mood_trend",
    }
    return mapping.get(name, name)
