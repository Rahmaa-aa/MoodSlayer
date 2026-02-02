const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const users = await db.collection('users').find({}).toArray();
        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u.name || u.email || 'Unknown';
        });

        console.log('--- USER TABLE ---');
        users.forEach(u => console.log(`- ${u.name} (ID: ${u._id})`));

        console.log('\n--- ENTRY OWNER ANALYSIS ---');
        const counts = await db.collection('entries').aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]).toArray();

        counts.forEach(c => {
            const owner = userMap[c._id ? c._id.toString() : 'null'];
            console.log(`- Owner: ${owner} (ID: ${c._id}) has ${c.count} entries`);
        });

    } finally {
        await client.close();
    }
}

debug();
