const { MongoClient } = require('mongodb');

function getPearsonCorrelation(x, y) {
    let n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i]; sumY += y[i]; sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i]; sumY2 += y[i] * y[i];
    }
    let numerator = (n * sumXY) - (sumX * sumY);
    let denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denominator === 0) return 0;
    return numerator / denominator;
}

async function diag() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');
        const user = await db.collection('users').findOne({ email: 'chaos@mood.com' });
        const entries = await db.collection('entries').find({ userId: user._id.toString() }).sort({ date: 1 }).toArray();

        const moodMap = { 'Happy': 4, 'Energetic': 3, 'Chill': 2, 'Sad': 1 };
        const data = entries.map(e => ({
            mood: moodMap[e.data.mood] || 0,
            touch_grass: e.data.touch_grass ? 1 : 0,
            rotting_time: e.data.rotting_time || 0,
            gym_log: e.data.gym_log ? 1 : 0,
            daily_mantra: e.data.daily_mantra ? 1 : 0
        }));

        const targets = ['mood', 'touch_grass', 'rotting_time', 'gym_log', 'daily_mantra'];
        console.log("--- CHAOS CORRELATION AUDIT ---");

        targets.forEach(t1 => {
            console.log(`\nTarget: ${t1}`);
            targets.forEach(t2 => {
                if (t1 === t2) return;
                const x = data.map(d => d[t1]);
                const y = data.map(d => d[t2]);
                const corr = getPearsonCorrelation(x, y);
                console.log(`  - ${t2}: ${corr.toFixed(3)}`);
            });
        });

    } finally {
        await client.close();
    }
}

diag();
