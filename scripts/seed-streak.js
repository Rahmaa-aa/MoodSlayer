const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedStreak() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const email = 'streak@mood.com';
        const password = await bcrypt.hash('streak123', 10);

        // 1. Find or Create User
        let user = await db.collection('users').findOne({ email: email });

        if (!user) {
            console.log('Creating new user...');
            const result = await db.collection('users').insertOne({
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
            });
            user = await db.collection('users').findOne({ _id: result.insertedId });
        } else {
            console.log('User exists, preserving high-water mark stats.');
            // Update trackables just in case
            await db.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: {
                        trackables: [
                            { id: 'gym_log', name: 'Gym Log', category: 'Fitness', type: 'boolean' },
                            { id: 'daily_yoga', name: 'Daily Yoga', category: 'Fitness', type: 'boolean' },
                            { id: 'rotting_time', name: 'Rotting Time', category: 'Self Care', type: 'number', unit: 'HRS' }
                        ]
                    }
                }
            );
        }

        const userId = user._id; // This is an ObjectId object

        // 2. Generate data with gaps (Jan 1-15, then Jan 21-28)
        const entries = [];

        // Phase 1: Jan 1 to Jan 15 (15 logs)
        for (let d = 1; d <= 15; d++) {
            entries.push({
                userId: userId, // Store as ObjectId!
                date: `2026-01-${d.toString().padStart(2, '0')}`,
                data: { mood: 'Chill', rotting_time: 1 },
                createdAt: new Date()
            });
        }

        // Phase 3: Jan 21 to Jan 28 (8 logs)
        for (let d = 21; d <= 28; d++) {
            entries.push({
                userId: userId, // Store as ObjectId!
                date: `2026-01-${d.toString().padStart(2, '0')}`,
                data: { mood: 'Energetic', gym_log: true },
                createdAt: new Date()
            });
        }

        // 3. Clear and insert entries
        // Delete all entries for this user (checking both string and ObjectId)
        await db.collection('entries').deleteMany({
            $or: [
                { userId: userId },
                { userId: userId.toString() }
            ]
        });

        await db.collection('entries').insertMany(entries);

        console.log(`STREAK TESTER SEEDED: ${email}`);
        console.log(`User ID: ${userId.toString()}`);
        console.log(`Phase 1: Jan 01-15 (15 logs)`);
        console.log(`Phase 2: Jan 16-20 (GAP)`);
        console.log(`Phase 3: Jan 21-28 (8 logs)`);
        console.log(`IMPORTANT: Restart your browser or clear cache to see the level update!`);

    } finally {
        await client.close();
    }
}

seedStreak();
