const { MongoClient, ObjectId } = require('mongodb');

async function audit() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log('--- USER INDEX ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`));

        console.log('\n--- LATEST ENTRIES (ALL USERS) ---');
        const entries = await db.collection('entries').find({}).sort({ date: -1 }).limit(10).toArray();
        entries.forEach(e => {
            console.log(`- Date: ${e.date}, UserID: ${e.userId}, Content: ${JSON.stringify(e.data).substring(0, 50)}...`);
        });

        console.log('\n--- ENTRY OWNER COUNTS ---');
        const counts = await db.collection('entries').aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]).toArray();
        counts.forEach(c => console.log(`- UserID ${c._id} has ${c.count} entries.`));

    } finally {
        await client.close();
    }
}

audit();
