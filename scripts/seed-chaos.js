const { MongoClient, ObjectId } = require('mongodb');

async function seed() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        console.log("Cleaning up previous Chaos Agent data...");
        await db.collection('users').deleteOne({ email: 'chaos@mood.com' });

        // 1. Create Chaos Agent User with proper Types
        const chaosUser = {
            name: 'Chaos Agent',
            email: 'chaos@mood.com',
            level: 1,
            xp: 0,
            streak: 0,
            trackables: [
                { id: 'touch_grass', name: 'Touch Grass', category: 'Mental Health', type: 'boolean' },
                { id: 'rotting_time', name: 'Rotting Time', category: 'Self Care', type: 'number', unit: 'HRS' },
                { id: 'gym_log', name: 'Gym Log', category: 'Fitness', type: 'boolean' },
                { id: 'daily_mantra', name: 'Daily Mantra', category: 'Mindfulness', type: 'boolean' }
            ],
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(chaosUser);
        const userId = result.insertedId.toString();
        console.log(`User created: ${userId}`);

        // 2. Generate 30 days of RANDOM behavior
        const entries = [];
        for (let i = 30; i >= 1; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(11, 0, 0, 0);

            entries.push({
                userId: userId,
                date: date,
                data: {
                    mood: ['Happy', 'Sad', 'Chill', 'Energetic'][Math.floor(Math.random() * 4)],
                    touch_grass: Math.random() > 0.5,
                    rotting_time: Math.floor(Math.random() * 6),
                    gym_log: Math.random() > 0.5,
                    daily_mantra: Math.random() > 0.5
                },
                createdAt: new Date()
            });
        }

        await db.collection('entries').deleteMany({ userId: userId });
        await db.collection('entries').insertMany(entries);

        console.log(`Injected 30 days of FIXED ENTROPY for ${userId}`);

    } finally {
        await client.close();
    }
}

seed();
