import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  RemoveRedEye as EyeIcon,
  FlashOn as FlashIcon,
  Bedtime as BedtimeIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { formatDuration } from '../../utils/formatters';

export default function MetricsPanel({
  avgEAR = 0,
  earThreshold = 0.21,
  blinkRate = 0,
  totalBlinks = 0,
  microsleepCount = 0,
  sessionDuration = 0,
}) {
  const isEarCritical = avgEAR > 0 && avgEAR < earThreshold;

  const metricCards = [
    {
      title: 'EAR Ocular Actual',
      value: avgEAR > 0 ? avgEAR.toFixed(3) : '--',
      subtitle: `Umbral de Cierre: ${earThreshold.toFixed(3)}`,
      icon: <EyeIcon sx={{ color: isEarCritical ? '#dc2626' : '#0f766e' }} />,
      bgColor: isEarCritical ? '#fef2f2' : '#f8fafc',
      isWarning: isEarCritical,
      progress: Math.min(100, (avgEAR / 0.4) * 100),
      progressColor: isEarCritical ? 'error' : 'primary',
    },
    {
      title: 'Tasa de Parpadeo',
      value: `${blinkRate} /min`,
      subtitle: 'Rango normal: 12 a 20 /min',
      icon: <SpeedIcon sx={{ color: '#0e7490' }} />,
      bgColor: '#f8fafc',
    },
    {
      title: 'Total Parpadeos',
      value: totalBlinks,
      subtitle: 'En la sesión activa',
      icon: <FlashIcon sx={{ color: '#d97706' }} />,
      bgColor: '#f8fafc',
    },
    {
      title: 'Micro-Sueños',
      value: microsleepCount,
      subtitle: 'Cierres > 1.5 segundos',
      icon: <BedtimeIcon sx={{ color: microsleepCount > 0 ? '#dc2626' : '#64748b' }} />,
      bgColor: microsleepCount > 0 ? '#fff1f2' : '#f8fafc',
      isWarning: microsleepCount > 0,
    },
    {
      title: 'Tiempo de Sesión',
      value: formatDuration(sessionDuration),
      subtitle: 'Duración acumulada',
      icon: <TimerIcon sx={{ color: '#16a34a' }} />,
      bgColor: '#f8fafc',
    },
  ];

  return (
    <Grid container spacing={2}>
      {metricCards.map((metric, idx) => (
        <Grid size={{ xs: 12, sm: 6, md: idx === 0 ? 12 : 6 }} key={metric.title}>
          <Card
            sx={{
              backgroundColor: metric.bgColor,
              borderColor: metric.isWarning ? '#fca5a5' : '#e2e8f0',
              transition: 'all 0.2s ease',
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  {metric.title}
                </Typography>
                {metric.icon}
              </Box>

              <Typography
                variant={idx === 0 ? 'h4' : 'h5'}
                sx={{
                  fontWeight: 800,
                  color: metric.isWarning ? '#dc2626' : '#1e293b',
                  lineHeight: 1.1,
                }}
              >
                {metric.value}
              </Typography>

              {metric.progress !== undefined && (
                <LinearProgress
                  variant="determinate"
                  value={metric.progress}
                  color={metric.progressColor}
                  sx={{ my: 1, height: 6, borderRadius: 3 }}
                />
              )}

              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.5 }}>
                {metric.subtitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
