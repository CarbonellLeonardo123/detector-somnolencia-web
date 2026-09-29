import React from 'react';
import { Grid, Box, Typography, Chip } from '@mui/material';
import { Radar as RadarIcon } from '@mui/icons-material';
import WebcamFeed from '../components/camera/WebcamFeed';
import StatusIndicator from '../components/dashboard/StatusIndicator';
import FatigueGauge from '../components/dashboard/FatigueGauge';
import MetricsPanel from '../components/dashboard/MetricsPanel';
import EARTimelineChart from '../components/charts/EARTimelineChart';
import AttentionChart from '../components/charts/AttentionChart';
import AlertOverlay from '../components/alerts/AlertOverlay';
import { useDetection } from '../context/DetectionContext';

export default function MonitorPage() {
  const { uiState, chartData, sessionDuration } = useDetection();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Alert Overlay rendered globally during critical alarm */}
      <AlertOverlay />

      {/* Page header: clear orientation before the live data */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: '#0f766e', fontWeight: 800, letterSpacing: '0.12em' }}>
            CENTRO DE CONTROL
          </Typography>
          <Typography variant="h4" sx={{ color: '#0f172a', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Monitor en vivo
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.75 }}>
            Observa la apertura ocular y recibe alertas antes de que la fatiga se convierta en un riesgo.
          </Typography>
        </Box>
        <Chip
          icon={<RadarIcon sx={{ fontSize: 18 }} />}
          label="Análisis local · privacidad protegida"
          variant="outlined"
          sx={{
            color: '#0f766e',
            borderColor: '#99f6e4',
            backgroundColor: '#f0fdfa',
            fontWeight: 700,
            '& .MuiChip-icon': { color: '#0f766e' },
          }}
        />
      </Box>

      {/* Status stays visible above the camera and metrics */}
      <StatusIndicator state={uiState.state} />

      {/* Main monitoring workspace */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <WebcamFeed />
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
            <FatigueGauge
              percentage={uiState.fatigueProbability}
              attentionScore={uiState.attentionScore}
            />
            <MetricsPanel
              avgEAR={uiState.avgEAR}
              earThreshold={uiState.earThreshold}
              blinkRate={uiState.blinkRate}
              totalBlinks={uiState.totalBlinks}
              microsleepCount={uiState.microsleepCount}
              sessionDuration={sessionDuration}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Real-time Charts Section */}
      <Box sx={{ mt: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ color: '#0f766e', fontWeight: 800, letterSpacing: '0.1em' }}>
            TELEMETRÍA
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Análisis en tiempo real
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <EARTimelineChart data={chartData} earThreshold={uiState.earThreshold} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AttentionChart data={chartData} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
