const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log('--- TRACKABLES ---');
        const trackables = await db.collection('trackables').find({}).toArray();
        trackables.forEach(t => {
            console.log(JSON.stringify(t, null, 2));
        });

    } finally {
        await client.close();
    }
}

debug();
