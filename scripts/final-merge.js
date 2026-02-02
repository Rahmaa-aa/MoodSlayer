const { MongoClient, ObjectId } = require('mongodb');

async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const phantomId = '6979391721b2108211c22c4b';

        console.log(`Locking Level 30 into active account: ${activeId}...`);
        await db.collection('users').updateOne(
            { _id: new ObjectId(activeId) },
            {
                $set: {
                    level: 30,
                    xp: 3000,
                    streak: 31,
                    name: 'The Stoic Monk'
                }
            }
        );

        console.log(`Removing phantom: ${phantomId}...`);
        await db.collection('users').deleteOne({ _id: new ObjectId(phantomId) });
        await db.collection('entries').deleteMany({ userId: phantomId });

        console.log('Merge complete. Stoic status secured.');

    } finally {
        await client.close();
    }
}

run();
