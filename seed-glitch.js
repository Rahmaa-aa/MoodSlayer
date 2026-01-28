const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedGlitch() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const email = 'glitch@mood.com';
        const password = await bcrypt.hash('glitch123', 10);

        // 1. Create User
        const glitchUser = {
            name: 'Glitch Entity',
            email: email,
            password: password,
            level: 1,
            xp: 0,
            streak: 0,
            trackables: [
                { id: 'gym_log', name: 'Gym Log', category: 'Fitness', type: 'boolean' },
                { id: 'rotting_time', name: 'Rotting Time', category: 'Self Care', type: 'number', unit: 'HRS' }
            ],
            createdAt: new Date()
        };

        await db.collection('users').updateOne(
            { email: email },
            { $set: glitchUser },
            { upsert: true }
        );

        const user = await db.collection('users').findOne({ email: email });
        const userId = user._id.toString();

        // 2. Generate 30 days of data
        // 23 days of PERFECT (Monk-like)
        // 7 days of COLLAPSE (Chaos-like)
        const entries = [];
        const now = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            let entryData;
            // First 23 days: Perfect grinding
            if (i >= 7) {
                entryData = {
                    mood: 'Happy',
                    gym_log: true,
                    rotting_time: 0
                };
            } else {
                // Last 7 days: Total collapse (The Glitch)
                entryData = {
                    mood: 'Sad',
                    gym_log: false,
                    rotting_time: 8 // Extreme rotting
                };
            }

            entries.push({
                userId: userId,
                date: dateStr,
                data: entryData,
                note: i >= 7 ? 'The routine is perfect.' : 'SYSTEM_FAILURE: Total rot.',
                createdAt: new Date()
            });
        }

        // 3. Clear and insert entries
        await db.collection('entries').deleteMany({ userId: userId });
        await db.collection('entries').insertMany(entries);

        console.log(`GLITCH ENTITY SEEDED: ${email}`);
        console.log(`Injected 30 days (23d Perfect / 7d Collapse).`);

    } finally {
        await client.close();
    }
}

seedGlitch();
