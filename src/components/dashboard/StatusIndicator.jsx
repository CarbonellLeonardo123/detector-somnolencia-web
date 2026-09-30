import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  PauseCircle as PauseCircleIcon,
} from '@mui/icons-material';
import { DETECTION_STATES } from '../../utils/constants';

export default function StatusIndicator({ state }) {
  const getStatusConfig = () => {
    switch (state) {
      case DETECTION_STATES.NORMAL:
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 28, color: '#16a34a' }} />,
          label: 'ESTADO: NORMAL',
          description: 'Conductor atento y alerta',
          bgColor: '#f0fdf4',
          borderColor: '#86efac',
          textColor: '#15803d',
        };
      case DETECTION_STATES.ATTENTION:
        return {
          icon: <WarningIcon sx={{ fontSize: 28, color: '#d97706' }} />,
          label: 'ESTADO: ATENCIÓN',
          description: 'Primeros indicios de cansancio o distracción',
          bgColor: '#fffbeb',
          borderColor: '#fde68a',
          textColor: '#b45309',
        };
      case DETECTION_STATES.ALERT:
        return {
          icon: <WarningIcon sx={{ fontSize: 28, color: '#ea580c' }} />,
          label: 'ESTADO: ALERTA DE FATIGA',
          description: 'Nivel elevado de somnolencia detectado',
          bgColor: '#fff7ed',
          borderColor: '#fed7aa',
          textColor: '#c2410c',
        };
      case DETECTION_STATES.PELIGRO:
        return {
          icon: <ErrorIcon sx={{ fontSize: 28, color: '#dc2626' }} />,
          label: 'ESTADO: ¡PELIGRO CRÍTICO!',
          description: 'Ojos cerrados prolongadamente o microsueño',
          bgColor: '#fef2f2',
          borderColor: '#fca5a5',
          textColor: '#b91c1c',
          isPulsing: true,
        };
      case DETECTION_STATES.CALIBRATING:
        return {
          icon: <HourglassEmptyIcon sx={{ fontSize: 28, color: '#0288d1' }} />,
          label: 'ESTADO: CALIBRANDO',
          description: 'Midiendo apertura ocular de referencia',
          bgColor: '#f0f9ff',
          borderColor: '#bae6fd',
          textColor: '#0369a1',
        };
      default:
        return {
          icon: <PauseCircleIcon sx={{ fontSize: 28, color: '#64748b' }} />,
          label: 'ESTADO: INACTIVO',
          description: 'Inicia el monitoreo para comenzar',
          bgColor: '#f8fafc',
          borderColor: '#e2e8f0',
          textColor: '#64748b',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 3,
        backgroundColor: config.bgColor,
        border: `1.5px solid ${config.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minHeight: 72,
        transition: 'all 0.3s ease',
        ...(config.isPulsing && {
          animation: 'pulseGlow 1s infinite alternate',
          '@keyframes pulseGlow': {
            '0%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.4)' },
            '100%': { boxShadow: '0 0 20px 4px rgba(220, 38, 38, 0.5)' },
          },
        }),
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.75)',
          flexShrink: 0,
        }}
      >
        {config.icon}
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 850, color: config.textColor, lineHeight: 1.2 }}>
          {config.label}
        </Typography>
        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
          {config.description}
        </Typography>
      </Box>
    </Paper>
  );
}
