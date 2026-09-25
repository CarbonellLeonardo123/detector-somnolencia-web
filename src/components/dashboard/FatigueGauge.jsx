import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

export default function FatigueGauge({ percentage = 0, attentionScore = 100 }) {
  // Determine color based on fatigue level
  const getColor = (val) => {
    if (val >= 80) return '#dc2626'; // Red (Danger)
    if (val >= 60) return '#ea580c'; // Orange (Alert)
    if (val >= 35) return '#d97706'; // Yellow (Attention)
    return '#16a34a'; // Green (Normal)
  };

  const color = getColor(percentage);
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
          Probabilidad de Fatiga
        </Typography>

        {/* SVG Circular Gauge */}
        <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto', my: 1 }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress bar */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              style={{
                transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease',
              }}
            />
          </svg>

          {/* Center text overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 800, color: color, lineHeight: 1 }}>
              {percentage}%
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mt: 0.5 }}>
              Índice de Riesgo
            </Typography>
          </Box>
        </Box>

        {/* Attention Score Footer */}
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Nivel de Atención:{' '}
            <Typography component="span" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {attentionScore}%
            </Typography>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
