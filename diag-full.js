const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log('--- ALL USERS ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => {
            console.log(JSON.stringify({
                _id: u._id,
                name: u.name,
                email: u.email,
                idText: u.id // Some systems store id separately
            }, null, 2));
        });

        console.log('\n--- ENTRY OWNER COUNTS ---');
        const counts = await db.collection('entries').aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]).toArray();
        console.log(JSON.stringify(counts, null, 2));

    } finally {
        await client.close();
    }
}

debug();
