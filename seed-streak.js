const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedStreak() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const email = 'streak@mood.com';
        const password = await bcrypt.hash('streak123', 10);

        // 1. Create User
        const streakUser = {
            name: 'Streak Tester',
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
            { $set: streakUser },
            { upsert: true }
        );

        const user = await db.collection('users').findOne({ email: email });
        const userId = user._id.toString();

        // 2. Generate data with gaps
        // Current Time: 2026-01-28
        const entries = [];

        // Phase 1: Jan 1 to Jan 15 (15 logs) -> Best Streak: 15
        for (let d = 1; d <= 15; d++) {
            entries.push({
                userId: userId,
                date: `2026-01-${d.toString().padStart(2, '0')}`,
                data: { mood: 'Chill', rotting_time: 1 },
                createdAt: new Date()
            });
        }

        // Phase 2: Jan 16 to Jan 20 (EMPTY GAP)

        // Phase 3: Jan 21 to Jan 28 (8 logs) -> Current Streak: 8
        for (let d = 21; d <= 28; d++) {
            entries.push({
                userId: userId,
                date: `2026-01-${d.toString().padStart(2, '0')}`,
                data: { mood: 'Energetic', gym_log: true },
                createdAt: new Date()
            });
        }

        // 3. Clear and insert entries
        await db.collection('entries').deleteMany({ userId: userId });
        await db.collection('entries').insertMany(entries);

        console.log(`STREAK TESTER SEEDED: ${email}`);
        console.log(`Phase 1: Jan 01-15 (15 logs)`);
        console.log(`Phase 2: Jan 16-20 (GAP)`);
        console.log(`Phase 3: Jan 21-28 (8 logs)`);

    } finally {
        await client.close();
    }
}

seedStreak();
