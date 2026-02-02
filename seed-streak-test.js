const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb://localhost:27017"; // Adjust if your URI is different
const dbName = "mood_tracker";

async function seedTestUser() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        const users = db.collection('users');
        const entries = db.collection('entries');

        const email = "streak@test.com";
        const password = await bcrypt.hash("password123", 10);
        const userIdString = new ObjectId().toString();
        const userId = new ObjectId(userIdString);

        // 1. Create User
        await users.deleteOne({ email });
        await users.insertOne({
            _id: userId,
            name: "StreakTester",
            email,
            password,
            level: 1,
            xp: 0,
            streak: 0,
            bestStreak: 25,
            survivalMode: false,
            volitionShield: false,
            createdAt: new Date()
        });

        console.log(`User created: ${email} | ID: ${userIdString}`);

        // 2. Create 30 days of data with a 78h gap (3.25 days)
        // Today is Feb 2, 12:51. 78 hours ago was Jan 30, 06:51.
        // We will log entries from 35 days ago up until Jan 30.

        const now = new Date();
        const testEntries = [];

        // Gap is 78 hours = 3.25 days.
        // We log up to 4 days ago.
        for (let i = 4; i <= 34; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            testEntries.push({
                userId: userIdString,
                date: date,
                createdAt: new Date(date), // Logged on time
                data: {
                    mood: 'Chill',
                    exercise: true,
                    meditation: true
                }
            });
        }

        await entries.deleteMany({ userId: userIdString });
        await entries.insertMany(testEntries);

        console.log(`Seeded ${testEntries.length} entries. Gap starts from ${new Date(now.getTime() - (78 * 60 * 60 * 1000)).toLocaleString()}`);
        console.log("LOGIN CREDENTIALS:");
        console.log(`Email: ${email}`);
        console.log("Password: password123");

    } finally {
        await client.close();
    }
}

seedTestUser();
