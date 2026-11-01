import React from 'react';
import { Alert, Box, Grid, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { Psychology as PsychologyIcon } from '@mui/icons-material';

const LABELS = {
  normal: 'Normal',
  attention: 'Atención',
  atencion: 'Atención',
  danger: 'Peligro',
  peligro: 'Peligro',
};

const COLORS = { normal: 'success', attention: 'warning', atencion: 'warning', danger: 'error', peligro: 'error' };

export default function NeuralNetworkPanel({ neuralNetwork = {} }) {
  const probabilities = neuralNetwork.probabilities || {};
  const predicted = neuralNetwork.predictedClass;
  const warning = neuralNetwork.warning || neuralNetwork.metadata?.warning;
  const validated = neuralNetwork.validated ?? neuralNetwork.metadata?.validated;

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <PsychologyIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Red neuronal personalizada para SomnoGuard</Typography>
          <Typography variant="body2" color="text.secondary">
            MLP entrenable con TensorFlow/Keras; la web ejecuta inferencia mediante pesos JSON seguros.
          </Typography>
        </Box>
      </Stack>

      {neuralNetwork.status === 'insufficient-data' ? (
        <Alert severity="info">Se necesita al menos una ventana para ejecutar la inferencia.</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="overline">Clase estimada</Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, my: 1, color: predicted?.includes('pelig') || predicted === 'danger' ? '#dc2626' : '#0e7490' }}>
                {LABELS[predicted] || 'Sin datos'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Arquitectura académica objetivo: 7 → 32 → Dropout → 16 → 3
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                {Object.entries(probabilities).map(([name, probability]) => (
                  <Box key={name}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{LABELS[name] || name}</Typography>
                      <Typography variant="body2">{(Number(probability || 0) * 100).toFixed(1)}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={Number(probability || 0) * 100} color={COLORS[name] || 'primary'} sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
          {validated === false && <Grid size={{ xs: 12 }}><Alert severity="warning">{warning || 'Modelo sintético académico no validado para decisiones reales.'}</Alert></Grid>}
        </Grid>
      )}
    </Box>
  );
}
