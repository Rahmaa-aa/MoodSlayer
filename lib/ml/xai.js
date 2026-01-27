/**
* XAI Engine (Local Explainability)
* Calculates the specific influence of each feature on a single prediction
* by perturbing the inputs and measuring the output delta.
*/

export const calculateInfluence = async (model, inputData, featureNames, targetKey) => {
    if (!model || !inputData || !featureNames) return {};

    try {
        const tf = await import('@tensorflow/tfjs');

        // 1. Get the baseline prediction
        const inputTensor = tf.tensor2d([inputData]);
        const baselinePred = model.predict(inputTensor).dataSync()[0];
        inputTensor.dispose();

        const influences = {};

        // 2. Perturb each feature individually and observe the change
        for (let i = 0; i < featureNames.length; i++) {
            const feature = featureNames[i];

            // Skip target or day encoding
            if (feature === targetKey || feature.includes('day_')) continue;

            const perturbedData = [...inputData];

            // Toggle the feature (if it was low, make it high; if high, make it low)
            const currentValue = perturbedData[i];
            perturbedData[i] = currentValue > 0.5 ? 0 : 1;

            const perturbedTensor = tf.tensor2d([perturbedData]);
            const perturbedPred = model.predict(perturbedTensor).dataSync()[0];
            perturbedTensor.dispose();

            // Influence = Change in prediction / Change in input
            // We focus on the absolute delta to see "importance"
            const delta = Math.abs(perturbedPred - baselinePred);

            // Determine if the influence is positive or negative
            // If turning the feature ON (from 0 to 1) increases the prediction, it's positive.
            const isPositive = currentValue < 0.5 ? (perturbedPred > baselinePred) : (baselinePred > perturbedPred);

            influences[feature] = {
                score: delta,
                impact: isPositive ? 'positive' : 'negative'
            };
        }

        return influences;
    } catch (e) {
        console.error("XAI Calculation failed", e);
        return {};
    }
};
