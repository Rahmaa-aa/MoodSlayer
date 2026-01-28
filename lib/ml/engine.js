import * as tf from '@tensorflow/tfjs';

/**
 * Trains/Updates a neural network to predict the target feature.
 * Features robustness with dropout, persistence, and confidence metrics.
 */
export const trainPredictor = async (data, targetKey, modelId = 'default-mood-model') => {
    const { rows, features } = data;
    if (rows.length < 5) return { prediction: null, confidence: 0 };

    // 1. Prepare Tensors (X: current features, Y: next day's target)
    const inputs = [];
    const labels = [];

    for (let i = 0; i < rows.length - 1; i++) {
        inputs.push(features.map(f => rows[i][f]));
        labels.push([rows[i + 1][targetKey]]);
    }

    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(labels);

    // 2. Load or Create Model
    let model;
    const savePath = `indexeddb://${modelId}-${targetKey}`;

    try {
        model = await tf.loadLayersModel(savePath);
        // Ensure input shape matches current features (if user added trackables)
        if (model.layers[0].batchInputShape[1] !== features.length) {
            throw new Error('Input shape mismatch');
        }
        model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
    } catch (e) {
        // Create new model with dropout for regularization
        model = tf.sequential();
        model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [features.length] }));
        model.add(tf.layers.dropout({ rate: 0.2 }));
        model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1 }));
        model.compile({ optimizer: tf.train.adam(0.01), loss: 'meanSquaredError' });
    }

    // 3. Train
    // MONK_MODE: High-intensity training for zero-variance data
    const history = await model.fit(xs, ys, {
        epochs: 300, // Force convergence
        shuffle: false, // Time-series stability
        verbose: 0,
        validationSplit: 0.1
    });

    const finalLoss = history.history.loss[history.history.loss.length - 1];

    // 4. Save model for future sessions
    try {
        await model.save(savePath);
    } catch (e) {
        console.warn('Persistence failed', e);
    }

    // 5. Predict for tomorrow
    const lastDayInput = tf.tensor2d([features.map(f => rows[rows.length - 1][f])]);
    const predictionTensor = model.predict(lastDayInput);
    const predictedValue = (await predictionTensor.data())[0];

    // 6. Calculate Confidence
    // Higher data volume + Lower loss = Higher confidence
    const dataVolumeCoeff = Math.min(1, rows.length / 30);
    const accuracyCoeff = Math.max(0, 1 - (finalLoss * 2)); // Assuming loss is normalized
    const confidence = (dataVolumeCoeff * 0.4) + (accuracyCoeff * 0.6);

    // Cleanup
    xs.dispose();
    ys.dispose();
    lastDayInput.dispose();
    predictionTensor.dispose();

    return {
        prediction: Math.max(0, Math.min(1, predictedValue)), // Stay in normalized range
        confidence: Math.max(0, Math.min(1, confidence)),
        model: model
    };
};
// Export getModel helper for XAI influence calculations
export const getModel = async (data, targetKey, modelId = 'default-mood-model') => {
    const savePath = `indexeddb://${modelId}-${targetKey}`;
    try {
        return await tf.loadLayersModel(savePath);
    } catch (e) {
        console.warn('Model not found for XAI', e);
        return null;
    }
};
