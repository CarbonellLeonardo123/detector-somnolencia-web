import { describe, expect, it } from 'vitest';
import { multipleLinearRegression, simpleLinearRegression } from './regression';

describe('linear regression', () => {
  it('recovers a known simple line and its metrics', () => {
    const result = simpleLinearRegression([
      { elapsedMinutes: 0, fatiguePct: 1 },
      { elapsedMinutes: 1, fatiguePct: 3 },
      { elapsedMinutes: 2, fatiguePct: 5 },
      { elapsedMinutes: 3, fatiguePct: 7 },
    ], 2);

    expect(result.status).toBe('ok');
    expect(result.slope).toBeCloseTo(2);
    expect(result.intercept).toBeCloseTo(1);
    expect(result.r2).toBeCloseTo(1);
    expect(result.mae).toBeCloseTo(0);
    expect(result.rmse).toBeCloseTo(0);
    expect(result.forecast.atMinute).toBe(5);
    expect(result.forecast.value).toBeCloseTo(11);
  });

  it('returns an explicit insufficient state for a degenerate line', () => {
    expect(simpleLinearRegression([{ elapsedMinutes: 1, fatiguePct: 20 }]).status)
      .toBe('insufficient-data');
  });

  it('fits multiple regression and exposes real matrix dimensions', () => {
    const rows = Array.from({ length: 12 }, (_, index) => {
      const x1 = index;
      const x2 = (index * index) % 7;
      return { x1, x2, targetFatigue: 5 + 2 * x1 - 3 * x2 };
    });

    const result = multipleLinearRegression(rows, { features: ['x1', 'x2'], ridge: 1e-10 });
    expect(result.status).toBe('ok');
    expect(result.coefficients.intercept).toBeCloseTo(5, 4);
    expect(result.coefficients.x1).toBeCloseTo(2, 4);
    expect(result.coefficients.x2).toBeCloseTo(-3, 4);
    expect(result.matrix).toMatchObject({ rows: 12, columns: 3, betaLength: 3, predictionLength: 12 });
    expect(result.r2).toBeGreaterThan(0.9999);
  });

  it('excludes the final window when it has no future target', () => {
    const result = multipleLinearRegression([
      { x: 0, targetFatigue: 10 },
      { x: 1, targetFatigue: 20 },
      { x: 2, targetFatigue: 30 },
      { x: 3, targetFatigue: null },
    ], { features: ['x'] });

    expect(result.status).toBe('ok');
    expect(result.matrix.rows).toBe(3);
  });
});
