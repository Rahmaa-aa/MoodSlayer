const { MongoClient, ObjectId } = require('mongodb');

async function seed() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';

        console.log("Purging all entries for active user...");
        await db.collection('entries').deleteMany({ userId: activeId });

        const entries = [];
        const endDate = new Date('2026-01-27');
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 29);

        for (let i = 0; i < 30; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            date.setHours(12, 0, 0, 0); // Solid noon for date-rounding safety

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

        console.log(`Inserting 30 days of 100% Consistent DNA...`);
        await db.collection('entries').insertMany(entries);

        await db.collection('users').updateOne(
            { _id: new ObjectId(activeId) },
            {
                $set: {
                    level: 30,
                    streak: 30,
                    xp: 3000
                }
            }
        );

        console.log("RE-SEED SUCCESSFUL. Jan 28 is EMPTY.");

    } finally {
        await client.close();
    }
}

seed();
