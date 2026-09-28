import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import muiTheme from './theme/muiTheme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DetectionProvider } from './context/DetectionContext';
import MainLayout from './components/layout/MainLayout';
import MonitorPage from './pages/MonitorPage';
import HistoryPage from './pages/HistoryPage';
import FleetAdminPage from './pages/FleetAdminPage';
import WelcomeAuthPage from './components/auth/WelcomeAuthPage';

function AppRoutes() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [hasEntered, setHasEntered] = useState(() => {
    return sessionStorage.getItem('somnoguard_has_entered') === 'true';
  });

  const handleEnterApp = () => {
    sessionStorage.setItem('somnoguard_has_entered', 'true');
    setHasEntered(true);
  };

  const handleOpenAdminFromWelcome = () => {
    sessionStorage.setItem('somnoguard_has_entered', 'true');
    setHasEntered(true);
    navigate('/flota');
  };

  const handleExitApp = async () => {
    sessionStorage.removeItem('somnoguard_has_entered');
    sessionStorage.removeItem('somnoguard_admin_authenticated');
    await logout();
    setHasEntered(false);
    navigate('/');
  };

  if (!hasEntered) {
    return (
      <WelcomeAuthPage
        onEnterApp={handleEnterApp}
        onOpenAdmin={handleOpenAdminFromWelcome}
      />
    );
  }

  return (
    <MainLayout onExitApp={handleExitApp}>
      <Routes>
        <Route path="/" element={<MonitorPage />} />
        <Route path="/historial" element={<HistoryPage />} />
        <Route path="/flota" element={<FleetAdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <DetectionProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DetectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
