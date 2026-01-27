/**
 * Neural Cluster Seeding Script
 * Generates 5 distinct user profiles with unique behavioral "signatures"
 * for end-to-end ML stress testing.
 */

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const PERSONAS = [
    {
        name: 'The Monk',
        email: 'monk@mood.com',
        pattern: 'stoic',
        desc: 'Perfect routine. High Gym/Mantra, Low Rotting. Always Happy.'
    },
    {
        name: 'Chaos Agent',
        email: 'chaos@mood.com',
        pattern: 'random',
        desc: 'Zero consistency. Random inputs. Low Neural Stability.'
    },
    {
        name: 'Weekend Warrior',
        email: 'warrior@mood.com',
        pattern: 'bipolar_week',
        desc: 'Happy Rotter on weekends. Sad Gym-goer on weekdays.'
    },
    {
        name: 'Glitch Entity',
        email: 'glitch@mood.com',
        pattern: 'anomalous',
        desc: 'Perfect for 20 days, then 10 days of complete silence/bad vibes.'
    },
    {
        name: 'Vibe Shifter',
        email: 'shifter@mood.com',
        pattern: 'transition',
        desc: 'Phase 1: Sad/Yoga. Phase 2: Happy/Gym. Tests Archetype clustering.'
    }
];

const seedCluster = async () => {
    try {
        await client.connect();
        const db = client.db('mood_tracker');
        const usersCol = db.collection('users');
        const entriesCol = db.collection('entries');
        const trackablesCol = db.collection('trackables');

        console.log('--- STARTING NEURAL CLUSTER SEEDING ---');

        for (const p of PERSONAS) {
            // 1. Create/Update User
            const hashedPassword = await bcrypt.hash('password123', 10);
            const user = await usersCol.findOneAndUpdate(
                { email: p.email },
                {
                    $set: {
                        name: p.name,
                        password: hashedPassword,
                        createdAt: new Date(),
                        level: 1,
                        xp: 0,
                        streak: 0,
                        trackables: [
                            { id: 'touch_grass', name: 'Touch Grass', type: 'boolean', category: 'Mental Health' },
                            { id: 'rotting_time', name: 'Rotting Time', type: 'number', category: 'Self Care', unit: 'HRS' },
                            { id: 'gym_log', name: 'Gym Log', type: 'boolean', category: 'Fitness' },
                            { id: 'daily_mantra', name: 'Daily Mantra', type: 'boolean', category: 'Mindfulness' }
                        ]
                    }
                },
                { upsert: true, returnDocument: 'after' }
            );

            const userId = user._id.toString();
            console.log(`Seeding User: ${p.name} (${userId})`);

            // 2. Clear old entries
            await entriesCol.deleteMany({ userId: userId });

            // 3. Generate 30 days of data
            const entries = [];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            for (let i = 0; i < 30; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dayOfWeek = date.getDay();

                let data = { mood: 'Chill' };

                if (p.pattern === 'stoic') {
                    data = { mood: 'Happy', touch_grass: true, gym_log: true, daily_mantra: true, rotting_time: 0.5 };
                }
                else if (p.pattern === 'random') {
                    data = {
                        mood: ['Happy', 'Sad', 'Chill', 'Energetic'][Math.floor(Math.random() * 4)],
                        touch_grass: Math.random() > 0.5,
                        gym_log: Math.random() > 0.5,
                        rotting_time: Math.random() * 8
                    };
                }
                else if (p.pattern === 'bipolar_week') {
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    data = isWeekend
                        ? { mood: 'Happy', rotting_time: 7, touch_grass: true }
                        : { mood: 'Sad', gym_log: true, rotting_time: 1 };
                }
                else if (p.pattern === 'anomalous') {
                    if (i < 20) {
                        data = { mood: 'Happy', touch_grass: true, daily_mantra: true };
                    } else {
                        data = { mood: 'Sad', rotting_time: 10, touch_grass: false };
                    }
                }
                else if (p.pattern === 'transition') {
                    if (i < 15) {
                        data = { mood: 'Chill', daily_mantra: true, gym_log: false };
                    } else {
                        data = { mood: 'Energetic', daily_mantra: false, gym_log: true };
                    }
                }

                entries.push({
                    userId,
                    date: new Date(date),
                    data,
                    createdAt: new Date()
                });
            }

            await entriesCol.insertMany(entries);
            console.log(`Successfully seeded 30 days for ${p.name}`);
        }

        console.log('--- NEURAL CLUSTER SEEDED SUCCESSFULLY ---');

    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await client.close();
    }
};

seedCluster();
