const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        for (const col of collections) {
            console.log(`\n--- ${col.name} SAMPLE ---`);
            const sample = await db.collection(col.name).find({}).limit(3).toArray();
            console.log(JSON.stringify(sample, null, 2));

            console.log(`Searching ${col.name} for "Intervention"...`);
            const all = await db.collection(col.name).find({}).toArray();
            all.forEach(doc => {
                if (JSON.stringify(doc).includes('Intervention') || JSON.stringify(doc).includes('patient')) {
                    console.log(`MATCH FOUND in ${col.name}:`);
                    console.log(JSON.stringify(doc, null, 2));
                }
            });
        }

    } finally {
        await client.close();
    }
}

debug();
