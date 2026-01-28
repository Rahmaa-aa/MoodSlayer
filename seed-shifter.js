const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedShifter() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const email = 'shifter@mood.com';
        const password = await bcrypt.hash('shifter123', 10);

        // 1. Create User
        const shifterUser = {
            name: 'Vibe Shifter',
            email: email,
            password: password,
            level: 1,
            xp: 0,
            streak: 0,
            trackables: [
                { id: 'gym_log', name: 'Gym Log', category: 'Fitness', type: 'boolean' },
                { id: 'daily_yoga', name: 'Daily Yoga', category: 'Fitness', type: 'boolean' },
                { id: 'rotting_time', name: 'Rotting Time', category: 'Self Care', type: 'number', unit: 'HRS' }
            ],
            createdAt: new Date()
        };

        await db.collection('users').updateOne(
            { email: email },
            { $set: shifterUser },
            { upsert: true }
        );

        const user = await db.collection('users').findOne({ email: email });
        const userId = user._id.toString();

        // 2. Generate 30 days of data
        const entries = [];
        const now = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            let entryData;
            // Phase 1 (Days 1-25): Sad/Yoga
            if (i >= 4) {
                entryData = {
                    mood: 'Sad',
                    gym_log: false,
                    daily_yoga: true,
                    rotting_time: 2
                };
            } else {
                // Phase 2 (Days 26-30): Happy/Gym (Transition start)
                entryData = {
                    mood: 'Happy',
                    gym_log: true,
                    daily_yoga: false,
                    rotting_time: 0
                };
            }

            entries.push({
                userId: userId,
                date: dateStr,
                data: entryData,
                note: i >= 4 ? 'Yoga and low vibes.' : 'Gym shift start.',
                createdAt: new Date()
            });
        }

        // 3. Clear and insert entries
        await db.collection('entries').deleteMany({ userId: userId });
        await db.collection('entries').insertMany(entries);

        console.log(`VIBE SHIFTER SEEDED: ${email}`);
        console.log(`Injected 30 days (26d Yoga -> 4d Gym).`);

    } finally {
        await client.close();
    }
}

seedShifter();
