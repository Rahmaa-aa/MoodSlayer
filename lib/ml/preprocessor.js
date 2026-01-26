/**
 * ML Preprocessor for MoodSlayer
 * Converts raw MongoDB entries into structured numerical data for TF.js
 */

export const prepareData = (history, trackableDefinitions) => {
    if (!history || history.length < 5) return null;

    // 1. Define all possible features (Inputs)
    // We include mood and all trackables
    const features = ['moodScore', ...trackableDefinitions.map(t => t.id)];

    // Mood Mapping
    const moodMap = { 'Happy': 4, 'Energetic': 3, 'Chill': 2, 'Sad': 1 };

    // 2. Process history into numerical rows
    const processedRows = history.map(entry => {
        const row = {};

        // Target/Feature: Mood
        row.moodScore = moodMap[entry.data?.mood] || 0;

        // Process other trackables
        trackableDefinitions.forEach(t => {
            const val = entry.data?.[t.id];
            if (t.type === 'boolean') {
                row[t.id] = val ? 1 : 0;
            } else if (t.type === 'number') {
                row[t.id] = Number(val) || 0;
            } else if (t.type === 'text') {
                // For text/enum, we could one-hot encode, but for now just check if filled
                row[t.id] = val ? 1 : 0;
            }
        });

        return row;
    });

    // 3. Create sliding window for time-series (if we want to predict next day)
    // Or just return the flat matrix for correlation
    return {
        rows: processedRows,
        features: features
    };
};

/**
 * Calculates Pearson Correlation between a target and all other features
 */
export const calculateCorrelations = (data, targetKey) => {
    const { rows, features } = data;
    const correlations = [];

    features.forEach(feature => {
        if (feature === targetKey) return;

        const x = rows.map(r => r[feature]);
        const y = rows.map(r => r[targetKey]);

        const corr = getPearsonCorrelation(x, y);
        correlations.push({
            feature,
            correlation: corr,
            impact: corr > 0 ? 'positive' : 'negative',
            strength: Math.abs(corr)
        });
    });

    return correlations.sort((a, b) => b.strength - a.strength);
};

function getPearsonCorrelation(x, y) {
    let shortestArrayLength = Math.min(x.length, y.length);
    let xy = [];
    let x2 = [];
    let y2 = [];

    for (let i = 0; i < shortestArrayLength; i++) {
        xy.push(x[i] * y[i]);
        x2.push(x[i] * x[i]);
        y2.push(y[i] * y[i]);
    }

    let sum_x = x.reduce((a, b) => a + b, 0);
    let sum_y = y.reduce((a, b) => a + b, 0);
    let sum_xy = xy.reduce((a, b) => a + b, 0);
    let sum_x2 = x2.reduce((a, b) => a + b, 0);
    let sum_y2 = y2.reduce((a, b) => a + b, 0);

    let step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
    let step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
    let step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
    let step4 = Math.sqrt(step2 * step3);

    if (step4 === 0) return 0;
    return step1 / step4;
}
