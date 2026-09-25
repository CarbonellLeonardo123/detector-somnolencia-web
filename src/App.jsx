import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import muiTheme from './theme/muiTheme';
import { AuthProvider } from './context/AuthContext';
import { DetectionProvider } from './context/DetectionContext';
import MainLayout from './components/layout/MainLayout';
import MonitorPage from './pages/MonitorPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <DetectionProvider>
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<MonitorPage />} />
                <Route path="/historial" element={<HistoryPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </DetectionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
