const { MongoClient, ObjectId } = require('mongodb');

async function audit() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const entries = await db.collection('entries').find({ userId: activeId }).sort({ date: 1 }).toArray();

        console.log(`--- DNA VARIANCE REPORT: ${activeId} ---`);
        console.log(`Total Entries: ${entries.length}`);

        const keys = ['mood', 'gym_log', 'daily_mantra', 'touch_grass', 'rotting_time', 'social_battery'];
        const stats = {};
        keys.forEach(k => stats[k] = new Set());

        entries.forEach(e => {
            keys.forEach(k => {
                const val = e.data?.[k];
                if (val !== undefined) stats[k].add(val);
            });
            // Check for multiple entries on the same day
            const dateStr = e.date.toISOString().split('T')[0];
            const dups = entries.filter(ent => ent.date.toISOString().split('T')[0] === dateStr);
            if (dups.length > 1) {
                console.log(`[DUPLICATE] Day ${dateStr} has ${dups.length} entries!`);
            }
        });

        console.log('\n--- VARIANCE STATS ---');
        keys.forEach(k => {
            console.log(`- ${k}: Unique Values: [${Array.from(stats[k]).join(', ')}]`);
        });

    } finally {
        await client.close();
    }
}

audit();
