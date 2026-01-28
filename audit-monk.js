const { MongoClient, ObjectId } = require('mongodb');

async function audit() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const monkId = '6979391721b2108211c22c4b';
        const user = await db.collection('users').findOne({ _id: new ObjectId(monkId) });

        if (user) {
            console.log(`--- USER AUDIT: ${user.name} ---`);
            console.log('Trackables:', JSON.stringify(user.trackables, null, 2));
            console.log('Current Stats:', { level: user.level, xp: user.xp, streak: user.streak });
        } else {
            console.log("User not found.");
        }

    } finally {
        await client.close();
    }
}

audit();
