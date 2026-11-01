import React, { useMemo } from 'react';
import { Alert, Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function metric(value, digits = 3) {
  return Number(value || 0).toFixed(digits);
}

export default function RegressionPanel({ simple = {}, multiple = {}, linearAlgebra = {}, observations = [] }) {
  const chartData = useMemo(() => {
    if (Array.isArray(simple.points)) return simple.points;
    if (simple.status !== 'ok' && simple.status !== 'insufficient-time-variation') return [];
    return observations.map((row) => ({
      minute: Number(row.elapsedMinutes || 0),
      actual: Number(row.fatiguePct || 0),
      predicted: Number(simple.intercept || 0) + (Number(simple.slope || 0) * Number(row.elapsedMinutes || 0)),
    }));
  }, [simple, observations]);

  const forecast = simple.forecast?.value ?? simple.forecastFatiguePct;
  const matrix = multiple.matrix || {};
  const designShape = linearAlgebra.designMatrixShape
    || (matrix.rows !== undefined ? [matrix.rows, matrix.columns] : null);
  const coefficients = multiple.coefficients || {};
  const coefficientEntries = Object.entries(coefficients).slice(0, 8);

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <TimelineIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Regresión lineal aplicada a la empresa</Typography>
          <Typography variant="body2" color="text.secondary">
            La regresión simple usa tiempo; la múltiple usa siete características operativas.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
              Fatiga observada frente a ajuste lineal simple
            </Typography>
            {chartData.length < 2 ? (
              <Alert severity="info">Se necesitan al menos dos ventanas con tiempos diferentes.</Alert>
            ) : (
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="minute" type="number" domain={['dataMin', 'dataMax']} unit=" min" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="actual" name="Fatiga real" stroke="#dc2626" dot={false} strokeWidth={2} />
                    <Line dataKey="predicted" name="Recta estimada" stroke="#0e7490" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Regresión lineal simple</Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: '#0e7490', my: 1 }}>
                {forecast === undefined ? '—' : `${metric(forecast, 1)}%`}
              </Typography>
              <Typography variant="body2" color="text.secondary">Fatiga prevista al horizonte seleccionado</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                <Chip size="small" label={`Pendiente: ${metric(simple.slope)} %/min`} />
                <Chip size="small" label={`R²: ${metric(simple.r2)}`} />
                <Chip size="small" label={`MAE: ${metric(simple.mae)}`} />
                <Chip size="small" label={`RMSE: ${metric(simple.rmse)}`} />
              </Stack>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Regresión lineal múltiple y álgebra</Typography>
              {multiple.status === 'ok' ? (
                <>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', my: 1 }}>
                    ŷ = Xβ · R²={metric(multiple.r2)} · RMSE={metric(multiple.rmse)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {designShape ? `X: ${designShape[0]}×${designShape[1]} · β: ${designShape[1]}×1` : 'Matriz de diseño calculada'}
                  </Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                    {coefficientEntries.map(([name, value]) => (
                      <Chip key={name} size="small" variant="outlined" label={`${name}: ${metric(value, 4)}`} />
                    ))}
                  </Stack>
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>Se requieren al menos ocho ventanas consecutivas.</Alert>
              )}
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
