import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  DirectionsCar as DirectionsCarIcon,
  Functions as FunctionsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { isFirebaseConfigured } from '../../services/firebase/config';
import { useAuth } from '../../context/AuthContext';
import FirebaseConfigModal from '../history/FirebaseConfigModal';
import AuthModal from '../auth/AuthModal';
import MathModelModal from '../math/MathModelModal';

export default function Header() {
  const location = useLocation();
  const { user, profile, isAuthenticated, logout } = useAuth();

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mathModalOpen, setMathModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          color: '#1e293b',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 70, flexWrap: 'wrap', gap: 1 }}>
            {/* Logo & Branding */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1976d2 0%, #0288d1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)',
                }}
              >
                <VisibilityIcon fontSize="medium" />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    fontSize: '1.25rem',
                    lineHeight: 1.1,
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  SomnoGuard
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  IA de Detección de Fatiga y Somnolencia
                </Typography>
              </Box>
            </Box>

            {/* Navigation Buttons */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              <Button
                component={Link}
                to="/"
                variant={location.pathname === '/' ? 'contained' : 'text'}
                color="primary"
                size="small"
                startIcon={<VisibilityIcon />}
                sx={{ fontWeight: 700 }}
              >
                Monitor
              </Button>

              <Button
                component={Link}
                to="/historial"
                variant={location.pathname === '/historial' ? 'contained' : 'text'}
                color="primary"
                size="small"
                startIcon={<HistoryIcon />}
                sx={{ fontWeight: 700 }}
              >
                Historial
              </Button>

              <Button
                component={Link}
                to="/flota"
                variant={location.pathname === '/flota' ? 'contained' : 'text'}
                color="primary"
                size="small"
                startIcon={<LocalShippingIcon />}
                sx={{ fontWeight: 700 }}
              >
                Panel Flota
              </Button>

              {/* Math Model Button for SENATI Presentation */}
              <Button
                variant="outlined"
                color="info"
                size="small"
                startIcon={<FunctionsIcon />}
                onClick={() => setMathModalOpen(true)}
                sx={{ fontWeight: 700, borderColor: '#bae6fd', color: '#0288d1' }}
              >
                Algoritmos & Ecuaciones
              </Button>
            </Stack>

            {/* User Auth Profile & Cloud State */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {isAuthenticated ? (
                <>
                  <Tooltip title="Cuenta de Conductor">
                    <Button
                      onClick={handleMenuOpen}
                      variant="text"
                      color="inherit"
                      size="small"
                      startIcon={
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2', fontSize: '0.8rem' }}>
                          {profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'C'}
                        </Avatar>
                      }
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      {profile?.displayName || user?.email?.split('@')[0]}
                    </Button>
                  </Tooltip>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {profile?.displayName || 'Conductor'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {user?.email}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: '#dc2626', fontWeight: 600 }}>
                      <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                      Cerrar Sesión
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={() => setAuthModalOpen(true)}
                  sx={{
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                  }}
                >
                  Iniciar Sesión / Registro
                </Button>
              )}

              {/* Firebase Cloud Chip */}
              <Tooltip title="Haz clic para ver o probar el estado de Firebase Firestore" arrow>
                <Chip
                  onClick={() => setConfigModalOpen(true)}
                  clickable
                  size="small"
                  icon={
                    isFirebaseConfigured ? (
                      <CloudDoneIcon fontSize="small" sx={{ color: '#16a34a !important' }} />
                    ) : (
                      <CloudOffIcon fontSize="small" sx={{ color: '#ea580c !important' }} />
                    )
                  }
                  label={isFirebaseConfigured ? 'Firestore Nube' : 'Modo Local'}
                  variant="outlined"
                  sx={{
                    borderColor: isFirebaseConfigured ? '#bbf7d0' : '#fed7aa',
                    backgroundColor: isFirebaseConfigured ? '#f0fdf4' : '#fff7ed',
                    color: isFirebaseConfigured ? '#15803d' : '#c2410c',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: { xs: 'none', md: 'inline-flex' },
                  }}
                />
              </Tooltip>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Modals */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <MathModelModal open={mathModalOpen} onClose={() => setMathModalOpen(false)} />
      <FirebaseConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfigSaved={() => setConfigModalOpen(false)}
      />
    </>
  );
}
