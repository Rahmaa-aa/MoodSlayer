const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log('--- USERS ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => console.log(`User: ${u.name || u.email}, ID: ${u._id}, Type: ${typeof u._id}`));

        console.log('\n--- SAMPLE ENTRIES ---');
        const entries = await db.collection('entries').find({}).limit(5).toArray();
        entries.forEach(e => console.log(`Entry Date: ${e.date}, UserID: ${e.userId}, Type: ${typeof e.userId}`));

        console.log('\n--- COUNT PER USER ---');
        const counts = await db.collection('entries').aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]).toArray();
        counts.forEach(c => console.log(`UserID: ${c._id} has ${c.count} entries`));

    } finally {
        await client.close();
    }
}

debug();
