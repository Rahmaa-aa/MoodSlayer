"""
MoodSlayer — Feature Engineering

Adds temporal cyclical features, lag features, and rolling averages
to the raw entry dataframe before model training/prediction.

Cyclical features use sin/cos encoding to preserve periodicity:
  - Day of week     (7-day cycle)
  - Month of year   (12-month cycle)  — captures SAD / seasonal patterns
  - Menstrual cycle  (user-specific)  — opt-in via onboarding
  - Hour of logging  (24-hour cycle)
"""

import numpy as np
import pandas as pd


def engineer_temporal_features(df: pd.DataFrame, user_profile: dict) -> pd.DataFrame:
    """
    Adds all cyclical time features to the dataframe.

    Args:
        df: DataFrame with a 'date' column (datetime64)
        user_profile: User document from MongoDB with optional cycle data

    Returns:
        DataFrame with temporal features appended
    """
    df = df.copy()

    # Ensure date is datetime
    if not pd.api.types.is_datetime64_any_dtype(df["date"]):
        df["date"] = pd.to_datetime(df["date"])

    # ── Day of week (7-day cycle) — always added ──
    dow = df["date"].dt.dayofweek  # 0=Mon, 6=Sun
    df["day_sin"] = np.sin(2 * np.pi * dow / 7)
    df["day_cos"] = np.cos(2 * np.pi * dow / 7)

    # ── Month of year (12-month cycle) — seasonal awareness ──
    month = df["date"].dt.month  # 1-12
    df["month_sin"] = np.sin(2 * np.pi * month / 12)
    df["month_cos"] = np.cos(2 * np.pi * month / 12)

    # ── Menstrual cycle (opt-in) ──
    if user_profile.get("tracksCycle") and user_profile.get("lastPeriodStart"):
        cycle_len = user_profile.get("cycleLength", 28)
        last_start = pd.Timestamp(user_profile["lastPeriodStart"])

        # Days since last period start, wrapped to cycle length
        days_since = (df["date"] - last_start).dt.days
        df["cycle_day"] = days_since % cycle_len

        # Cyclical encoding
        df["cycle_sin"] = np.sin(2 * np.pi * df["cycle_day"] / cycle_len)
        df["cycle_cos"] = np.cos(2 * np.pi * df["cycle_day"] / cycle_len)

        # Phase category (scaled to user's cycle length)
        scale = cycle_len / 28
        df["cycle_phase"] = df["cycle_day"].apply(lambda d:
            "menstrual" if d <= round(5 * scale) else
            "follicular" if d <= round(13 * scale) else
            "ovulation" if d <= round(16 * scale) else
            "luteal"
        )

    # ── Hour of logging (if createdAt/timestamp available) ──
    if "createdAt" in df.columns:
        hour = pd.to_datetime(df["createdAt"]).dt.hour
        df["hour_sin"] = np.sin(2 * np.pi * hour / 24)
        df["hour_cos"] = np.cos(2 * np.pi * hour / 24)

    return df


def add_lag_features(df: pd.DataFrame, mood_col: str = "mood") -> pd.DataFrame:
    """
    Adds lag features (previous day's mood) and rolling averages.
    DataFrame must be sorted by date ascending.

    Features added:
      - mood_lag1: Yesterday's mood (label-encoded int)
      - mood_lag2: Day-before-yesterday's mood
      - mood_rolling_7: 7-day rolling mode of mood
    """
    df = df.copy()
    df = df.sort_values("date").reset_index(drop=True)

    if mood_col not in df.columns:
        return df

    # Label-encode mood for numeric lag (will be ordinal, but trees handle this)
    mood_map = {"Happy": 3, "Energetic": 2, "Chill": 1, "Sad": 0}
    df["mood_numeric"] = df[mood_col].map(mood_map).fillna(-1).astype(int)

    # Lag features
    df["mood_lag1"] = df["mood_numeric"].shift(1).fillna(-1).astype(int)
    df["mood_lag2"] = df["mood_numeric"].shift(2).fillna(-1).astype(int)

    # 7-day rolling mode (most common mood in last 7 days)
    df["mood_rolling_7"] = (
        df["mood_numeric"]
        .rolling(window=7, min_periods=1)
        .apply(lambda x: pd.Series(x).mode().iloc[0] if len(x) > 0 else -1)
        .fillna(-1)
        .astype(int)
    )

    # Drop the helper column
    df.drop(columns=["mood_numeric"], inplace=True)

    return df


def get_feature_names(user_trackables: list, user_profile: dict) -> dict:
    """
    Returns categorized feature name lists for the dynamic preprocessor.

    Returns:
        {
            "numeric": [...],
            "boolean": [...],
            "text": [...],
            "temporal": [...],
            "lag": [...]
        }
    """
    numeric = [t["id"] for t in user_trackables if t.get("type") == "number"]
    boolean = [t["id"] for t in user_trackables if t.get("type") == "boolean"]
    text = [t["id"] for t in user_trackables if t.get("type") == "text"]

    temporal = ["day_sin", "day_cos", "month_sin", "month_cos"]

    if user_profile.get("tracksCycle") and user_profile.get("lastPeriodStart"):
        temporal += ["cycle_sin", "cycle_cos"]

    if "createdAt" in (user_profile.get("_available_columns") or []):
        temporal += ["hour_sin", "hour_cos"]

    lag = ["mood_lag1", "mood_lag2", "mood_rolling_7"]

    return {
        "numeric": numeric,
        "boolean": boolean,
        "text": text,
        "temporal": temporal,
        "lag": lag,
    }
