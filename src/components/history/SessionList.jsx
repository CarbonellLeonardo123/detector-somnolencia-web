import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Button, Stack, Chip } from '@mui/material';
import {
  Refresh as RefreshIcon,
  History as HistoryIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
} from '@mui/icons-material';
import SessionCard from './SessionCard';
import { subscribeUserSessions, deleteSession, getUserSessions } from '../../services/firebase/sessionService';
import { isFirebaseConfigured } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';

export default function SessionList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    // Set up real-time listener for Firestore / local fallback
    const unsubscribe = subscribeUserSessions(user.uid, (data) => {
      setSessions(data);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('¿Deseas eliminar este registro de sesión?')) return;
    await deleteSession(user?.uid, sessionId);
    // Refresh local list
    const updated = await getUserSessions(user?.uid);
    setSessions(updated);
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    const data = await getUserSessions(user?.uid);
    setSessions(data);
    setLoading(false);
  };

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
        <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, maxWidth: 440, mx: 'auto' }}>
          Realiza tu primera prueba en el "Monitor en Vivo". Las sesiones completadas y los eventos de
          alerta se sincronizan y guardan automáticamente en{' '}
          <strong>{isFirebaseConfigured ? 'Firebase Firestore (Nube)' : 'Almacenamiento Local'}</strong>.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="subtitle1" sx={{ color: '#1e293b', fontWeight: 700 }}>
            Sesiones Registradas ({sessions.length})
          </Typography>
          <Chip
            size="small"
            icon={isFirebaseConfigured ? <CloudDoneIcon fontSize="small" /> : <CloudOffIcon fontSize="small" />}
            label={isFirebaseConfigured ? 'Sincronizado con Firestore' : 'Almacenado Localmente'}
            color={isFirebaseConfigured ? 'success' : 'default'}
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        </Stack>

        <Button
          startIcon={<RefreshIcon />}
          onClick={handleManualRefresh}
          size="small"
          variant="outlined"
        >
          Actualizar
        </Button>
      </Box>

      {sessions.map((session) => (
        <SessionCard
          key={session.sessionId || session.id}
          session={session}
          onDelete={() => handleDeleteSession(session.sessionId || session.id)}
        />
      ))}
    </Box>
  );
}
