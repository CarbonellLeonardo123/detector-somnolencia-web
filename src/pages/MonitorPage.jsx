import React from 'react';
import { Grid, Box, Typography, Paper, Alert } from '@mui/material';
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
    <Box>
      {/* Alert Overlay rendered globally during critical alarm */}
      <AlertOverlay />

      {/* Top Section: Camera & Dashboard Controls */}
      <Grid container spacing={3}>
        {/* Left Column: Webcam Feed */}
        <Grid item xs={12} lg={6}>
          <WebcamFeed />
        </Grid>

        {/* Right Column: Status & Real-time Metrics */}
        <Grid item xs={12} lg={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>
            {/* Status Traffic Light Indicator */}
            <StatusIndicator state={uiState.state} />

            {/* Gauge & Key Metrics Row */}
            <Grid container spacing={2} sx={{ flexGrow: 1 }}>
              <Grid item xs={12} sm={5}>
                <FatigueGauge
                  percentage={uiState.fatigueProbability}
                  attentionScore={uiState.attentionScore}
                />
              </Grid>

              <Grid item xs={12} sm={7}>
                <MetricsPanel
                  avgEAR={uiState.avgEAR}
                  earThreshold={uiState.earThreshold}
                  blinkRate={uiState.blinkRate}
                  totalBlinks={uiState.totalBlinks}
                  microsleepCount={uiState.microsleepCount}
                  sessionDuration={sessionDuration}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>

      {/* Real-time Charts Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
          Telemetría y Análisis en Tiempo Real
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <EARTimelineChart data={chartData} earThreshold={uiState.earThreshold} />
          </Grid>
          <Grid item xs={12} md={6}>
            <AttentionChart data={chartData} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
