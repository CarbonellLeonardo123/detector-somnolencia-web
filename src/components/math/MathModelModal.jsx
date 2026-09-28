import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Functions as FunctionsIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

export default function MathModelModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              backgroundColor: '#e0f2fe',
              color: '#0288d1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FunctionsIcon />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Fundamento Matemático y Algoritmos de Visión
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Modelos de Visión Artificial, Ecuaciones de Apertura Ocular y Probabilidades de Fatiga
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          {/* 1. Red Neuronal */}
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <PsychologyIcon sx={{ color: '#1976d2' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                1. Red Neuronal: MediaPipe Face Mesh (Visión Artificial en Cliente)
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, lineHeight: 1.6 }}>
              El sistema ejecuta localmente en el navegador un modelo de Deep Learning convolucional acelerado por WebAssembly (WASM) y GPU (WebGL). Detecta y rastrea <strong>468 puntos tridimensionales (landmarks 3D)</strong> del rostro del conductor a 30 FPS sin enviar video a ningún servidor.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" label="468 Landmarks Faciales" color="primary" variant="outlined" />
              <Chip size="small" label="Blendshapes de Párpado" color="primary" variant="outlined" />
              <Chip size="small" label="Aceleración GPU WebGL" color="primary" variant="outlined" />
              <Chip size="small" label="Latencia: < 25ms por cuadro" color="success" variant="outlined" />
            </Stack>
          </Paper>

          {/* 2. Ecuación EAR */}
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <FunctionsIcon sx={{ color: '#16a34a' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#166534' }}>
                2. Ecuación Geométrica: Eye Aspect Ratio (EAR) &mdash; Soukupová & Čech (2016)
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: '#334155', mb: 1.5, lineHeight: 1.6 }}>
              Para cuantificar con precisión milimétrica la apertura ocular y suprimir la sensibilidad a la distancia o escala de la cámara, se aplica la razón de distancias euclidianas entre los 6 puntos clave de cada ojo:
            </Typography>

            {/* Formula Card */}
            <Box
              sx={{
                p: 2,
                backgroundColor: '#ffffff',
                border: '1.5px solid #86efac',
                borderRadius: 2,
                textAlign: 'center',
                my: 1.5,
              }}
            >
              <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#15803d' }}>
                EAR = ( ‖P₂ - P₆‖ + ‖P₃ - P₅‖ ) / ( 2 · ‖P₁ - P₄‖ )
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
              Donde la distancia euclidiana 2D entre puntos se define por:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#15803d', fontWeight: 700, mt: 0.5 }}>
              ‖A - B‖ = √[ (A.x - B.x)² + (A.y - B.y)² ]
            </Typography>

            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #bbf7d0' }}>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                • <strong>Ojo Derecho:</strong> P₁=33 (lateral), P₂=160, P₃=158, P₄=133 (medial), P₅=153, P₆=144.
              </Typography>
              <Typography variant="caption" sx={{ color: '#475569', display: 'block' }}>
                • <strong>Ojo Izquierdo:</strong> P₁=362 (medial), P₂=385, P₃=387, P₄=263 (lateral), P₅=373, P₆=380.
              </Typography>
              <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, display: 'block', mt: 0.5 }}>
                • Ojos abiertos: EAR ≈ 0.28 - 0.35 | Ojos cerrados / Parpadeo: EAR &lt; 0.21 | Micro-Sueño: EAR &lt; 0.21 por &gt; 1.5 segundos.
              </Typography>
            </Box>
          </Paper>

          {/* 3. Probabilidades y Estadísticas */}
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <TimelineIcon sx={{ color: '#ea580c' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#9a3412' }}>
                3. Modelo de Probabilidad de Fatiga y Suavizado Estadístico
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, lineHeight: 1.6 }}>
              La probabilidad de fatiga del conductor no depende de una sola variable. El sistema emplea un algoritmo de <strong>fusión probabilística multi-señal ponderada</strong>:
            </Typography>

            <Box
              sx={{
                p: 2,
                backgroundColor: '#ffffff',
                border: '1.5px solid #fdba74',
                borderRadius: 2,
                textAlign: 'center',
                my: 1.5,
              }}
            >
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#c2410c' }}>
                P(Fatiga) = 0.45 · S_EAR + 0.25 · S_Parpadeo + 0.30 · S_MicroSueño
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: '#475569', mb: 1, fontSize: '0.85rem' }}>
              Para evitar picos bruscos por parpadeos fisiológicos normales, se aplica un filtro de <strong>Media Móvil Exponencial (EMA)</strong> en tiempo real:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#c2410c', fontWeight: 700, mb: 1.5 }}>
              EMA_t = α · X_t + (1 - α) · EMA_(t-1) &emsp;[con factor de suavizado α = 0.15]
            </Typography>

            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
              • <strong>Tasa de Parpadeo:</strong> Ventana deslizante de 60 segundos (Frecuencia normal: 12 - 20 /min). Frecuencias inferiores a 10 o superiores a 26 disparan penalizaciones de somnolencia.
            </Typography>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="contained" onClick={onClose} sx={{ fontWeight: 700 }}>
          Cerrar Documentación
        </Button>
      </DialogActions>
    </Dialog>
  );
}
