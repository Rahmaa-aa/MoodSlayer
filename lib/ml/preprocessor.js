/**
 * ML Preprocessor for MoodSlayer
 * Converts raw MongoDB entries into structured, cleaned, and normalized numerical data for TF.js
 */

export const prepareData = (history, trackableDefinitions) => {
    if (!history || history.length < 3) return null;

    // 1. Sort history by date ascending for time-series processing
    const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. Define Mood Map
    const moodMap = { 'Happy': 4, 'Energetic': 3, 'Chill': 2, 'Sad': 1 };

    // 3. Initial processing: Raw numerical extraction
    let rows = sortedHistory.map(entry => {
        const row = { date: new Date(entry.date) };

        // Mood Score
        row.moodScore = moodMap[entry.data?.mood] || 0;

        // Trackables
        trackableDefinitions.forEach(t => {
            const val = entry.data?.[t.id];
            if (t.type === 'boolean') {
                row[t.id] = val ? 1 : 0;
            } else if (t.type === 'number') {
                row[t.id] = Number(val) || 0;
            } else {
                row[t.id] = val ? 1 : 0;
            }
        });

        return row;
    });

    // 4. DATA CLEANING: Missing Day Imputation (Simple Forward Fill)
    rows = imputeMissingDays(rows, trackableDefinitions);

    // 5. FEATURE ENGINEERING: Cyclical Time & Lags
    const features = [];
    const processedRows = rows.map((row, i) => {
        const enhancedRow = { ...row };

        // A. Cyclical Day of Week (0-6)
        const day = row.date.getDay();
        enhancedRow.day_sin = Math.sin(2 * Math.PI * day / 7);
        enhancedRow.day_cos = Math.cos(2 * Math.PI * day / 7);

        // B. Temporal Lags (t-1)
        if (i > 0) {
            const prevRow = rows[i - 1];
            enhancedRow.moodScore_lag1 = prevRow.moodScore;
            trackableDefinitions.forEach(t => {
                enhancedRow[`${t.id}_lag1`] = prevRow[t.id];
            });
        } else {
            enhancedRow.moodScore_lag1 = row.moodScore;
            trackableDefinitions.forEach(t => {
                enhancedRow[`${t.id}_lag1`] = row[t.id];
            });
        }

        return enhancedRow;
    });

    // Define all available features for the model
    const baseFeatures = ['moodScore', ...trackableDefinitions.map(t => t.id)];
    const timeFeatures = ['day_sin', 'day_cos'];
    const lagFeatures = baseFeatures.map(f => `${f}_lag1`);
    const allFeatures = [...baseFeatures, ...timeFeatures, ...lagFeatures];

    // 6. NORMALIZATION: Min-Max Scaling (to 0-1 range)
    const normalizedRows = normalize(processedRows, allFeatures);

    return {
        rows: normalizedRows,
        features: allFeatures
    };
};

/**
 * Fills in gaps between dates with the last known state
 */
function imputeMissingDays(rows, trackables) {
    if (rows.length < 2) return rows;
    const imputed = [rows[0]];

    for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1];
        const curr = rows[i];
        const diffDays = Math.round((curr.date - prev.date) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // Fill gaps
            for (let j = 1; j < diffDays; j++) {
                const fillDate = new Date(prev.date);
                fillDate.setDate(fillDate.getDate() + j);
                imputed.push({
                    ...prev,
                    date: fillDate,
                    is_imputed: 1
                });
            }
        }
        imputed.push(curr);
    }
    return imputed;
}

/**
 * Min-Max Normalization helper
 */
function normalize(rows, features) {
    const stats = {};
    features.forEach(f => {
        const vals = rows.map(r => r[f]);
        stats[f] = {
            min: Math.min(...vals),
            max: Math.max(...vals)
        };
    });

    return rows.map(row => {
        const nRow = { ...row };
        features.forEach(f => {
            const { min, max } = stats[f];
            if (max === min) {
                // FALLBACK FOR NO VARIANCE:
                // If it's a known score, normalize against its absolute range
                if (f === 'moodScore') nRow[f] = (row[f] - 1) / 3; // 1-4 scale
                else if (f.includes('rating')) nRow[f] = row[f] / 10; // 0-10 scale
                else nRow[f] = row[f] > 0 ? 1 : 0; // Boolean-ish fallback
            } else {
                nRow[f] = (row[f] - min) / (max - min);
            }
        });
        return nRow;
    });
}

/**
 * Statistical utilities for the Oracle
 */
export const calculateCorrelations = (data, targetKey, includeFeatures = null) => {
    const { rows, features } = data;
    const correlations = [];

    features.forEach(feature => {
        // Skip target itself, or day encoding
        if (feature === targetKey || feature.includes('day_')) return;

        // Filter by user selection if provided
        if (includeFeatures) {
            const baseFeature = feature.endsWith('_lag1') ? feature.replace('_lag1', '') : feature;
            // Always allow looking at lag features of things we track
            if (!includeFeatures.includes(baseFeature)) return;
        }

        const x = rows.map(r => r[feature]);
        const y = rows.map(r => r[targetKey]);

        const corr = getPearsonCorrelation(x, y);

        if (!isNaN(corr) && Math.abs(corr) > 0.05) {
            correlations.push({
                feature,
                correlation: corr,
                impact: corr > 0 ? 'positive' : 'negative',
                strength: Math.abs(corr)
            });
        }
    });

    return correlations.sort((a, b) => b.strength - a.strength).slice(0, 10);
};

function getPearsonCorrelation(x, y) {
    let n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }

    let numerator = (n * sumXY) - (sumX * sumY);
    let denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) {
        // Handle 0-variance for "Stable Alignment"
        const avgX = sumX / n;
        const avgY = sumY / n;
        // Perfect Match (Both High or Both Low)
        if ((avgX >= 0.8 && avgY >= 0.8) || (avgX <= 0.2 && avgY <= 0.2)) return 0.99;
        // Perfect Inversion (One High, One Low)
        if ((avgX >= 0.8 && avgY <= 0.2) || (avgX <= 0.2 && avgY >= 0.8)) return -0.99;
        return 0;
    }
    return numerator / denominator;
}
