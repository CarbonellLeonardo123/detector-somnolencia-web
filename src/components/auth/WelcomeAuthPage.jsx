import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
  Container,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  DirectionsCar as DirectionsCarIcon,
  MarkEmailRead as MarkEmailReadIcon,
  Visibility as VisibilityIcon,
  Functions as FunctionsIcon,
  } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import MathModelModal from '../math/MathModelModal';

export default function WelcomeAuthPage({ onEnterApp }) {
  const { register, login, loginGuest } = useAuth();

  const [tab, setTab] = useState(0); // 0: Login, 1: Register
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [mathModalOpen, setMathModalOpen] = useState(false);

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
        onEnterApp();
      } else {
        // Crear Cuenta
        const res = await register(email, password, displayName);
        if (res?.verificationSent) {
          setVerificationSent(true);
        } else {
          onEnterApp();
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
      onEnterApp();
    } catch (err) {
      console.error('Guest login error:', err);
      setErrorMessage(
        err.code === 'auth/operation-not-allowed'
          ? 'El modo demo no está habilitado en Firebase. Activa el inicio de sesión anónimo en Authentication > Sign-in method.'
          : 'No se pudo iniciar el modo demo. Revisa tu conexión e inténtalo de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#0f172a',
        background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="sm">
        {/* App Title Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1976d2 0%, #0288d1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 24px rgba(2, 136, 209, 0.4)',
            }}
          >
            <VisibilityIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              mb: 1,
            }}
          >
            SomnoGuard
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 460, mx: 'auto' }}>
            Sistema Inteligente de Detección de Somnolencia y Fatiga en Tiempo Real con Visión Artificial
          </Typography>
        </Box>

        {/* Main Card */}
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#ffffff' }}>
            <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
              <Tab label="Iniciar Sesión" sx={{ fontWeight: 800, py: 2 }} />
              <Tab label="Crear Cuenta" sx={{ fontWeight: 800, py: 2 }} />
            </Tabs>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 }, backgroundColor: '#ffffff' }}>
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
                  ¡Cuenta Creada con Éxito!
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', mb: 3 }}>
                  Hemos enviado un correo de verificación oficial a <strong>{email}</strong>. Revisa tu bandeja de entrada o spam para confirmar tu cuenta.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={onEnterApp}
                  size="large"
                  sx={{ py: 1.5, fontWeight: 800 }}
                >
                  Continuar al Monitor de Conducción
                </Button>
              </Box>
            ) : (
              <form onSubmit={handleSubmit}>
                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 2.5 }}>
                    {errorMessage}
                  </Alert>
                )}

                <Stack spacing={2.5}>
                  {tab === 1 && (
                    <TextField
                      label="Nombre del Conductor"
                      placeholder="Ej. Juan Pérez"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}

                  <TextField
                    label="Correo Electrónico"
                    type="email"
                    placeholder="conductor@somnoguard.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: '#64748b' }} />
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
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
                      py: 1.6,
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)',
                    }}
                  >
                    {submitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : tab === 0 ? (
                      'Ingresar al Monitor'
                    ) : (
                      'Registrarse y Enviar Verificación'
                    )}
                  </Button>
                </Stack>
              </form>
            )}

            {/* Divider and Instant Guest / Demo Button outside the form */}
            {!verificationSent && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                    O INGRESA SIN REGISTRO
                  </Typography>
                </Divider>

                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  size="large"
                  startIcon={<DirectionsCarIcon />}
                  onClick={handleGuestLogin}
                  disabled={submitting}
                  sx={{
                    py: 1.4,
                    color: '#1e293b',
                    borderColor: '#cbd5e1',
                    fontWeight: 700,
                    backgroundColor: '#f8fafc',
                    '&:hover': { backgroundColor: '#f1f5f9', borderColor: '#94a3b8' },
                  }}
                >
                  Entrar como Conductor Invitado (Modo Demo)
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            size="small"
            startIcon={<FunctionsIcon />}
            onClick={() => setMathModalOpen(true)}
            sx={{ color: '#94a3b8', fontWeight: 600, '&:hover': { color: '#38bdf8' } }}
          >
            Ver Ecuaciones y Algoritmos
          </Button>
        </Box>
      </Container>

      {/* Math Modal */}
      <MathModelModal open={mathModalOpen} onClose={() => setMathModalOpen(false)} />
    </Box>
  );
}
