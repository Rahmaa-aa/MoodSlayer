const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const monkId = '6979391721b2108211c22c4b';
        const entries = await db.collection('entries').find({ userId: monkId }).toArray();

        console.log(`Found ${entries.length} entries for ${monkId}`);
        entries.forEach(e => {
            const dataStr = JSON.stringify(e.data);
            if (dataStr.includes('Intervention') || dataStr.includes('patient')) {
                console.log(`MATCH FOUND in entry ${e.date}:`);
                console.log(dataStr);
            }
        });

        // Also check "hih" just in case
        const hihId = '6977f4432a91a015305d15e0';
        const hihEntries = await db.collection('entries').find({ userId: hihId }).toArray();
        console.log(`Found ${hihEntries.length} entries for hih`);
        hihEntries.forEach(e => {
            const dataStr = JSON.stringify(e.data);
            if (dataStr.includes('Intervention') || dataStr.includes('patient')) {
                console.log(`MATCH FOUND (hih) in entry ${e.date}:`);
                console.log(dataStr);
            }
        });

    } finally {
        await client.close();
    }
}

debug();
