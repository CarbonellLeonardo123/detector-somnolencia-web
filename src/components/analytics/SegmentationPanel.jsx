import React from 'react';
import { Alert, Box, Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import { BubbleChart as BubbleChartIcon } from '@mui/icons-material';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#16a34a', '#f59e0b', '#dc2626', '#0284c7', '#7c3aed', '#475569'];

export default function SegmentationPanel({ segmentation = {} }) {
  const groups = Array.isArray(segmentation.clusters)
    ? segmentation.clusters.map((cluster) => ({
      id: cluster.id,
      size: cluster.count,
      label: cluster.profile,
      centroid: cluster.centroid,
    }))
    : (segmentation.profiles || []).map((profile, index) => ({
      id: profile.cluster ?? index,
      size: profile.size,
      label: profile.interpretation,
      centroid: segmentation.centers?.[profile.cluster ?? index],
    }));

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <BubbleChartIcon color="primary" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Segmentación no supervisada</Typography>
          <Typography variant="body2" color="text.secondary">
            K-Means estandariza las variables y nombra cada perfil después de calcular sus centroides.
          </Typography>
        </Box>
      </Stack>

      {segmentation.status !== 'ok' ? (
        <Alert severity="info">No hay suficientes ventanas para calcular los segmentos.</Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={groups} dataKey="size" nameKey="label" innerRadius={55} outerRadius={95} label>
                    {groups.map((group, index) => <Cell key={group.id} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={1.5}>
              {groups.map((group, index) => (
                <Paper key={group.id} variant="outlined" sx={{ p: 2, borderLeft: `5px solid ${COLORS[index % COLORS.length]}` }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        Segmento {Number(group.id) + 1}: {group.label || 'perfil calculado'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">{group.size} ventanas asignadas</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {group.centroid && Object.entries(group.centroid).slice(0, 5).map(([key, value]) => (
                        <Chip key={key} size="small" label={`${key}: ${Number(value || 0).toFixed(2)}`} />
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              {'silhouetteScore' in segmentation && (
                <Typography variant="caption" color="text.secondary">
                  Silhouette Score: {Number(segmentation.silhouetteScore || 0).toFixed(3)}
                </Typography>
              )}
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
