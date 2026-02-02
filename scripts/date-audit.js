const { MongoClient, ObjectId } = require('mongodb');

async function audit() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const entries = await db.collection('entries').find({ userId: activeId }).sort({ date: 1 }).toArray();

        console.log(`--- ENTRY DATE AUDIT for ${activeId} ---`);
        entries.forEach(e => {
            console.log(`Date: ${e.date.toISOString()} | LocalString: ${e.date.toLocaleString()}`);
        });

    } finally {
        await client.close();
    }
}

audit();
