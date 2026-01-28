const { MongoClient, ObjectId } = require('mongodb');

function getPearsonCorrelation(x, y) {
    let n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumX2 += x[i] * x[i];
        sumY2 += y[i] * y[i];
    }

    let numerator = (n * sumXY) - (sumX * sumY);
    let denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) {
        const avgX = sumX / n;
        const avgY = sumY / n;
        if ((avgX >= 0.8 && avgY >= 0.8) || (avgX <= 0.2 && avgY <= 0.2)) return 0.99;
        if ((avgX >= 0.8 && avgY <= 0.2) || (avgX <= 0.2 && avgY >= 0.8)) return -0.99;
        return 0;
    }
    return numerator / denominator;
}

async function debug() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('mood_tracker');

        const activeId = '6979391721b2108211c22c47';
        const entries = await db.collection('entries').find({ userId: activeId }).sort({ date: 1 }).toArray();

        console.log(`History Length: ${entries.length}`);

        // Simulate prepareData raw numerical extraction
        const grass = entries.map(e => e.data?.touch_grass ? 1 : 0);
        const rotting = entries.map(e => e.data?.rotting_time ? 1 : 0);

        console.log(`Grass Values: [${grass.join(',')}]`);
        console.log(`Rotting Values: [${rotting.join(',')}]`);

        const corr = getPearsonCorrelation(grass, rotting);
        console.log(`Raw Correlation: ${corr}`);
        console.log(`Calculated Synergy: ${Math.round(Math.abs(corr) * 100)}%`);

    } finally {
        await client.close();
    }
}

debug();
