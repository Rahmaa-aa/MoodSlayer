const { MongoClient, ObjectId } = require('mongodb');

async function superAudit() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const user = await db.collection('users').findOne({ _id: new ObjectId(activeId) });
        const entries = await db.collection('entries').find({ userId: activeId }).toArray();

        console.log(`--- SUPER AUDIT: ${activeId} ---`);
        console.log(`Trackables DEFINED:`, user.trackables.map(t => ({ id: t.id, name: t.name })));

        // Check first entry keys
        if (entries.length > 0) {
            console.log(`\nEntry Data Keys (Sample):`, Object.keys(entries[0].data));

            // Analyze consistency for each trackable
            user.trackables.forEach(t => {
                const values = entries.map(e => e.data?.[t.id]);
                const unique = Array.from(new Set(values));
                console.log(`Trackable "${t.name}" (ID: ${t.id}) -> Unique Values in Entries: [${unique.join(', ')}]`);
            });
        }

    } finally {
        await client.close();
    }
}

superAudit();
