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
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ open, onClose }) {
  const { register, login, loginGuest } = useAuth();

  const [tab, setTab] = useState(0); // 0: Login, 1: Register
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setErrorMessage('');
    setVerificationSent(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      if (tab === 0) {
        // Iniciar Sesión
        await login(email, password);
        onClose();
      } else {
        // Crear Cuenta
        const res = await register(email, password, displayName);
        if (res?.verificationSent) {
          setVerificationSent(true);
        } else {
          onClose();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      let msg = 'Ocurrió un error al procesar tu solicitud.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Contraseña o correo incorrectos. Verifica tus datos.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'El formato del correo electrónico no es válido.';
      }
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setSubmitting(true);
    try {
      await loginGuest();
      onClose();
    } catch (err) {
      console.error('Guest login error:', err);
    } finally {
      setSubmitting(false);
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
          <Tab label="Iniciar Sesión" sx={{ fontWeight: 700 }} />
          <Tab label="Crear Cuenta" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {verificationSent ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <MarkEmailReadIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#166534', mb: 1 }}>
              ¡Correo de Verificación Enviado!
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mb: 3 }}>
              Hemos enviado un enlace de confirmación a <strong>{email}</strong>. Por favor, revisa tu bandeja de entrada o spam para verificar tu identidad.
            </Typography>
            <Button variant="contained" fullWidth onClick={onClose} sx={{ py: 1.2, fontWeight: 700 }}>
              Entendido &mdash; Continuar a la App
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Stack spacing={2.5}>
              {tab === 1 && (
                <TextField
                  label="Nombre Completo / Conductor"
                  placeholder="Ej. Juan Pérez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
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
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
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
                sx={{ py: 1.2, fontWeight: 700, mt: 1 }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : tab === 0 ? (
                  'Ingresar como Conductor'
                ) : (
                  'Registrarse y Enviar Verificación'
                )}
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                O BIEN
              </Typography>
            </Divider>

            {/* Quick Demo Access */}
            <Button
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
                '&:hover': { backgroundColor: '#f1f5f9' },
              }}
            >
              Acceso Rápido como Invitado (Modo Demo)
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
