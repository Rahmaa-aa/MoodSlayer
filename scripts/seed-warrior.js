const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedWarrior() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const email = 'warrior@mood.com';
        const password = await bcrypt.hash('warrior123', 10);

        // 1. Create User
        const warriorUser = {
            name: 'Weekend Warrior',
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
            { $set: warriorUser },
            { upsert: true }
        );

        const user = await db.collection('users').findOne({ email: email });
        const userId = user._id.toString();

        // 2. Generate 30 days of data
        const entries = [];
        const now = new Date();
        const moodMap = { 'Happy': 'Happy', 'Sad': 'Sad' };

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const day = date.getDay(); // 0 = Sun, 6 = Sat

            let entryData = {
                mood: 'Sad',
                touch_grass: true,
                gym_log: true,
                rotting_time: 0,
                daily_mantra: true
            };

            // Weekend (Sat=6, Sun=0)
            if (day === 0 || day === 6) {
                entryData.mood = 'Happy';
                entryData.gym_log = false;
                entryData.rotting_time = 5;
            }

            entries.push({
                userId: userId,
                date: dateStr,
                data: entryData,
                note: day === 0 || day === 6 ? 'Weekend rot is glorious.' : 'Weekday grind is exhausting.',
                createdAt: new Date()
            });
        }

        // 3. Clear and insert entries
        await db.collection('entries').deleteMany({ userId: userId });
        await db.collection('entries').insertMany(entries);

        console.log(`WEEKEND WARRIOR SEEDED: ${email}`);
        console.log(`Injected 30 days of history.`);

    } finally {
        await client.close();
    }
}

seedWarrior();
