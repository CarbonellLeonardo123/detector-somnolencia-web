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
        background: 'linear-gradient(180deg, #f5f9f9 0%, #edf3f4 100%)',
      }}
    >
      <Header onExitApp={onExitApp} />

      <Box component="main" sx={{ flexGrow: 1, py: { xs: 2.5, md: 4 } }}>
        <Container maxWidth="xl">{children}</Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2.5,
          borderTop: '1px solid #dce8e9',
          backgroundColor: '#f8fbfb',
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
