const { MongoClient, ObjectId } = require('mongodb');

async function seed() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        // Target THE ACTIVE SESSION ID
        const activeId = '6979391721b2108211c22c4b';

        console.log(`Purging existing entries for ${activeId}...`);
        await db.collection('entries').deleteMany({ userId: activeId });
        await db.collection('entries').deleteMany({ userId: new ObjectId(activeId) });

        const entries = [];
        // 30 days ending Jan 27, 2026
        const endDate = new Date('2026-01-27');
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 29); // 30 days total

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            // DNA Profile: 100% Consistency
            const mood = 4; // 'Happy' (Numerical 4 in preprocessor)
            const gym = 1;
            const mantra = 1;
            const grass = 1;
            const rotting = 0;
            const social = 10;

            // "Intervention" note on Jan 26
            const isTargetNoteDay = date.getFullYear() === 2026 && date.getMonth() === 0 && date.getDate() === 26;
            const moodNote = isTargetNoteDay ?
                "Intervention: Identifies patients with low questionnaire completion -> Contacts patient/family." :
                "Stoic protocol maintained. Peak focus achieved.";

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
                    mood_note: moodNote
                }
            });
        }

        console.log(`Inserting 30 days of Perfect DNA for The Monk...`);
        await db.collection('entries').insertMany(entries);

        // Update User stats
        console.log(`Updating Monk statistics...`);
        await db.collection('users').updateOne(
            { _id: new ObjectId(activeId) },
            {
                $set: {
                    name: "The Stoic Monk",
                    email: "monk@mood.com",
                    level: 30, // Level up for peak consistency
                    xp: 3000,
                    streak: 30
                }
            }
        );

        console.log("SUCCESS: 30-day DNA established. Jan 28 is EMPTY for testing.");

    } finally {
        await client.close();
    }
}

seed();
