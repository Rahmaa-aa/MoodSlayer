const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function setPassword() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const password = await bcrypt.hash('password123', 10);

        await db.collection('users').updateOne(
            { email: 'chaos@mood.com' },
            { $set: { password: password } }
        );

        console.log("Chaos Agent password set to: password123");

    } finally {
        await client.close();
    }
}

setPassword();
