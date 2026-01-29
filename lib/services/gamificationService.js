import { RPG_STATS, SURVIVAL_HABITS } from '../rpg-constants';

// Helper to normalize dates to local YYYY-MM-DD
const getDateString = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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

export const calculateBestStreak = (entries) => {
    if (!entries || entries.length === 0) return 0;

    // Sort entries by date ascending
    const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));

    let bestStreak = 0;
    let currentStreak = 0;
    let lastDateStr = null;

    for (let i = 0; i < sorted.length; i++) {
        const dateStr = getDateString(sorted[i].date);

        if (dateStr === lastDateStr) continue; // Skip multiple entries per day

        if (!lastDateStr) {
            currentStreak = 1;
        } else {
            const d1 = new Date(lastDateStr);
            const d2 = new Date(dateStr);
            const diffDays = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
            } else {
                currentStreak = 1;
            }
        }

        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
        }
        lastDateStr = dateStr;
    }

    return bestStreak;
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

const evaluateCondition = (val, condition) => {
    if (!condition) return val !== 0 && val !== false && val !== ''; // Legacy fallback
    const { operator, value: targetValue } = condition;

    if (operator === '==') return val == targetValue;
    if (operator === '<') return parseFloat(val) < parseFloat(targetValue);
    if (operator === '>') return parseFloat(val) > parseFloat(targetValue);

    return false;
};

export const calculateRPGStats = (entries, goals = []) => {
    if (!entries) return {};

    const stats = {};
    Object.keys(RPG_STATS).forEach(key => {
        stats[key] = { xp: 0, level: 1, label: RPG_STATS[key].label, icon: RPG_STATS[key].icon };
    });

    // Initialize goals progress
    const goalsProgress = goals.map(g => ({ ...g, currentXP: 0 }));

    entries.forEach(entry => {
        const data = entry.data || {};

        // 1. SURVIVAL XP (Automatic detection)
        SURVIVAL_HABITS.forEach(h => {
            if (data[h] === true || (typeof data[h] === 'number' && data[h] > 0)) {
                stats.SURVIVAL.xp += 5;
            }
        });

        // 2. HABIT MAPPING TO STATS & GOALS
        const habits = Object.keys(data).filter(k => k !== 'mood' && !k.endsWith('_note'));

        habits.forEach(h => {
            const val = data[h];

            // Find goals linked to this habit
            goalsProgress.forEach(goal => {
                if (goal.linkedHabits.includes(h)) {
                    const condition = goal.conditions?.[h];
                    const isMet = evaluateCondition(val, condition);

                    if (isMet) {
                        const xpGain = (typeof val === 'number' && typeof condition?.value === 'number')
                            ? Math.min(Math.abs(val), 15)
                            : 10;

                        goal.currentXP += xpGain;

                        // Also add to category stat
                        if (stats[goal.category]) {
                            stats[goal.category].xp += xpGain;
                        }
                    }
                }
            });
        });
    });

    // Calculate levels for each stat
    Object.keys(stats).forEach(key => {
        stats[key].level = Math.floor(stats[key].xp / 100) + 1;
    });

    // Calculate final status for goals
    const processedGoals = goalsProgress.map(g => ({
        ...g,
        currentLevel: Math.floor(g.currentXP / 100) + 1,
        percent: Math.min(100, (g.currentXP / (g.targetLevel * 100)) * 100)
    }));

    return { stats, goals: processedGoals };
};

export const getLevel = (xp) => {
    return Math.floor(xp / 100) + 1;
};
