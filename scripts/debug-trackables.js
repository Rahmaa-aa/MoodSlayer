const { MongoClient } = require('mongodb');
async function f() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');
        const user = await db.collection('users').findOne({ trackables: { $exists: true, $not: { $size: 0 } } });
        if (user) {
            console.log(JSON.stringify(user.trackables, null, 2));
        } else {
            console.log("No trackables found");
        }
    } finally {
        await client.close();
    }
}
f();
