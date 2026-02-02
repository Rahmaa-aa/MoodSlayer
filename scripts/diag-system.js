const { MongoClient, ObjectId } = require('mongodb');

async function diag() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log("--- SYSTEM DIAGNOSTIC ---");

        // Find Chaos and Monk
        const monk = await db.collection('users').findOne({ name: 'The Stoic Monk' });
        const chaos = await db.collection('users').findOne({ email: 'chaos@mood.com' });

        const targets = [];
        if (monk) targets.push(monk);
        if (chaos) targets.push(chaos);

        for (const u of targets) {
            console.log(`\nUSER: ${u.name} (${u.email || 'no email'})`);
            console.log(`ID: ${u._id}`);
            console.log(`Stats: LVL ${u.level}, XP ${u.xp}, Streak ${u.streak}`);
            console.log(`Trackables Count: ${u.trackables?.length || 0}`);
            if (u.trackables) {
                console.log(`Trackables: ${JSON.stringify(u.trackables)}`);
            }

            // Check entries
            const entriesCount = await db.collection('entries').countDocuments({
                $or: [{ userId: u._id.toString() }, { userId: u._id }]
            });
            console.log(`Entries Count: ${entriesCount}`);
        }

    } finally {
        await client.close();
    }
}

diag();
