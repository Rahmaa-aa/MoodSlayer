const { MongoClient, ObjectId } = require('mongodb');

async function audit() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const ids = ['6979391721b2108211c22c47', '6979391721b2108211c22c4b'];
        for (const id of ids) {
            const count = await db.collection('entries').countDocuments({ userId: id });
            const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
            console.log(`User: ${user ? user.name : 'NONE'}, ID: ${id}, EntryCount: ${count}`);
        }

    } finally {
        await client.close();
    }
}

audit();
