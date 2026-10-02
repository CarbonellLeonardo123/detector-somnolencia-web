import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  DirectionsCar as DirectionsCarIcon,
  MarkEmailRead as MarkEmailReadIcon,
  CloudOff as CloudOffIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from '../../utils/authErrors';

export default function AuthModal({ open, onClose }) {
  const { register, login, loginGuest, resetPassword } = useAuth();

  const [tab, setTab] = useState(0); // 0: Login, 1: Register
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [localAccountCreated, setLocalAccountCreated] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setErrorMessage('');
    setInfoMessage('');
    setVerificationSent(false);
    setLocalAccountCreated(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (tab === 0) {
        // Iniciar Sesión
        await login(normalizedEmail, password);
        onClose();
      } else {
        // Crear Cuenta
        const res = await register(normalizedEmail, password, displayName.trim());
        if (res?.verificationSent) {
          setVerificationSent(true);
        } else if (res?.localOnly) {
          setLocalAccountCreated(true);
        } else {
          onClose();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMessage('Escribe tu correo electrónico para enviarte el enlace de recuperación.');
      return;
    }

    setErrorMessage('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      await resetPassword(normalizedEmail);
      setInfoMessage(`Si el correo está registrado, recibirás un enlace de recuperación en ${normalizedEmail}.`);
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      await loginGuest();
    } catch (err) {
      console.warn('Guest login fallback:', err);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Portal de Conductores
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Iniciar Sesión" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="Crear Cuenta" sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {verificationSent || localAccountCreated ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: localAccountCreated ? '#fef3c7' : '#dcfce7',
                color: localAccountCreated ? '#b45309' : '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              {localAccountCreated ? <CloudOffIcon sx={{ fontSize: 36 }} /> : <MarkEmailReadIcon sx={{ fontSize: 36 }} />}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: localAccountCreated ? '#92400e' : '#166534', mb: 1 }}>
              {localAccountCreated ? 'Cuenta guardada en modo local' : '¡Correo de Verificación Enviado!'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mb: 3 }}>
              {localAccountCreated
                ? 'Firebase no está configurado en este entorno. Esta cuenta solo se guardó en este navegador y no se sincronizará con tu proyecto en la nube.'
                : <>Hemos enviado un enlace de confirmación a <strong>{email}</strong>. Por favor, confirma tu correo antes de iniciar sesión; revisa también tu bandeja de spam.</>}
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                setVerificationSent(false);
                setTab(0);
              }}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              Ir a iniciar sesión
            </Button>
          </Box>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}
            {infoMessage && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {infoMessage}
              </Alert>
            )}

            <Stack spacing={2.5}>
              {tab === 1 && (
                <TextField
                  label="Nombre Completo / Conductor"
                  placeholder="Ej. Juan Pérez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  fullWidth
                  required
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                label="Correo Electrónico"
                type="email"
                placeholder="conductor@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                fullWidth
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 0 ? 'current-password' : 'new-password'}
                fullWidth
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={submitting}
                sx={{
                  py: 1.2,
                  fontWeight: 700,
                  mt: 1,
                  transition: 'transform 160ms ease, box-shadow 160ms ease',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 7px 16px rgba(25, 118, 210, 0.25)' },
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : tab === 0 ? (
                  'Ingresar como Conductor'
                ) : (
                  'Registrarse y Enviar Verificación'
                )}
              </Button>
              {tab === 0 && (
                <Button
                  type="button"
                  size="small"
                  onClick={handlePasswordReset}
                  disabled={submitting}
                  sx={{ alignSelf: 'center', mt: 0.5, color: '#1976d2', fontWeight: 700, textTransform: 'none' }}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              )}
            </Stack>
          </form>

          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                O BIEN
              </Typography>
            </Divider>

            {/* Quick Demo Access */}
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              fullWidth
              startIcon={<DirectionsCarIcon />}
              onClick={handleGuestLogin}
              disabled={submitting}
              sx={{
                py: 1,
                color: '#475569',
                borderColor: '#cbd5e1',
                fontWeight: 600,
                transition: 'background-color 160ms ease, border-color 160ms ease, transform 160ms ease',
                '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#94a3b8', transform: 'translateY(-1px)' },
              }}
            >
              Acceso Rápido como Invitado (Modo Demo)
            </Button>
          </Box>
        </>
      )}
      </DialogContent>
    </Dialog>
  );
}
