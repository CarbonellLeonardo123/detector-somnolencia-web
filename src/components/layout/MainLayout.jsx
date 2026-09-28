import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import Header from './Header';

export default function MainLayout({ children, onExitApp }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      <Header onExitApp={onExitApp} />

      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="xl">{children}</Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2.5,
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          SomnoGuard &copy; {new Date().getFullYear()} &mdash; Sistema Inteligente de Detección de Somnolencia y Fatiga en Tiempo Real.
        </Typography>
      </Box>
    </Box>
  );
}
