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
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Functions as FunctionsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';
import MathModelModal from '../math/MathModelModal';

export default function Header({ onExitApp }) {
  const location = useLocation();
  const { user, profile, isAuthenticated, logout } = useAuth();

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
    if (onExitApp) {
      await onExitApp();
    } else {
      await logout();
    }
  };

  const navItemSx = (active) => ({
    minHeight: 38,
    px: { xs: 1.1, md: 1.5 },
    borderRadius: 2,
    color: active ? '#0f5b66' : '#5c737b',
    backgroundColor: active ? '#dff3f1' : 'transparent',
    border: active ? '1px solid #b8e4df' : '1px solid transparent',
    fontWeight: active ? 800 : 700,
    transition: 'background-color 160ms ease, color 160ms ease, border-color 160ms ease',
    '&:hover': {
      color: '#0f5b66',
      backgroundColor: '#e7f5f3',
      borderColor: '#c7e9e5',
    },
  });

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#fbfdfd',
          borderBottom: '1px solid #dce8e9',
          color: '#12343b',
          boxShadow: '0 2px 14px rgba(18, 52, 59, 0.04)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 76, md: 70 }, flexWrap: 'wrap', gap: 1.25, py: 1 }}>
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
                  background: 'linear-gradient(135deg, #0f5b66 0%, #22a6a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 5px 14px rgba(15, 91, 102, 0.28)',
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
                    color: '#12343b',
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

            {/* Navigation Buttons (Cleaned) */}
            <Box
              component="nav"
              aria-label="Navegación principal"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.25,
                p: 0.5,
                borderRadius: 2.5,
                backgroundColor: '#f0f6f6',
                border: '1px solid #dce8e9',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
              }}
            >
              <Button
                component={Link}
                to="/"
                variant="text"
                size="small"
                startIcon={<VisibilityIcon />}
                sx={navItemSx(location.pathname === '/')}
              >
                Monitor
              </Button>

              <Button
                component={Link}
                to="/historial"
                variant="text"
                size="small"
                startIcon={<HistoryIcon />}
                sx={navItemSx(location.pathname === '/historial')}
              >
                Historial
              </Button>

              <Button
                component={Link}
                to="/flota"
                variant="text"
                size="small"
                startIcon={<LocalShippingIcon />}
                endIcon={<Chip label="Admin" size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: location.pathname === '/flota' ? '#b8e4df' : '#dce8e9', color: '#31545c' }} />}
                sx={navItemSx(location.pathname === '/flota')}
              >
                Panel Flota
              </Button>
            </Box>

            {/* Right Tools: Math Documentation & User Profile */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Discrete Math Model Button */}
              <Tooltip title="Ver fórmulas matemáticas y algoritmos de fatiga">
                <Button
                  variant="outlined"
                  color="info"
                  size="small"
                  startIcon={<FunctionsIcon />}
                  onClick={() => setMathModalOpen(true)}
                  sx={{
                    fontWeight: 700,
                    borderColor: '#b8e4df',
                    color: '#0f5b66',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                >
                  Ecuaciones & IA
                </Button>
              </Tooltip>

              {/* User Account / Exit */}
              {isAuthenticated ? (
                <>
                  <Tooltip title="Cuenta de Conductor">
                    <Button
                      onClick={handleMenuOpen}
                      variant="text"
                      color="inherit"
                      size="small"
                      startIcon={
                        <Avatar sx={{ width: 28, height: 28, bgcolor: user?.isAnonymous ? '#d97706' : '#0f5b66', fontSize: '0.8rem' }}>
                          {user?.isAnonymous ? 'I' : (profile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'C')}
                        </Avatar>
                      }
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      {user?.isAnonymous ? 'Modo Invitado' : (profile?.displayName || user?.email?.split('@')[0])}
                    </Button>
                  </Tooltip>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {user?.isAnonymous ? 'Conductor Invitado (Demo)' : (profile?.displayName || 'Conductor')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {user?.isAnonymous ? 'Modo de prueba rápida' : user?.email}
                      </Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={handleLogout} sx={{ color: '#dc2626', fontWeight: 600 }}>
                      <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                      Salir / Cambiar Conductor
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={() => setAuthModalOpen(true)}
                  sx={{ fontWeight: 700, borderColor: '#b8e4df', color: '#0f5b66' }}
                >
                  Iniciar Sesión
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Modals */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <MathModelModal open={mathModalOpen} onClose={() => setMathModalOpen(false)} />
    </>
  );
}
