import * as tf from '@tensorflow/tfjs';

/**
 * Trains a simple neural network to predict the next day's value for a target feature.
 */
export const trainPredictor = async (data, targetKey) => {
    const { rows, features } = data;
    if (rows.length < 7) return null; // Minimum data for semi-useful prediction

    // 1. Prepare Tensors
    // We want to predict Target(t) from Features(t-1)
    const inputs = [];
    const labels = [];

    for (let i = 0; i < rows.length - 1; i++) {
        // Input: All features for current day
        const inputRow = features.map(f => rows[i][f]);
        inputs.push(inputRow);

        // Label: Target value for NEXT day
        labels.push([rows[i + 1][targetKey]]);
    }

    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(labels);

    // 2. Build Model
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [features.length] }));
    model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1 })); // Linear output for regression

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    // 3. Train
    await model.fit(xs, ys, {
        epochs: 50,
        shuffle: true,
        verbose: 0
    });

    // 4. Predict for "Tomorrow" (Using most recent day as input)
    const lastDayInput = tf.tensor2d([features.map(f => rows[rows.length - 1][f])]);
    const prediction = model.predict(lastDayInput);
    const predictedValue = (await prediction.data())[0];

    // Cleanup
    xs.dispose();
    ys.dispose();
    lastDayInput.dispose();
    prediction.dispose();

    return predictedValue;
};
