import React from 'react';
import { Alert, Chip, Paper, Stack, Typography } from '@mui/material';
import { Science as ScienceIcon } from '@mui/icons-material';

const REQUIRED = ['NumPy', 'Pandas', 'TensorFlow', 'Keras', 'Matplotlib', 'Seaborn', 'OpenCV', 'scikit-learn'];

export default function TechnologyEvidencePanel({ metadata = {}, warnings = [] }) {
  const activeLibraries = metadata.availableLibraries || metadata.libraries || [];

  return (
    <Paper variant="outlined" sx={{ p: 2.5, backgroundColor: '#f8fafc' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <ScienceIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Evidencia tecnológica</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Motor actual: <strong>{metadata.engine || 'sin ejecutar'}</strong>. Las librerías pesadas se usan en Colab y el entrenamiento; NumPy/Pandas/scikit-learn se usan en la API Python.
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        {REQUIRED.map((library) => (
          <Chip
            key={library}
            label={library}
            size="small"
            color={activeLibraries.includes(library) ? 'success' : 'default'}
            variant={activeLibraries.includes(library) ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>
      {warnings.map((warning) => <Alert key={warning} severity="info" sx={{ mt: 1 }}>{warning}</Alert>)}
    </Paper>
  );
}
