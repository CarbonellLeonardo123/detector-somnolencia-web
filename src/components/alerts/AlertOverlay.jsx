import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Warning as WarningIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';
import { useDetection } from '../../context/DetectionContext';

export default function AlertOverlay() {
  const { isVisualAlertActive, stopAlarm, uiState } = useDetection();

  if (!isVisualAlertActive) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'rgba(220, 38, 38, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'flashBackground 0.6s infinite alternate',
        p: 3,
        '@keyframes flashBackground': {
          '0%': { backgroundColor: 'rgba(220, 38, 38, 0.75)' },
          '100%': { backgroundColor: 'rgba(185, 28, 28, 0.95)' },
        },
      }}
    >
      <Paper
        elevation={24}
        sx={{
          maxWidth: 550,
          width: '100%',
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          textAlign: 'center',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '4px solid #dc2626',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            animation: 'pulseScale 0.6s infinite alternate',
            '@keyframes pulseScale': {
              '0%': { transform: 'scale(1)' },
              '100%': { transform: 'scale(1.15)' },
            },
          }}
        >
          <WarningIcon sx={{ fontSize: 50 }} />
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 900,
            color: '#dc2626',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            mb: 1.5,
          }}
        >
          ¡ALERTA DE SOMNOLENCIA!
        </Typography>

        <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700, mb: 1 }}>
          Riesgo Crítico de Micro-Sueño
        </Typography>

        <Typography variant="body1" sx={{ color: '#475569', mb: 3 }}>
          Se ha detectado el cierre prolongado de los ojos o una probabilidad de fatiga del{' '}
          <Typography component="span" sx={{ fontWeight: 800, color: '#dc2626' }}>
            {uiState.fatigueProbability}%
          </Typography>
          . Abre los ojos de inmediato y estaciona en un lugar seguro.
        </Typography>

        <Button
          variant="contained"
          color="error"
          size="large"
          fullWidth
          startIcon={<VolumeUpIcon />}
          onClick={stopAlarm}
          sx={{
            py: 1.8,
            fontSize: '1.1rem',
            fontWeight: 800,
            borderRadius: 3,
            boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5)',
          }}
        >
          He Despertado &mdash; Silenciar Alarma
        </Button>
      </Paper>
    </Box>
  );
}
