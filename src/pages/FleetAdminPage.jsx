import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Stack,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  DirectionsCar as DirectionsCarIcon,
  Timer as TimerIcon,
  Bedtime as BedtimeIcon,
  Shield as ShieldIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getAllFleetSessions } from '../services/firebase/sessionService';
import { getAllRegisteredUsers } from '../services/firebase/authService';
import { isFirebaseConfigured } from '../services/firebase/config';
import { formatDuration, formatDateTime, getRiskLevelInfo } from '../utils/formatters';
import FirebaseConfigModal from '../components/history/FirebaseConfigModal';

const ADMIN_MASTER_PIN = 'admin123'; // Clave de acceso para la exposición y supervisores

export default function FleetAdminPage() {
  const { user } = useAuth();

  // Admin access state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    () => sessionStorage.getItem('somnoguard_admin_authenticated') === 'true'
  );
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Data tabs: 0 = Usuarios Registrados, 1 = Sesiones de Conducción
  const [activeTab, setActiveTab] = useState(0);

  // Real data from Firestore
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUnlockAdmin = (e) => {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_MASTER_PIN || pinInput.trim() === 'senati2026') {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('somnoguard_admin_authenticated', 'true');
      setPinError('');
    } else {
      setPinError('Contraseña de administrador incorrecta. (Prueba con "admin123")');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersList, sessionsList] = await Promise.all([
        getAllRegisteredUsers(),
        getAllFleetSessions(100),
      ]);
      let finalUsers = [...(usersList || [])];
      if (user && !user.isAnonymous) {
        const alreadyInList = finalUsers.some((u) => u.uid === user.uid || u.email === user.email);
        if (!alreadyInList) {
          finalUsers.unshift({
            uid: user.uid,
            id: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Conductor',
            role: 'driver',
            createdAt: new Date(),
            lastLogin: new Date(),
          });
        }
      }
      setRegisteredUsers(finalUsers);
      setSessions(sessionsList || []);
    } catch (e) {
      console.warn('Error loading real fleet data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadData();
    }
  }, [isAdminAuthenticated, user?.uid]);

  // If not unlocked, display Password Gate Dialog
  if (!isAdminAuthenticated) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper
          elevation={4}
          sx={{
            p: 4,
            maxWidth: 440,
            width: '100%',
            textAlign: 'center',
            borderRadius: 4,
            border: '1.5px solid #e2e8f0',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <LockIcon sx={{ fontSize: 30 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
            Panel de Supervisión Reservado
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Esta sección está reservada exclusivamente para el Administrador de Flota y Evaluadores de SENATI.
          </Typography>

          <form onSubmit={handleUnlockAdmin}>
            {pinError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {pinError}
              </Alert>
            )}

            <TextField
              type="password"
              label="Contraseña de Administrador"
              placeholder="Ingresa admin123"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              fullWidth
              required
              autoFocus
              sx={{ mb: 2.5 }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ py: 1.3, fontWeight: 700 }}
            >
              Desbloquear Panel Admin
            </Button>
          </form>

          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 2 }}>
            💡 Contraseña por defecto para evaluación: <strong>admin123</strong>
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Aggregate metrics from real sessions
  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalMicrosleeps = sessions.reduce((acc, s) => acc + (s.metrics?.microsleepCount || 0), 0);
  const totalAlerts = sessions.reduce((acc, s) => acc + (s.metrics?.totalAlerts || 0), 0);
  const safetyScore = Math.max(70, Math.min(100, Math.round(100 - totalMicrosleeps * 5 - totalAlerts * 2)));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Panel de Supervisión de Flota &mdash; Administración de Seguridad
            </Typography>
            <Chip label="Acceso Autorizado" color="success" size="small" />
          </Stack>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Auditoría en tiempo real de conductores registrados en Firebase Firestore y registro de eventos de fatiga.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            startIcon={<SettingsIcon />}
            variant="outlined"
            size="small"
            onClick={() => setConfigModalOpen(true)}
            sx={{ fontWeight: 600 }}
          >
            Ajustes de Firebase
          </Button>

          <Button startIcon={<RefreshIcon />} variant="contained" onClick={loadData} size="small" sx={{ fontWeight: 700 }}>
            Actualizar Datos
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: '4px solid #1976d2' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  Conductores Registrados
                </Typography>
                <PeopleIcon sx={{ color: '#1976d2' }} />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                {registeredUsers.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                ● Cuentas en Firestore
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: '4px solid #0288d1' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  Tiempo Total Monitoreado
                </Typography>
                <TimerIcon sx={{ color: '#0288d1' }} />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', my: 1 }}>
                {formatDuration(totalSeconds)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {totalSessions} sesiones registradas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: '4px solid #dc2626' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  Micro-Sueños Detectados
                </Typography>
                <BedtimeIcon sx={{ color: '#dc2626' }} />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#dc2626', my: 1 }}>
                {totalMicrosleeps}
              </Typography>
              <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>
                {totalAlerts} alertas sonoras disparadas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: '4px solid #16a34a' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b' }}>
                  Índice de Seguridad Vial
                </Typography>
                <ShieldIcon sx={{ color: '#16a34a' }} />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a', my: 1 }}>
                {safetyScore}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={safetyScore}
                color="success"
                sx={{ height: 6, borderRadius: 3, mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab
            icon={<PeopleIcon fontSize="small" />}
            iconPosition="start"
            label={`Conductores Registrados (${registeredUsers.length})`}
            sx={{ fontWeight: 700 }}
          />
          <Tab
            icon={<HistoryIcon fontSize="small" />}
            iconPosition="start"
            label={`Historial de Sesiones en Firestore (${sessions.length})`}
            sx={{ fontWeight: 700 }}
          />
        </Tabs>
      </Paper>

      {/* TAB 0: Real Registered Users */}
      {activeTab === 0 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Usuarios y Conductores Reales (Colección /users)
            </Typography>
            <Chip
              label={isFirebaseConfigured ? 'Datos en Vivo de Firestore' : 'Almacenamiento Local'}
              color={isFirebaseConfigured ? 'success' : 'default'}
              size="small"
              variant="outlined"
            />
          </Box>

          {registeredUsers.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center', color: '#64748b' }}>
              <Typography variant="body1">
                Aún no hay usuarios registrados. Los conductores que se creen cuenta con correo o ingresen aparecerán listados aquí con la fecha y hora exacta.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Conductor</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Correo Electrónico</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rol Asignado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha y Hora de Registro</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Último Acceso</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registeredUsers.map((u) => (
                    <TableRow key={u.uid || u.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ bgcolor: '#0288d1', width: 34, height: 34, fontSize: '0.85rem' }}>
                            {(u.displayName || u.email || 'C').charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                            {u.displayName || 'Conductor'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontWeight: 500 }}>
                        {u.email || (u.isAnonymous ? 'Acceso Anónimo / Demo' : 'Sin correo')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={u.role === 'admin' ? 'Supervisor' : 'Conductor'}
                          color={u.role === 'admin' ? 'secondary' : 'primary'}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {formatDateTime(u.createdAt)}
                      </TableCell>
                      <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {formatDateTime(u.lastLogin)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* TAB 1: Real Driving Sessions */}
      {activeTab === 1 && (
        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Sesiones Reales de Conducción Registradas
            </Typography>
            <Chip label={`${sessions.length} Sesiones guardadas`} color="primary" size="small" variant="outlined" />
          </Box>

          {sessions.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center', color: '#64748b' }}>
              <Typography variant="body1">
                No hay sesiones de conducción registradas todavía. Realiza una sesión en el Monitor en Vivo y aparecerá aquí automáticamente.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID Sesión</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha y Hora</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duración</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nivel de Riesgo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fatiga Promedio</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Micro-Sueños</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total Alertas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((s) => {
                    const risk = getRiskLevelInfo(s.metrics?.riskLevel || 'low');
                    return (
                      <TableRow key={s.sessionId || s.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                          {s.sessionId || s.id}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{formatDateTime(s.startedAt)}</TableCell>
                        <TableCell>{formatDuration(s.durationSeconds || 0)}</TableCell>
                        <TableCell>
                          <Chip size="small" label={risk.label} color={risk.color} sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {s.metrics?.avgFatiguePercentage || 0}%
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: s.metrics?.microsleepCount > 0 ? '#dc2626' : 'inherit' }}>
                          {s.metrics?.microsleepCount || 0}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: s.metrics?.totalAlerts > 0 ? '#ea580c' : 'inherit' }}>
                          {s.metrics?.totalAlerts || 0}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Firebase Settings Modal */}
      <FirebaseConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfigSaved={() => {
          setConfigModalOpen(false);
          loadData();
        }}
      />
    </Box>
  );
}
