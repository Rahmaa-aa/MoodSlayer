const { MongoClient, ObjectId } = require('mongodb');

async function repair() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const sourceId = '6979391721b2108211c22c4b';

        // 1. SCORCHED EARTH: Delete ALL entries for BOTH accounts
        console.log("Purging all entries for Monk identities...");
        await db.collection('entries').deleteMany({ userId: activeId });
        await db.collection('entries').deleteMany({ userId: new ObjectId(activeId) });
        await db.collection('entries').deleteMany({ userId: sourceId });
        await db.collection('entries').deleteMany({ userId: new ObjectId(sourceId) });

        // 2. RE-SEED: 30 Days (Dec 29, 2025 - Jan 27, 2026)
        const entries = [];
        const endDate = new Date('2026-01-27');
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 29);

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            date.setHours(12, 0, 0, 0); // Noon to avoid boundary issues

            entries.push({
                userId: activeId,
                date: date,
                data: {
                    mood: 'Happy',
                    moodScore: 4,
                    gym_log: 1,
                    daily_mantra: 1,
                    touch_grass: 1,
                    rotting_time: 0,
                    social_battery: 10,
                    mood_note: date.getDate() === 26 ?
                        "Intervention: Identifies patients with low questionnaire completion -> Contacts patient/family." :
                        "Stoic protocol maintained."
                }
            });
        }

        console.log(`Inserting 30 days of Perfect DNA into ${activeId}...`);
        await db.collection('entries').insertMany(entries);

        // 3. FORCE STATS
        await db.collection('users').updateOne(
            { _id: new ObjectId(activeId) },
            {
                $set: {
                    name: "The Stoic Monk",
                    email: "monk@mood.com",
                    level: 30,
                    streak: 30,
                    xp: 3000
                }
            }
        );

        console.log("REPAIR_COMPLETE: Database is now in a clean, perfect state.");

    } finally {
        await client.close();
    }
}

repair();
