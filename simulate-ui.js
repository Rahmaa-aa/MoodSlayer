const { prepareData, calculateCorrelations } = require('./lib/ml/preprocessor');
const { MongoClient, ObjectId } = require('mongodb');

async function simulate() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const user = await db.collection('users').findOne({ _id: new ObjectId(activeId) });
        const history = await db.collection('entries').find({ userId: activeId }).sort({ date: 1 }).toArray();

        console.log(`Simulating with ${history.length} entries...`);

        const definitions = user.trackables;
        const prepared = prepareData(history, definitions);

        const s1 = 'touch_grass';
        const s2 = 'rotting_time';

        const corrs = calculateCorrelations(prepared, s1, [s2]);

        if (corrs.length > 0) {
            console.log(`SYNERGY RESULT: ${Math.round(corrs[0].strength * 100)}%`);
            console.log(`CORRELATION VALUE: ${corrs[0].correlation}`);
        } else {
            console.log("No correlation found.");
        }

    } finally {
        await client.close();
    }
}

simulate();
