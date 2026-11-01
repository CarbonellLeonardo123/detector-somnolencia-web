import { describe, expect, it } from 'vitest';
import { runNeuralNetworkInference } from './neuralNetwork';

describe('neural network artifact inference', () => {
  it('runs dense layers and returns normalized class probabilities', () => {
    const artifact = {
      features: ['fatiguePct', 'perclos'],
      scaler: { mean: [0, 0], scale: [1, 1] },
      classes: ['normal', 'attention', 'danger'],
      layers: [
        {
          activation: 'softmax',
          weights: [[-0.1, 0.05, 0.1], [-0.2, 0.1, 0.2]],
          bias: [1, 0, -1],
        },
      ],
      metadata: { trainingSource: 'synthetic-demo', validated: false },
    };

    const result = runNeuralNetworkInference({ fatiguePct: 80, perclos: 0.3 }, artifact);
    expect(result.status).toBe('ok');
    expect(Object.values(result.probabilities).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(['normal', 'attention', 'danger']).toContain(result.predictedClass);
    expect(result.metadata.validated).toBe(false);
  });

  it('rejects malformed executable-looking artifacts', () => {
    expect(runNeuralNetworkInference({}, { layers: 'eval(alert(1))' }).status).toBe('invalid-artifact');
  });
});
