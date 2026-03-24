"""
MoodSlayer NLP — Sentiment Transformer

sklearn-compatible transformer that extracts sentiment features
from text trackables (journal entries, notes, etc.).

Uses TextBlob for lightweight polarity/subjectivity analysis.
"""

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin


class SentimentTransformer(BaseEstimator, TransformerMixin):
    """
    Extracts 3 features per text field:
      1. Polarity     (-1 to +1)  — negative vs positive sentiment
      2. Word count   (int)       — engagement/effort proxy
      3. Subjectivity (0 to 1)    — factual vs opinion-based
    """

    def fit(self, X, y=None):
        return self  # Stateless transformer, no fitting needed

    def transform(self, X):
        from textblob import TextBlob

        results = []
        for text in X:
            if not text or (isinstance(text, str) and text.strip() == ""):
                results.append([0.0, 0, 0.0])
            else:
                blob = TextBlob(str(text))
                results.append([
                    blob.sentiment.polarity,      # -1 to +1
                    len(str(text).split()),        # word count
                    blob.sentiment.subjectivity,   # 0 to 1
                ])
        return np.array(results, dtype=float)
