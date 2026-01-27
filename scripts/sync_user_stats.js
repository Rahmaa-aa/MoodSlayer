/**
 * Sync User Stats script
 * Recalculates streak, XP, and Level for 'hih' and updates the database.
 */

const { MongoClient, ObjectId } = require('mongodb');

// Duplicate logic since we are running in Node (cjs context)
const calculateStreak = (entries) => {
    if (!entries || entries.length === 0) return 0;
    const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const getDateString = (date) => new Date(date).toISOString().split('T')[0];
    const today = getDateString(new Date());
    const lastEntryDate = getDateString(sorted[0].date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateString(yesterday);

    if (lastEntryDate !== today && lastEntryDate !== yesterdayStr) return 0;

    let streak = 1;
    let currentDate = new Date(sorted[0].date);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < sorted.length; i++) {
        const prevEntryDate = new Date(sorted[i].date);
        prevEntryDate.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(currentDate - prevEntryDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak++;
            currentDate = prevEntryDate;
        } else if (diffDays === 0) {
            continue;
        } else {
            break;
        }
    }
    return streak;
};

const calculateXP = (entries) => {
    let xp = 0;
    entries.forEach(e => {
        xp += 10;
        if (e.data?.mood) xp += 5;
        const habits = Object.keys(e.data || {}).filter(k => k !== 'mood' && !k.endsWith('_note'));
        habits.forEach(h => { if (e.data[h]) xp += 2; });
    });
    return xp;
};

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function sync() {
    try {
        await client.connect();
        const db = client.db('mood_tracker');
        const userId = '6977f4432a91a015305d15e0'; // hih

        const entries = await db.collection('entries').find({
            userId: userId
        }).toArray();

        const streak = calculateStreak(entries);
        const xp = calculateXP(entries);
        const level = Math.floor(xp / 100) + 1;

        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { streak, xp, level } }
        );

        console.log(`SYNC SUCCESS: Streak=${streak}, XP=${xp}, Level=${level}`);
    } finally {
        await client.close();
    }
}

sync();
