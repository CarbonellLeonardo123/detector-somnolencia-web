import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Face as FaceIcon,
  VideocamOff as VideocamOffIcon,
} from '@mui/icons-material';
import { useDetection } from '../../context/DetectionContext';
import { DETECTION_STATES } from '../../utils/constants';

export default function WebcamFeed() {
  const {
    videoRef,
    canvasRef,
    isStreaming,
    cameraError,
    isModelReady,
    isLoadingModel,
    modelError,
    uiState,
    isRecording,
    startMonitoring,
    stopMonitoring,
  } = useDetection();

  const isCalibrating = uiState.state === DETECTION_STATES.CALIBRATING;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title & Status Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Cámara del Conductor
            </Typography>
            {isStreaming && (
              <Chip
                size="small"
                label={uiState.faceDetected ? 'Rostro Detectado' : 'Sin Rostro'}
                color={uiState.faceDetected ? 'success' : 'warning'}
                icon={<FaceIcon />}
                variant="outlined"
              />
            )}
          </Stack>

          {isModelReady && (
            <Chip
              size="small"
              label="MediaPipe IA Activo"
              color="primary"
              variant="filled"
              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* Video / Canvas Container */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            maxHeight: 460,
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
          }}
        >
          {/* Video element */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror effect for user webcam
              display: isStreaming ? 'block' : 'none',
            }}
          />

          {/* Landmarks Canvas Overlay */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              pointerEvents: 'none',
              display: isStreaming ? 'block' : 'none',
            }}
          />

          {/* Fallback & Loading States */}
          {!isStreaming && (
            <Box sx={{ textAlign: 'center', p: 3, color: '#94a3b8' }}>
              {isLoadingModel ? (
                <>
                  <CircularProgress size={48} sx={{ color: '#38bdf8', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                    Cargando red neuronal de visión artificial...
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    MediaPipe FaceLandmarker (WASM + GPU)
                  </Typography>
                </>
              ) : (
                <>
                  <VideocamOffIcon sx={{ fontSize: 64, color: '#475569', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                    Cámara en Pausa
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5, maxWidth: 320 }}>
                    Haz clic en "Iniciar Monitoreo" para activar la cámara web y comenzar el análisis en tiempo real.
                  </Typography>
                </>
              )}
            </Box>
          )}

          {/* Calibration Overlay Banner */}
          {isStreaming && isCalibrating && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 2,
                p: 2,
                color: '#fff',
                border: '1px solid rgba(56, 189, 248, 0.4)',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#38bdf8' }}>
                Calibrando apertura natural de ojos...
              </Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mb: 1 }}>
                Por favor, mira hacia la cámara con los ojos abiertos normalmente.
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uiState.calibrationProgress || 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#38bdf8' },
                }}
              />
            </Box>
          )}
        </Box>

        {/* Error Messages */}
        {(cameraError || modelError) && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {cameraError || modelError}
          </Alert>
        )}

        {/* Primary Action Button */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {!isStreaming ? (
            <Button
              variant="contained"
              size="large"
              color="primary"
              fullWidth
              startIcon={<PlayArrowIcon />}
              onClick={startMonitoring}
              disabled={isLoadingModel}
              sx={{
                py: 1.5,
                fontSize: '1.05rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)',
              }}
            >
              Iniciar Monitoreo en Vivo
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              color="error"
              fullWidth
              startIcon={<StopIcon />}
              onClick={stopMonitoring}
              sx={{
                py: 1.5,
                fontSize: '1.05rem',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(211, 47, 47, 0.4)',
              }}
            >
              Detener Monitoreo
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
