const { MongoClient, ObjectId } = require('mongodb');

async function audit() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const entries = await db.collection('entries').find({ userId: activeId }).toArray();
        const user = await db.collection('users').findOne({ _id: new ObjectId(activeId) });

        console.log(`User: ${user.name} (${activeId})`);
        console.log(`Entries found: ${entries.length}`);

        const summary = {};
        user.trackables.forEach(t => {
            summary[t.name] = { id: t.id, vals: [] };
        });

        entries.forEach(e => {
            user.trackables.forEach(t => {
                summary[t.name].vals.push(e.data?.[t.id]);
            });
        });

        Object.keys(summary).forEach(name => {
            const s = summary[name];
            const set = new Set(s.vals);
            console.log(`${name} (${s.id}): Unique = [${Array.from(set).join(', ')}] | Count = ${s.vals.length}`);
        });

    } finally {
        await client.close();
    }
}

audit();
