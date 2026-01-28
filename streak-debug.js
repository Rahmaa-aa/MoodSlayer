const { MongoClient, ObjectId } = require('mongodb');

async function audit() {
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
        }).sort({ date: -1 }).limit(10).toArray();

        console.log(`--- STREAK DEBUG AUDIT ---`);
        entries.forEach(e => {
            console.log(`Date: ${e.date.toISOString()} | String: ${e.date.toISOString().split('T')[0]} | ID: ${e._id}`);
        });

        // Test the calculateStreak logic locally
        const getDateString = (date) => new Date(date).toISOString().split('T')[0];

        if (entries.length > 0) {
            const todayStr = '2026-01-28';
            const yesterdayStr = '2026-01-27';

            const lastEntryDate = getDateString(entries[0].date);
            console.log(`\nLast Entry: ${lastEntryDate} vs Today: ${todayStr}`);

            if (entries.length > 1) {
                const nextEntryDate = getDateString(entries[1].date);
                console.log(`Next Entry: ${nextEntryDate} vs Yesterday: ${yesterdayStr}`);

                const d1 = new Date(lastEntryDate);
                const d2 = new Date(nextEntryDate);
                const diffDays = Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
                console.log(`Diff Days: ${diffDays}`);
            }
        }

    } finally {
        await client.close();
    }
}

audit();
