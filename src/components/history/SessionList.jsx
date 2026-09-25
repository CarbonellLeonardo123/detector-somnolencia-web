import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { Refresh as RefreshIcon, History as HistoryIcon } from '@mui/icons-material';
import SessionCard from './SessionCard';
import { getUserSessions } from '../../services/firebase/sessionService';
import { useAuth } from '../../context/AuthContext';

export default function SessionList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await getUserSessions(user?.uid);
      setSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user?.uid]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (sessions.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 2,
          backgroundColor: '#ffffff',
          borderRadius: 3,
          border: '1px dashed #cbd5e1',
        }}
      >
        <HistoryIcon sx={{ fontSize: 56, color: '#94a3b8', mb: 1.5 }} />
        <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 700 }}>
          No hay sesiones registradas aún
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, maxWidth: 400, mx: 'auto' }}>
          Realiza tu primera prueba en el "Monitor en Vivo". Las sesiones completadas y las alertas se
          guardarán automáticamente aquí.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ color: '#64748b', fontWeight: 600 }}>
          Total de Sesiones Registradas: {sessions.length}
        </Typography>
        <Button startIcon={<RefreshIcon />} onClick={loadSessions} size="small" variant="outlined">
          Actualizar
        </Button>
      </Box>

      {sessions.map((session) => (
        <SessionCard key={session.sessionId || session.id} session={session} />
      ))}
    </Box>
  );
}
