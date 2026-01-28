const { MongoClient, ObjectId } = require('mongodb');

// Replicate the service logic exactly
const getDateString = (date) => new Date(date).toISOString().split('T')[0];

const calculateStreak = (entries) => {
    if (!entries || entries.length === 0) return 0;
    const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = new Date();
    const todayStr = getDateString(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateString(yesterday);

    let streak = 0;
    const lastEntryDate = getDateString(sorted[0].date);
    console.log(`Debug Streak: lastEntryDate=${lastEntryDate}, todayStr=${todayStr}, yesterdayStr=${yesterdayStr}`);

    if (lastEntryDate !== todayStr && lastEntryDate !== yesterdayStr) {
        console.log(`Streak Broken: lastEntryDate (${lastEntryDate}) is not today or yesterday.`);
        return 0;
    }

    let currentDateStr = lastEntryDate;
    streak = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prevEntryDateStr = getDateString(sorted[i].date);
        if (prevEntryDateStr === currentDateStr) continue;

        const d1 = new Date(currentDateStr);
        const d2 = new Date(prevEntryDateStr);
        const diffDays = Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
        console.log(`Iteration ${i}: Comparing ${currentDateStr} to ${prevEntryDateStr} -> diffDays=${diffDays}`);

        if (diffDays === 1) {
            streak++;
            currentDateStr = prevEntryDateStr;
        } else {
            console.log(`Gap Found at Iteration ${i}: diffDays=${diffDays}`);
            break;
        }
    }
    return streak;
};

const calculateXP = (entries) => {
    let totalXP = 0;
    entries.forEach(entry => {
        totalXP += 10;
        if (entry.data?.mood) totalXP += 5;
        const habits = Object.keys(entry.data || {}).filter(k => k !== 'mood' && !k.endsWith('_note'));
        habits.forEach(h => {
            const val = entry.data[h];
            if (val !== 0 && val !== false && val !== '') totalXP += 2;
        });
    });
    return totalXP;
};

async function simulate() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');
        const activeId = '6979391721b2108211c22c47';

        const entries = await db.collection('entries').find({
            $or: [
                { userId: activeId },
                { userId: new ObjectId(activeId) }
            ]
        }).toArray();

        console.log(`Total Entries: ${entries.length}`);
        const streak = calculateStreak(entries);
        const xp = calculateXP(entries);
        const level = Math.floor(xp / 100) + 1;

        console.log(`\nFINAL SIMULATION RESULT:`);
        console.log(`Streak: ${streak}D`);
        console.log(`XP: ${xp}`);
        console.log(`Level: ${level}`);

    } finally {
        await client.close();
    }
}

simulate();
