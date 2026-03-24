"""
MoodSlayer — Data Preprocessor

Handles the complete data cleaning pipeline (CRISP-DM Phase 3):
  1. Dedup by date (keep latest entry per day)
  2. Outlier clamping (IQR method)
  3. Missing day imputation (cap at 3 consecutive days)
  4. Type enforcement (bool→0/1, number→numeric)
  5. Dynamic ColumnTransformer based on user's trackable types

Also builds the sklearn-compatible preprocessing pipeline
that chains with the classifier.
"""

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder

from nlp.sentiment import SentimentTransformer


def clean_entries(entries: list, trackable_defs: list) -> pd.DataFrame:
    """
    Cleans raw MongoDB entries into a model-ready DataFrame.

    Args:
        entries: List of entry dicts from MongoDB
        trackable_defs: List of trackable definitions [{id, type, ...}]

    Returns:
        Cleaned DataFrame sorted by date
    """
    if not entries:
        return pd.DataFrame()

    df = pd.DataFrame(entries)

    # Ensure date column exists and is datetime
    if "date" not in df.columns:
        return pd.DataFrame()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])

    # ── 1. Dedup: keep latest entry per date ──
    if "lastModified" in df.columns:
        df["lastModified"] = pd.to_datetime(df["lastModified"], errors="coerce")
        df = df.sort_values("lastModified").drop_duplicates(subset=["date"], keep="last")
    else:
        df = df.drop_duplicates(subset=["date"], keep="last")

    # Sort chronologically
    df = df.sort_values("date").reset_index(drop=True)

    # ── 2. Outlier clamping (IQR method, numeric columns only) ──
    numeric_ids = [t["id"] for t in trackable_defs if t.get("type") == "number"]
    for col in numeric_ids:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            if iqr > 0:
                df[col] = df[col].clip(lower=q1 - 1.5 * iqr, upper=q3 + 1.5 * iqr)

    # ── 3. Missing day imputation (cap at 3 consecutive days) ──
    df = _impute_missing_days(df, max_gap=3)

    # ── 4. Type enforcement ──
    for t in trackable_defs:
        col = t["id"]
        if col not in df.columns:
            continue
        if t.get("type") == "boolean":
            df[col] = df[col].apply(_to_bool).astype(int)
        elif t.get("type") == "number":
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    return df


def _to_bool(val) -> int:
    """Convert various truthy/falsy values to 0 or 1."""
    if isinstance(val, bool):
        return int(val)
    if isinstance(val, (int, float)):
        return 1 if val > 0 else 0
    if isinstance(val, str):
        return 1 if val.lower() in ("true", "1", "yes") else 0
    return 0


def _impute_missing_days(df: pd.DataFrame, max_gap: int = 3) -> pd.DataFrame:
    """
    Fills gaps in the time series (missing days) via forward-fill,
    but only up to max_gap consecutive days to avoid fake autocorrelation.
    """
    if df.empty or "date" not in df.columns:
        return df

    date_range = pd.date_range(start=df["date"].min(), end=df["date"].max(), freq="D")
    df = df.set_index("date").reindex(date_range)
    df.index.name = "date"

    # Forward-fill only up to max_gap days
    df = df.ffill(limit=max_gap)

    # Drop rows that are still NaN (gaps > max_gap)
    # We keep them but with NaN — the imputer in the pipeline will handle numeric ones
    df = df.reset_index().rename(columns={"index": "date"})

    return df


def build_preprocessor(
    numeric_features: list,
    boolean_features: list,
    text_features: list,
    temporal_features: list,
    lag_features: list,
) -> ColumnTransformer:
    """
    Builds a dynamic sklearn ColumnTransformer based on the user's trackable types.

    Each feature type gets its own sub-pipeline:
      - Numeric + temporal + lag: median impute → MinMax scale
      - Boolean: most-frequent impute → passthrough
      - Text: sentiment extraction → MinMax scale
      - Categorical (cycle_phase): one-hot encode
    """
    transformers = []

    # Numeric + temporal + lag features
    all_numeric = numeric_features + temporal_features + lag_features
    if all_numeric:
        transformers.append((
            "num",
            Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", MinMaxScaler()),
            ]),
            all_numeric,
        ))

    # Boolean features
    if boolean_features:
        transformers.append((
            "bool",
            Pipeline([
                ("imputer", SimpleImputer(strategy="most_frequent")),
            ]),
            boolean_features,
        ))

    # Text features (sentiment extraction)
    if text_features:
        transformers.append((
            "text",
            Pipeline([
                ("sentiment", SentimentTransformer()),
                ("scaler", MinMaxScaler()),
            ]),
            text_features,
        ))

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",  # Drop any columns not explicitly handled
    )
