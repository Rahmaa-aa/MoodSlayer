const { MongoClient, ObjectId } = require('mongodb');

async function search() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const threshold = new Date('2026-01-29');
        const rogue = await db.collection('entries').findOne({ date: { $gte: threshold } });

        if (rogue) {
            const user = await db.collection('users').findOne({ _id: new ObjectId(rogue.userId) })
                || await db.collection('users').findOne({ _id: rogue.userId });

            console.log('--- ROGUE IDENTITY DETECTED ---');
            console.log(`Entry Date: ${rogue.date}`);
            console.log(`UserID: ${rogue.userId}`);
            console.log(`User Name: ${user ? user.name : 'Unknown'}`);
            console.log(`User Email: ${user ? user.email : 'Unknown'}`);
        } else {
            console.log('No Jan 29 entries found.');
            // Fallback: check Jan 28
            const todayEntry = await db.collection('entries').findOne({ date: { $gte: new Date('2026-01-28') } });
            if (todayEntry) {
                const user = await db.collection('users').findOne({ _id: new ObjectId(todayEntry.userId) })
                    || await db.collection('users').findOne({ _id: todayEntry.userId });
                console.log('--- TODAY IDENTITY DETECTED ---');
                console.log(`Entry Date: ${todayEntry.date}`);
                console.log(`UserID: ${todayEntry.userId}`);
                console.log(`User Name: ${user ? user.name : 'Unknown'}`);
            }
        }

    } finally {
        await client.close();
    }
}

search();
