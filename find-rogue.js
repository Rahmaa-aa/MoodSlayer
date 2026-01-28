const { MongoClient, ObjectId } = require('mongodb');

async function search() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log('Searching for entries on or after Jan 28, 2026...');
        const threshold = new Date('2026-01-28');
        const rogues = await db.collection('entries').find({
            date: { $gte: threshold }
        }).toArray();

        if (rogues.length === 0) {
            console.log('No entries found on or after Jan 28.');
        } else {
            rogues.forEach(r => {
                console.log(`FOUND ROGUE: Date: ${r.date}, UserID: ${r.userId}, Content: ${JSON.stringify(r.data)}`);
            });
        }

        // List all users again for matching
        console.log('\n--- ALL USERS ---');
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => console.log(`- ID: ${u._id}, Name: ${u.name}`));

    } finally {
        await client.close();
    }
}

search();
