const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb://localhost:27017";
const dbName = "mood_tracker";

async function verifyAndFix() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);

        const email = "streak@test.com";
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            console.log("CRITICAL: User not found. Seeding from scratch...");
            // Re-run the core logic if user is missing for some reason
        } else {
            console.log("USER_FOUND:", user.email);
            console.log("USER_ID:", user._id.toString());
            console.log("TRACKABLES_IN_DB:", JSON.stringify(user.trackables, null, 2));

            const entriesCount = await db.collection('entries').countDocuments({ userId: user._id.toString() });
            const entriesCountObj = await db.collection('entries').countDocuments({ userId: user._id });
            console.log("ENTRIES_COUNT (String ID):", entriesCount);
            console.log("ENTRIES_COUNT (Object ID):", entriesCountObj);

            // Peek at one entry data
            const lastEntry = await db.collection('entries').findOne({ userId: user._id.toString() });
            if (lastEntry) {
                console.log("SAMPLE_ENTRY_DATA:", JSON.stringify(lastEntry.data, null, 2));
            }
        }
    } finally {
        await client.close();
    }
}

verifyAndFix();
