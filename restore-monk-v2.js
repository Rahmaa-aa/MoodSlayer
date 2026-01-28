const { MongoClient, ObjectId } = require('mongodb');

async function seed() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        // Use the active Monk ID from previous audit
        const monkId = '6979391721b2108211c22c4b';

        // 1. Purge any existing (possibly corrupt) entries for this user
        console.log(`Purging existing entries for ${monkId}...`);
        await db.collection('entries').deleteMany({ userId: monkId });
        await db.collection('entries').deleteMany({ userId: new ObjectId(monkId) });

        const entries = [];
        const baseDate = new Date('2026-01-01');

        // 2. Generate 27 days of patterned data (Jan 1 - Jan 27)
        for (let i = 0; i < 27; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);

            // Pattern: High social battery, low rotting, high gym
            const mood = i % 7 === 0 ? 9 : 8; // Dip on Sundays?
            const gym = i % 2 === 0 ? 1 : 0;
            const grass = 1;
            const rotting = 0;
            const social = 8 + (i % 3);

            // The specific "Intervention" clinical note the user requested
            const moodNote = i === 25 ? "Intervention: Identifies patients with low questionnaire completion -> Contacts patient/family." : "Standard observation log.";

            entries.push({
                userId: monkId,
                date: date,
                data: {
                    mood: mood,
                    "Touch Grass": grass,
                    "Rotting Time": rotting,
                    "Gym Log": gym,
                    "Social Battery": social,
                    "mood_note": moodNote
                }
            });
        }

        console.log(`Inserting 27 entries for The Monk...`);
        await db.collection('entries').insertMany(entries);

        // 3. Reset User stats to force recalculation
        console.log(`Resetting Monk user stats...`);
        await db.collection('users').updateOne(
            { _id: new ObjectId(monkId) },
            { $set: { level: 14, xp: 1350, streak: 27 } }
        );

        console.log("RESTORE_COMPLETE: The Monk is back with Jan 1-27 history.");

    } finally {
        await client.close();
    }
}

seed();
