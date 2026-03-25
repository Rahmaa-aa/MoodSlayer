/**
 * Neural Insights Engine
 * Contains Anomaly Detection and Vibe Archetype (Clustering) logic.
 */

/**
 * Anomaly Detection
 * Calculates the deviation of the most recent day from the 30-day norm.
 */
export const detectAnomaly = (historyRows, features) => {
    if (historyRows.length < 10) return null;

    const lastRow = historyRows[historyRows.length - 1];
    const historical = historyRows.slice(0, -1);

    const anomalies = [];

    features.forEach(f => {
        if (f.includes('day_') || f.includes('_lag1')) return;

        const values = historical.map(r => r[f]);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);

        // Z-Score threshold (standard is 2.0 or 3.0)
        // We use 1.8 to be more sensitive to sudden behavioral shifts
        const zScore = stdDev === 0 ? 0 : Math.abs(lastRow[f] - mean) / stdDev;

        if (zScore > 1.8) {
            anomalies.push({
                feature: f,
                severity: zScore > 4 ? 'CRITICAL' : 'WARNING',
                zScore
            });
        }
    });

    return anomalies.sort((a, b) => b.zScore - a.zScore)[0] || null;
};

/**
 * Vibe Archetypes (Clustering Lite)
 * Identifies the current behavioral "State of Being" based on habit density.
 */
export const identifyArchetype = (rows, trackables) => {
    if (rows.length < 7) return "NEURAL_INIT_STATE";

    const last7 = rows.slice(-7);

    // Calculate Average Daily Densities
    const stats = {};
    const features = ['moodScore', ...trackables.map(t => t.id)];

    features.forEach(f => {
        stats[f] = last7.reduce((sum, r) => sum + (r[f] || 0), 0) / 7;
    });

    // ARCHETYPE RULES (Simple heuristic clustering)

    // 1. THE MONK: High Mantra/Grass, Low Rotting, Neutral/High Mood
    if (stats.daily_mantra > 0.7 && stats.rotting_time < 0.2) return "SLAYER_ZEN_MODE";

    // 2. THE ROTTER: High Rotting, Low Grass, Low Mood
    if (stats.rotting_time > 0.6 && stats.moodScore < 0.4) return "SLAYER_ROT_MODE";

    // 3. THE SOCIALITE: High Social/Yap sessions (if they exist) or high energy
    if (stats.moodScore > 0.7 && stats.gym_log > 0.5) return "SLAYER_PEAK_MODE";

    // 4. THE ROLLERCOASTER: High Variance (not covered by static rules)
    return "VIBE_DRIFTER";
};
