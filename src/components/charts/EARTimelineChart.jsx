import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

export default function EARTimelineChart({ data = [], earThreshold = 0.21 }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 0.75, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Historial de EAR
          </Typography>
          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>
            Umbral de cierre: {earThreshold.toFixed(2)}
          </Typography>
        </Box>

        <Box sx={{ width: '100%', height: 220 }}>
          {data.length === 0 ? (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                backgroundColor: '#f8fafc',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2">Esperando datos de la cámara...</Typography>
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[0, 0.45]}
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  ticks={[0.1, 0.2, 0.3, 0.4]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [Number(value).toFixed(3), 'EAR']}
                />
                <ReferenceLine
                  y={earThreshold}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Umbral',
                    fill: '#dc2626',
                    fontSize: 10,
                    position: 'insideTopLeft',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ear"
                  stroke="#0288d1"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
