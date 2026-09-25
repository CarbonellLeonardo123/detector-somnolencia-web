import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import SessionList from '../components/history/SessionList';

export default function HistoryPage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
          Historial de Sesiones y Alertas
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Registro histórico de las sesiones de monitoreo, eventos de micro-sueño y métricas promedio.
        </Typography>
      </Box>

      <SessionList />
    </Box>
  );
}
