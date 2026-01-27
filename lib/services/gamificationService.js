/**
 * Gamification Service for MoodSlayer
 * Central logic for calculating streaks, XP, and Levels from database history.
 */

export const calculateStreak = (entries) => {
    if (!entries || entries.length === 0) return 0;

    // Sort entries by date descending
    const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Normalize dates to YYYY-MM-DD for comparison
    const getDateString = (date) => new Date(date).toISOString().split('T')[0];
    const today = getDateString(new Date());

    let streak = 0;
    let expectedDate = new Date();

    // Check if the most recent entry is today or yesterday
    const lastEntryDate = getDateString(sorted[0].date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateString(yesterday);

    if (lastEntryDate !== today && lastEntryDate !== yesterdayStr) {
        return 0; // Streak broken if no log today or yesterday
    }

    // Set start of streak based on last entry
    let currentDate = new Date(sorted[0].date);
    streak = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prevEntryDate = new Date(sorted[i].date);

        // Difference in days
        const diffTime = Math.abs(currentDate - prevEntryDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak++;
            currentDate = prevEntryDate;
        } else if (diffDays === 0) {
            continue; // Same day entries don't break or increment streak
        } else {
            break; // Gap found, streak ends
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
