const { MongoClient, ObjectId } = require('mongodb');

async function restore() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        // 1. Find the target "The Monk" user
        const monkUser = await db.collection('users').findOne({ name: "The Monk" });
        if (!monkUser) {
            console.log("CRITICAL: Could not find user 'The Monk'");
            return;
        }
        const monkId = monkUser._id.toString();
        console.log(`Target User ID (The Monk): ${monkId}`);

        // 2. Find the user "hih" (where I accidentally moved the data)
        const hihUser = await db.collection('users').findOne({ name: "hih" });
        const hihId = hihUser ? hihUser._id.toString() : null;
        console.log(`Accidental Target ID (hih): ${hihId}`);

        if (!hihId) {
            console.log("Could not find user 'hih' to pull data from.");
            return;
        }

        // 3. Move entries BACK to The Monk
        console.log(`Moving entries from ${hihId} back to ${monkId}...`);
        const result = await db.collection('entries').updateMany(
            { userId: hihId },
            { $set: { userId: monkId } }
        );
        console.log(`Restored ${result.modifiedCount} entries to The Monk.`);

    } finally {
        await client.close();
    }
}

restore();
