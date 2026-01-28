const { MongoClient, ObjectId } = require('mongodb');

async function auditAPI() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';

        // Match the logic in app/api/entries/route.js
        const entries = await db.collection('entries').find({
            $or: [
                { userId: activeId },
                { userId: new ObjectId(activeId) }
            ]
        }).sort({ date: 1 }).toArray();

        console.log(`--- API DATA SOURCE AUDIT ---`);
        console.log(`Matched Entries: ${entries.length}`);

        const dates = entries.map(e => e.date.toISOString().split('T')[0]);
        const uniqueDates = new Set(dates);

        console.log(`Unique Dates: ${uniqueDates.size}`);
        if (uniqueDates.size !== entries.length) {
            console.log(`[ALERT] DUPLICATE ENTRIES DETECTED: ${entries.length - uniqueDates.size} overlapping records.`);

            // Find which dates are duplicated
            const counts = {};
            dates.forEach(d => counts[d] = (counts[d] || 0) + 1);
            Object.keys(counts).filter(d => counts[d] > 1).forEach(d => {
                console.log(`  - Date ${d} has ${counts[d]} entries.`);
            });
        }

        // Check Rotting Time values
        const rottingVals = entries.map(e => e.data?.rotting_time);
        console.log(`Rotting Time Profile: [${Array.from(new Set(rottingVals)).join(', ')}]`);

    } finally {
        await client.close();
    }
}

auditAPI();
