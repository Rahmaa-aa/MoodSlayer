/**
 * Seed Real User Data script for MoodSlayer
 * Populates 30 days of patterned history for a specific userId.
 */

const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const userId = '6977f4432a91a015305d15e0'; // User: hih

const seedData = async () => {
    try {
        await client.connect();
        const db = client.db('mood_tracker');
        const entriesCollection = db.collection('entries');

        // 1. Clear existing entries for this user
        // We use both string and hih IDs just in case
        await entriesCollection.deleteMany({
            $or: [
                { userId: userId },
                { userId: new ObjectId(userId) }
            ]
        });

        const data = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        for (let i = 0; i < 31; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay();

            // Pattern:
            // High "touch_grass" + Mid "rotting_time" = Happy/Energetic
            // Weekend rotting time usually higher
            // Gym on Mon, Wed, Fri (1, 3, 5)

            const touchGrass = Math.random() > 0.3;
            const gym = [1, 3, 5].includes(dayOfWeek);
            const mantra = Math.random() > 0.4;
            let rottingTime = (dayOfWeek === 0 || dayOfWeek === 6) ? 4 + Math.random() * 4 : Math.random() * 3;

            let score = 2; // Chill
            if (touchGrass) score += 1;
            if (gym) score += 1;
            if (rottingTime > 5) score -= 1;
            if (mantra) score += 0.5;

            let mood;
            if (score >= 3.5) mood = 'Happy';
            else if (score >= 2.8) mood = 'Energetic';
            else if (score >= 1.8) mood = 'Chill';
            else mood = 'Sad';

            data.push({
                userId: userId, // Keep as string for this setup
                date: new Date(date),
                data: {
                    mood,
                    touch_grass: touchGrass,
                    rotting_time: Number(rottingTime.toFixed(1)),
                    gym_log: gym,
                    daily_mantra: mantra
                },
                createdAt: new Date()
            });
        }

        const result = await entriesCollection.insertMany(data);
        console.log(`Successfully seeded ${result.insertedCount} entries for user ${userId}`);

    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await client.close();
    }
};

seedData();
