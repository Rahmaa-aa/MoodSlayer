const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log('--- USER AUDIT ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => {
            console.log(`Name: ${u.name}, ID: ${u._id}, Type: ${typeof u._id}`);
        });

        console.log('\n--- COLLECTION STATS ---');
        const userCount = await db.collection('users').countDocuments();
        const entryCount = await db.collection('entries').countDocuments();
        console.log(`Total Users: ${userCount}, Total Entries: ${entryCount}`);

        console.log('\n--- ENTRY SAMPLE ---');
        const entries = await db.collection('entries').find({}).limit(1).toArray();
        if (entries.length > 0) {
            console.log('Sample Entry:', JSON.stringify(entries[0], null, 2));
        }

        console.log('\n--- UNIQUE USER_IDS IN ENTRIES ---');
        const uniqueIds = await db.collection('entries').distinct("userId");
        console.log('Unique IDs found in entries:', uniqueIds);

    } finally {
        await client.close();
    }
}

debug();
