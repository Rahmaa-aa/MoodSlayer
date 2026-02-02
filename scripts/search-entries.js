const { MongoClient, ObjectId } = require('mongodb');

async function search() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log('Searching all entries for "Intervention"...');
        const allEntries = await db.collection('entries').find({}).toArray();

        for (const entry of allEntries) {
            const dataStr = JSON.stringify(entry.data || {});
            if (dataStr.includes('Intervention') || dataStr.includes('patient')) {
                console.log(`\nMATCH FOUND!`);
                console.log(`Date: ${entry.date}`);
                console.log(`UserID: ${entry.userId}`);
                console.log(`Data: ${dataStr}`);
            }
        }

    } finally {
        await client.close();
    }
}

search();
