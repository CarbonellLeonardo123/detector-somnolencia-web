import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Grid, Divider, IconButton, Tooltip } from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Bedtime as BedtimeIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { formatDateTime, formatDuration, getRiskLevelInfo } from '../../utils/formatters';

export default function SessionCard({ session, onDelete }) {
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              label={`Riesgo ${risk.label}`}
              color={risk.color}
              sx={{ fontWeight: 700 }}
            />
            {onDelete && (
              <Tooltip title="Eliminar registro" arrow>
                <IconButton size="small" onClick={onDelete} sx={{ color: '#94a3b8', '&:hover': { color: '#dc2626' } }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Metrics Grid */}
        <Grid container spacing={2}>
          <Grid item xs={6} sm={2.4}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Duración
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {formatDuration(durationSeconds || 0)}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={2.4}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
              Fatiga Promedio / Máx
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
              {metrics?.avgFatiguePercentage || 0}% / {metrics?.maxFatiguePercentage || 0}%
            </Typography>
          </Grid>

          <Grid item xs={6} sm={2.4}>
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

          <Grid item xs={6} sm={2.4}>
            <Typography variant="caption" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <NotificationsActiveIcon sx={{ fontSize: 14, color: metrics?.totalAlerts > 0 ? '#ea580c' : 'inherit' }} />
              Total Alertas
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700, color: metrics?.totalAlerts > 0 ? '#ea580c' : '#1e293b' }}
            >
              {metrics?.totalAlerts || 0}
            </Typography>
          </Grid>

          <Grid item xs={6} sm={2.4}>
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
