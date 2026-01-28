const { MongoClient, ObjectId } = require('mongodb');

async function audit() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const user = await db.collection('users').findOne({ _id: new ObjectId(activeId) });
        const entries = await db.collection('entries').find({ userId: activeId }).toArray();

        console.log(`--- ACTIVE USER: ${user ? user.name : 'MISSING'} ---`);
        console.log(`ID: ${activeId}`);
        console.log(`Entry Count: ${entries.length}`);

        if (entries.length > 0) {
            console.log('\nSample Entries:');
            entries.slice(-5).forEach(e => {
                console.log(`- Date: ${e.date}, Mood: ${e.data?.mood}, Note: ${e.data?.mood_note?.substring(0, 30)}...`);
            });
        }

        // Global check: Is there ANY other user with 'Monk' in the name?
        const others = await db.collection('users').find({ name: /Monk/i }).toArray();
        console.log('\n--- ALL USERS with "Monk" ---');
        others.forEach(o => console.log(`- Name: ${o.name}, ID: ${o._id}`));

    } finally {
        await client.close();
    }
}

audit();
