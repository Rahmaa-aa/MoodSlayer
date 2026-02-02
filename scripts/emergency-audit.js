const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log('--- USER TABLE (FULL) ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => {
            console.log(`- Name: "${u.name}", ID: ${u._id} (${typeof u._id}), Email: ${u.email}`);
        });

        console.log('\n--- ENTRY OWNER DISTRIBUTION ---');
        const counts = await db.collection('entries').aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]).toArray();
        counts.forEach(c => {
            console.log(`- UserID: "${c._id}" has ${c.count} entries`);
        });

        // Find matches between user names and entry IDs
        console.log('\n--- IDENTITY MATCHING ---');
        for (const user of users) {
            const userIdStr = user._id.toString();
            const hasEntries = counts.find(c => c._id === userIdStr || (c._id && c._id.toString() === userIdStr));
            console.log(`User "${user.name}" (${userIdStr}) has entries in DB? ${hasEntries ? 'YES (' + hasEntries.count + ')' : 'NO'}`);
        }

    } finally {
        await client.close();
    }
}

debug();
