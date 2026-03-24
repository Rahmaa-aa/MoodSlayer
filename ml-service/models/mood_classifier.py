"""
MoodSlayer — Model Factory

Builds the complete sklearn Pipeline:
  preprocessor → (optional SMOTE) → GradientBoostingClassifier

Handles class imbalance detection and auto-correction.
"""

import numpy as np
from collections import Counter
from sklearn.pipeline import Pipeline
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier

from pipeline.preprocessor import build_preprocessor


def build_mood_pipeline(
    numeric_features: list,
    boolean_features: list,
    text_features: list,
    temporal_features: list,
    lag_features: list,
    y_train: np.ndarray = None,
) -> Pipeline:
    """
    Builds the full ML pipeline for mood classification.

    If y_train is provided, checks for class imbalance and
    applies SMOTE + balanced weights automatically.

    Args:
        numeric_features: List of numeric trackable IDs
        boolean_features: List of boolean trackable IDs
        text_features: List of text trackable IDs
        temporal_features: List of temporal feature names
        lag_features: List of lag feature names
        y_train: Optional training labels for imbalance detection

    Returns:
        sklearn Pipeline ready for .fit(X, y)
    """
    preprocessor = build_preprocessor(
        numeric_features, boolean_features, text_features,
        temporal_features, lag_features,
    )

    # Detect class imbalance
    use_smote = False
    if y_train is not None and len(y_train) > 0:
        distribution = Counter(y_train)
        if len(distribution) > 1:
            max_count = max(distribution.values())
            min_count = min(distribution.values())
            max_ratio = max_count / max(min_count, 1)
            use_smote = max_ratio > 5 and min_count >= 2

    # Build the classifier with overfitting guards
    classifier = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=3,
        min_samples_leaf=3,
        min_samples_split=5,
        learning_rate=0.1,
        subsample=0.8,
        n_iter_no_change=10,
        validation_fraction=0.15,
        random_state=42,
    )

    if use_smote:
        from imblearn.over_sampling import SMOTE
        from imblearn.pipeline import Pipeline as ImbPipeline

        min_class_count = min(Counter(y_train).values())
        k_neighbors = min(2, min_class_count - 1)

        return ImbPipeline([
            ("preprocessor", preprocessor),
            ("smote", SMOTE(random_state=42, k_neighbors=max(1, k_neighbors))),
            ("classifier", classifier),
        ])

    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier),
    ])


def build_comparison_candidates(
    numeric_features: list,
    boolean_features: list,
    text_features: list,
    temporal_features: list,
    lag_features: list,
) -> dict:
    """
    Returns a dict of {name: Pipeline} for model comparison.
    The trainer picks the best one via cross-validation.
    """
    preprocessor = build_preprocessor(
        numeric_features, boolean_features, text_features,
        temporal_features, lag_features,
    )

    return {
        "GradientBoosting": Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", GradientBoostingClassifier(
                n_estimators=200, max_depth=3, min_samples_leaf=3,
                min_samples_split=5, learning_rate=0.1, subsample=0.8,
                n_iter_no_change=10, validation_fraction=0.15,
                random_state=42,
            )),
        ]),
        "RandomForest": Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(
                n_estimators=100, max_depth=4,
                class_weight="balanced", random_state=42,
            )),
        ]),
    }
