import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { DEMO_ANALYTICS_SESSIONS } from '../../data/demoAnalyticsDataset';
import { requestAnalytics } from '../../services/analytics/analyticsApi';
import { normalizeSessions } from '../../utils/analytics/sessionFeatures';
import { downloadAnalyticsCsv } from '../../utils/analytics/csvExport';
import StatisticsPanel from './StatisticsPanel';
import RegressionPanel from './RegressionPanel';
import SegmentationPanel from './SegmentationPanel';
import NeuralNetworkPanel from './NeuralNetworkPanel';
import TechnologyEvidencePanel from './TechnologyEvidencePanel';

export default function AnalyticsDashboard({ sessions = [] }) {
  const [demoMode, setDemoMode] = useState(false);
  const [forecastMinutes, setForecastMinutes] = useState(5);
  const [clusterCount, setClusterCount] = useState(3);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeSessions = demoMode ? DEMO_ANALYTICS_SESSIONS : sessions;
  const observations = useMemo(() => normalizeSessions(activeSessions), [activeSessions]);
  const dataMode = demoMode ? 'synthetic-demo' : 'real';

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const result = await requestAnalytics(activeSessions, {
        dataMode,
        forecastMinutes,
        clusterCount,
      });
      setAnalytics(result);
    } finally {
      setLoading(false);
    }
  }, [activeSessions, clusterCount, dataMode, forecastMinutes]);

  useEffect(() => {
    // Analysis is an explicit external computation synchronized with panel controls.
    // oxlint-disable-next-line react/set-state-in-effect
    void runAnalysis();
  }, [runAnalysis]);

  const handleExport = () => {
    downloadAnalyticsCsv(
      observations,
      dataMode,
      `somnoguard-${dataMode}-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', lg: 'center' }}
          gap={2}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <ScienceIcon color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 900 }}>Analítica empresarial y Machine Learning</Typography>
              <Chip
                size="small"
                color={demoMode ? 'warning' : 'success'}
                label={demoMode ? 'Datos sintéticos de demostración' : 'Datos reales registrados'}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Indicadores académicos calculados sobre ventanas agregadas, sin enviar video ni información personal.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems="center">
            <TextField
              select
              size="small"
              label="Pronóstico"
              value={forecastMinutes}
              onChange={(event) => setForecastMinutes(Number(event.target.value))}
              sx={{ minWidth: 130 }}
            >
              {[5, 10, 15].map((value) => <MenuItem key={value} value={value}>{value} minutos</MenuItem>)}
            </TextField>
            <TextField
              select
              size="small"
              label="Segmentos"
              value={clusterCount}
              onChange={(event) => setClusterCount(Number(event.target.value))}
              sx={{ minWidth: 115 }}
            >
              {[2, 3, 4].map((value) => <MenuItem key={value} value={value}>{value} grupos</MenuItem>)}
            </TextField>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={runAnalysis} disabled={loading}>
              Recalcular
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} disabled={observations.length === 0}>
              Exportar CSV
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Fuente de análisis:
          </Typography>
          <Button
            size="small"
            variant={demoMode ? 'outlined' : 'contained'}
            onClick={() => setDemoMode(false)}
          >
            Sesiones reales ({sessions.length})
          </Button>
          <Button
            size="small"
            color="warning"
            variant={demoMode ? 'contained' : 'outlined'}
            onClick={() => setDemoMode(true)}
          >
            Activar demostración sintética
          </Button>
          <Typography variant="caption" color="text.secondary">
            La demostración nunca se activa automáticamente ni se mezcla con datos reales.
          </Typography>
        </Stack>
      </Paper>

      {!demoMode && sessions.length === 0 && (
        <Alert severity="info">
          Todavía no existen sesiones reales suficientes. Puedes realizar monitoreos o activar manualmente el dataset sintético para la sustentación.
        </Alert>
      )}

      {loading && (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Calculando indicadores...</Typography>
        </Paper>
      )}

      {!loading && analytics && (
        <>
          <StatisticsPanel statistics={analytics.statistics} />
          <Divider />
          <RegressionPanel
            simple={analytics.simpleRegression}
            multiple={analytics.multipleRegression}
            linearAlgebra={analytics.linearAlgebra}
            observations={observations}
          />
          <Divider />
          <SegmentationPanel segmentation={analytics.segmentation} />
          <Divider />
          <NeuralNetworkPanel neuralNetwork={analytics.neuralNetwork} />
          <TechnologyEvidencePanel metadata={analytics.metadata} warnings={analytics.warnings} />
        </>
      )}
    </Stack>
  );
}
