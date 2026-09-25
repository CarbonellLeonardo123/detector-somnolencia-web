import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Grid, Divider } from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Bedtime as BedtimeIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { formatDateTime, formatDuration, getRiskLevelInfo } from '../../utils/formatters';

export default function SessionCard({ session }) {
  const { startedAt, durationSeconds, metrics } = session;
  const risk = getRiskLevelInfo(metrics?.riskLevel || 'low');

  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }, transition: 'all 0.2s' }}>
      <CardContent sx={{ p: 2.5 }}>
        {/* Header row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon sx={{ color: '#64748b', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {formatDateTime(startedAt)}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`Riesgo ${risk.label}`}
            color={risk.color}
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Metrics Grid */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Duración
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {formatDuration(durationSeconds || 0)}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Fatiga Promedio / Máx
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {metrics?.avgFatiguePercentage || 0}% / {metrics?.maxFatiguePercentage || 0}%
            </Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <BedtimeIcon sx={{ fontSize: 14, color: metrics?.microsleepCount > 0 ? '#dc2626' : 'inherit' }} />
              Micro-Sueños
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: metrics?.microsleepCount > 0 ? '#dc2626' : '#1e293b' }}
            >
              {metrics?.microsleepCount || 0}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <VisibilityIcon sx={{ fontSize: 14 }} />
              EAR Promedio
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {metrics?.avgEAR ? Number(metrics.avgEAR).toFixed(3) : '--'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
