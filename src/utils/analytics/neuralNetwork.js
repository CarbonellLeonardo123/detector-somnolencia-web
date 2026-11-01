import { roundMetric } from './statistics';

function relu(values) {
  return values.map((value) => Math.max(0, value));
}

function softmax(values) {
  const maximum = Math.max(...values);
  const exponentials = values.map((value) => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0) || 1;
  return exponentials.map((value) => value / total);
}

function dense(inputs, layer) {
  const outputSize = layer.bias.length;
  return Array.from({ length: outputSize }, (_, output) => (
    layer.bias[output] + inputs.reduce(
      (sum, input, index) => sum + (input * layer.weights[index][output]),
      0
    )
  ));
}

function validArtifact(artifact) {
  if (!artifact || !Array.isArray(artifact.features) || artifact.features.length === 0) return false;
  if (!Array.isArray(artifact.classes) || artifact.classes.length < 2) return false;
  if (!artifact.scaler || !Array.isArray(artifact.scaler.mean) || !Array.isArray(artifact.scaler.scale)) return false;
  if (!Array.isArray(artifact.layers) || artifact.layers.length === 0) return false;

  let inputSize = artifact.features.length;
  for (const layer of artifact.layers) {
    if (!Array.isArray(layer.weights) || layer.weights.length !== inputSize || !Array.isArray(layer.bias)) return false;
    if (!layer.weights.every((row) => Array.isArray(row) && row.length === layer.bias.length && row.every(Number.isFinite))) return false;
    if (!layer.bias.every(Number.isFinite) || !['relu', 'linear', 'softmax'].includes(layer.activation)) return false;
    inputSize = layer.bias.length;
  }
  return inputSize === artifact.classes.length;
}

export const DEMO_NEURAL_ARTIFACT = {
  version: 1,
  features: ['fatiguePct', 'avgEAR', 'minEAR', 'perclos', 'blinkRate', 'microsleeps', 'facePresenceRatio'],
  scaler: {
    mean: [50, 0.25, 0.18, 0.18, 18, 0.5, 0.9],
    scale: [25, 0.07, 0.07, 0.15, 8, 1, 0.15],
  },
  classes: ['normal', 'attention', 'danger'],
  layers: [{
    activation: 'softmax',
    weights: [
      [-1.2, 0.2, 1.2],
      [1.0, 0.1, -1.0],
      [0.8, 0.1, -0.8],
      [-1.1, 0.2, 1.1],
      [-0.4, 0.2, 0.4],
      [-0.8, 0.1, 0.8],
      [0.5, 0.1, -0.5],
    ],
    bias: [0.25, 0.2, -0.25],
  }],
  metadata: {
    trainingSource: 'synthetic-demo',
    validated: false,
    warning: 'Artefacto académico demostrativo; no validado para decisiones clínicas o de seguridad.',
  },
};

export function runNeuralNetworkInference(observation = {}, artifact = DEMO_NEURAL_ARTIFACT) {
  if (!validArtifact(artifact)) return { status: 'invalid-artifact' };
  const input = artifact.features.map((feature, index) => {
    const value = Number(observation?.[feature]);
    const mean = Number(artifact.scaler.mean[index]) || 0;
    const scale = Number(artifact.scaler.scale[index]) || 1;
    return ((Number.isFinite(value) ? value : mean) - mean) / scale;
  });

  let output = input;
  for (const layer of artifact.layers) {
    output = dense(output, layer);
    if (layer.activation === 'relu') output = relu(output);
    if (layer.activation === 'softmax') output = softmax(output);
  }
  if (artifact.layers[artifact.layers.length - 1].activation !== 'softmax') output = softmax(output);

  const probabilities = Object.fromEntries(
    artifact.classes.map((className, index) => [className, roundMetric(output[index])])
  );
  const predictedIndex = output.indexOf(Math.max(...output));
  return {
    status: 'ok',
    predictedClass: artifact.classes[predictedIndex],
    confidence: roundMetric(output[predictedIndex]),
    probabilities,
    metadata: artifact.metadata || {},
  };
}
