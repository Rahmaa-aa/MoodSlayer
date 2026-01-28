// Helper to normalize dates to YYYY-MM-DD
const getDateString = (date) => new Date(date).toISOString().split('T')[0];

/**
 * Gamification Service for MoodSlayer
 * Central logic for calculating streaks, XP, and Levels from database history.
 */

export const calculateStreak = (entries) => {
    if (!entries || entries.length === 0) return 0;

    // Sort entries by date descending
    const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Use a more robust date-string based streak check
    const today = new Date();
    const todayStr = getDateString(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateString(yesterday);

    let streak = 0;

    // Check if the most recent entry is today or yesterday (respecting UTC log dates)
    const lastEntryDate = getDateString(sorted[0].date);

    if (lastEntryDate !== todayStr && lastEntryDate !== yesterdayStr) {
        return 0; // Streak broken
    }

    // Set start of streak based on last entry
    let currentDateStr = lastEntryDate;
    streak = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prevEntryDateStr = getDateString(sorted[i].date);

        if (prevEntryDateStr === currentDateStr) continue; // Same day entry

        // Calculate actual day difference between date strings
        const d1 = new Date(currentDateStr);
        const d2 = new Date(prevEntryDateStr);
        const diffDays = Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak++;
            currentDateStr = prevEntryDateStr;
        } else {
            break; // Gap found
        }
    }

    return streak;
};

export const calculateXP = (entries) => {
    if (!entries) return 0;

    let totalXP = 0;
    entries.forEach(entry => {
        // Base XP for logging
        totalXP += 10;

        // Bonus for mood selection
        if (entry.data?.mood) totalXP += 5;

        // Bonus for each habit tracked
        const habits = Object.keys(entry.data || {}).filter(k => k !== 'mood' && !k.endsWith('_note'));
        habits.forEach(h => {
            const val = entry.data[h];
            if (val !== 0 && val !== false && val !== '') totalXP += 2;
        });
    });

    return totalXP;
};

export const getLevel = (xp) => {
    return Math.floor(xp / 100) + 1;
};
