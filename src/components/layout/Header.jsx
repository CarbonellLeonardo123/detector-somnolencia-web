import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
  Stack,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { isFirebaseConfigured } from '../../services/firebase/config';

export default function Header() {
  const location = useLocation();

  return (
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
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 70 }}>
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
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1976d2 0%, #0288d1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
              }}
            >
              <VisibilityIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
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
                sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.75rem' }}
              >
                Detección de Somnolencia en Tiempo Real
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links & Cloud Status */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              component={Link}
              to="/"
              variant={location.pathname === '/' ? 'contained' : 'text'}
              color="primary"
              startIcon={<VisibilityIcon />}
              sx={{
                boxShadow: location.pathname === '/' ? '0 2px 8px rgba(25, 118, 210, 0.25)' : 'none',
              }}
            >
              Monitor en Vivo
            </Button>

            <Button
              component={Link}
              to="/historial"
              variant={location.pathname === '/historial' ? 'contained' : 'text'}
              color="primary"
              startIcon={<HistoryIcon />}
              sx={{
                boxShadow:
                  location.pathname === '/historial' ? '0 2px 8px rgba(25, 118, 210, 0.25)' : 'none',
              }}
            >
              Historial
            </Button>

            <Chip
              size="small"
              icon={
                isFirebaseConfigured ? (
                  <CloudDoneIcon fontSize="small" sx={{ color: '#16a34a !important' }} />
                ) : (
                  <CloudOffIcon fontSize="small" sx={{ color: '#ea580c !important' }} />
                )
              }
              label={isFirebaseConfigured ? 'Nube Firestore' : 'Modo Local'}
              variant="outlined"
              sx={{
                borderColor: isFirebaseConfigured ? '#bbf7d0' : '#fed7aa',
                backgroundColor: isFirebaseConfigured ? '#f0fdf4' : '#fff7ed',
                color: isFirebaseConfigured ? '#15803d' : '#c2410c',
                fontSize: '0.75rem',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
