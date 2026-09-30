import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
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
  CloudOff as CloudOffIcon,
  Visibility as VisibilityIcon,
  Functions as FunctionsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import MathModelModal from '../math/MathModelModal';
import { getAuthErrorMessage } from '../../utils/authErrors';

export default function WelcomeAuthPage({ onEnterApp }) {
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
  const [mathModalOpen, setMathModalOpen] = useState(false);

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
        onEnterApp();
      } else {
        // Crear Cuenta
        const res = await register(normalizedEmail, password, displayName.trim());
        if (res?.verificationSent) {
          setVerificationSent(true);
        } else if (res?.localOnly) {
          setLocalAccountCreated(true);
        } else {
          onEnterApp();
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
    try {
      await loginGuest();
      onEnterApp();
    } catch (err) {
      console.error('Guest login error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        background: 'radial-gradient(circle at 50% -15%, rgba(14, 165, 233, 0.24), transparent 42%), radial-gradient(circle at 100% 100%, rgba(37, 99, 235, 0.18), transparent 35%), #0b1220',
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
          <Chip
            label="MONITOREO INTELIGENTE · EN TIEMPO REAL"
            size="small"
            sx={{
              mt: 1,
              color: '#bae6fd',
              borderColor: 'rgba(125, 211, 252, 0.28)',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              fontSize: '0.64rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
            }}
            variant="outlined"
          />
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
              <Tab label="Iniciar Sesión" sx={{ fontWeight: 800, py: 2, textTransform: 'none' }} />
              <Tab label="Crear Cuenta" sx={{ fontWeight: 800, py: 2, textTransform: 'none' }} />
            </Tabs>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 }, backgroundColor: '#ffffff' }}>
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
                  {localAccountCreated ? 'Cuenta guardada en modo local' : '¡Cuenta Creada con Éxito!'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', mb: 3 }}>
                  {localAccountCreated
                    ? 'Firebase no está configurado en este entorno. Esta cuenta solo se guardó en este navegador y no se sincronizará con tu proyecto en la nube.'
                    : <>Hemos enviado un correo de verificación oficial a <strong>{email}</strong>. Revisa tu bandeja de entrada o spam para confirmar tu cuenta.</>}
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
                {infoMessage && (
                  <Alert severity="info" sx={{ mb: 2.5 }}>
                    {infoMessage}
                  </Alert>
                )}

                <Stack spacing={2.5}>
                  {tab === 1 && (
                    <TextField
                      label="Nombre del Conductor"
                      placeholder="Ej. Juan Pérez"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoComplete="name"
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
                    autoComplete="email"
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
                    autoComplete={tab === 0 ? 'current-password' : 'new-password'}
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
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
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
                      transition: 'transform 160ms ease, box-shadow 160ms ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 8px 20px rgba(25, 118, 210, 0.45)',
                      },
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
                  {tab === 0 && (
                    <Button
                      type="button"
                      size="small"
                      onClick={handlePasswordReset}
                      disabled={submitting}
                      sx={{
                        alignSelf: 'center',
                        mt: -1,
                        color: '#1976d2',
                        fontWeight: 700,
                        textTransform: 'none',
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  )}
                </Stack>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                    O INGRESA SIN REGISTRO
                  </Typography>
                </Divider>

                {/* Instant Guest / Demo Button */}
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  size="large"
                  startIcon={<DirectionsCarIcon />}
                  onClick={handleGuestLogin}
                  disabled={submitting}
                  sx={{
                    py: 1.4,
                    color: '#334155',
                    borderColor: '#cbd5e1',
                    fontWeight: 700,
                    backgroundColor: '#f8fafc',
                    transition: 'background-color 160ms ease, border-color 160ms ease, transform 160ms ease',
                    '&:hover': {
                      backgroundColor: '#f1f5f9',
                      borderColor: '#94a3b8',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Entrar como Conductor Invitado (Modo Demo)
                </Button>
              </form>
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
