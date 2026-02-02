const { MongoClient, ObjectId } = require('mongodb');

async function unify() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47'; // The one the browser is using
        const sourceId = '6979391721b2108211c22c4b'; // The one with the seed data

        // 1. Wipe Jan 28 entries for ACTIVE user (to let them log it fresh)
        console.log(`Wiping Jan 28 phantom logs for ${activeId}...`);
        const todayStr = '2026-01-28';
        const start = new Date(todayStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(todayStr);
        end.setHours(23, 59, 59, 999);

        await db.collection('entries').deleteMany({
            userId: activeId,
            date: { $gte: start, $lte: end }
        });

        // 2. Move seed data from source to active
        console.log(`Moving seed data from ${sourceId} to ${activeId}...`);
        // First delete any overlaps in the seed range for the active user
        await db.collection('entries').deleteMany({ userId: activeId });

        const result = await db.collection('entries').updateMany(
            { userId: sourceId },
            { $set: { userId: activeId } }
        );
        console.log(`Moved ${result.modifiedCount} entries.`);

        // 3. Ensure User Profile is also peak
        await db.collection('users').updateOne(
            { _id: new ObjectId(activeId) },
            {
                $set: {
                    name: "The Stoic Monk",
                    email: "monk@mood.com",
                    level: 30,
                    xp: 3000,
                    streak: 30
                }
            }
        );

        console.log("UNIFICATION_COMPLETE: Active session now owns the 30-day DNA.");

    } finally {
        await client.close();
    }
}

unify();
