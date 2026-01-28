const { MongoClient, ObjectId } = require('mongodb');

async function wipeToday() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        console.log(`Wiping Jan 28 entries for User: ${activeId}...`);

        const todayStr = '2026-01-28';
        const start = new Date(todayStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(todayStr);
        end.setHours(23, 59, 59, 999);

        const result = await db.collection('entries').deleteMany({
            userId: activeId,
            date: { $gte: start, $lte: end }
        });

        console.log(`Successfully deleted ${result.deletedCount} entries for Jan 28.`);

    } finally {
        await client.close();
    }
}

wipeToday();
