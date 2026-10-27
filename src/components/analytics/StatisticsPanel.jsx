import React from 'react';
import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { Functions as FunctionsIcon } from '@mui/icons-material';

function percentage(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function Metric({ label, value, hint }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', boxShadow: 'none' }}>
      <CardContent>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ color: '#0f172a', fontWeight: 800, my: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>{hint}</Typography>
      </CardContent>
    </Card>
  );
}

export default function StatisticsPanel({ statistics = {} }) {
  const fatigue = statistics.fatigue || {};
  const probabilities = statistics.probabilities || {};
  const highFatigue = probabilities.highFatigue ?? statistics.probabilityFatigueAbove60;
  const alert = probabilities.alert ?? statistics.probabilityAlert;
  const microsleep = probabilities.microsleep ?? statistics.probabilityMicrosleep;

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <FunctionsIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Estadística básica empresarial</Typography>
          <Typography variant="body2" color="text.secondary">
            Resumen de las ventanas agregadas; la varianza usa la definición muestral.
          </Typography>
        </Box>
      </Stack>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Metric label="Media aritmética" value={`${Number(fatigue.mean || 0).toFixed(2)}%`} hint="Índice medio de fatiga" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Metric label="Mediana" value={`${Number(fatigue.median || 0).toFixed(2)}%`} hint="Valor central de la muestra" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Metric label="Varianza" value={Number(fatigue.variance || 0).toFixed(2)} hint="Dispersión cuadrática muestral" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Metric label="Desviación estándar" value={Number(fatigue.stdDev || 0).toFixed(2)} hint="Variabilidad en puntos porcentuales" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Metric label="P(Fatiga ≥ 60)" value={percentage(highFatigue)} hint="Frecuencia empírica observada" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Metric label="P(Alerta)" value={percentage(alert)} hint="Ventanas con alerta registrada" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Metric label="P(Micro-sueño)" value={percentage(microsleep)} hint="Ventanas con micro-sueño" />
        </Grid>
      </Grid>
    </Box>
  );
}
