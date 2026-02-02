const { MongoClient, ObjectId } = require('mongodb');

async function migrate() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        // Find the user "hih"
        const targetUser = await db.collection('users').findOne({ name: "hih" });
        if (!targetUser) {
            console.log("Could not find user 'hih'");
            return;
        }
        const targetId = targetUser._id.toString();
        console.log(`Target User ID (hih): ${targetId}`);

        // Orphaned entries are usually under '6979391721b2108211c22c47'
        const orphanId = '6979391721b2108211c22c47';

        console.log(`Moving entries from ${orphanId} to ${targetId}...`);
        const result = await db.collection('entries').updateMany(
            { userId: orphanId },
            { $set: { userId: targetId } }
        );
        console.log(`Updated ${result.modifiedCount} entries.`);

        // Also check if some entries are under an ObjectId version
        const resultObj = await db.collection('entries').updateMany(
            { userId: new ObjectId(orphanId) },
            { $set: { userId: targetId } }
        );
        console.log(`Updated ${resultObj.modifiedCount} entries (ObjectId version).`);

        // Force user document stats to re-sync
        await db.collection('users').updateOne(
            { _id: targetUser._id },
            { $set: { streak: 0, xp: 0, level: 1 } } // Resetting to force trigger the passive sync
        );

    } finally {
        await client.close();
    }
}

migrate();
