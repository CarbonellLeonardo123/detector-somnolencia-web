import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  getStoredFirebaseConfig,
  saveCustomFirebaseConfig,
  clearCustomFirebaseConfig,
  testFirestoreConnection,
  isFirebaseConfigured,
} from '../../services/firebase/config';

export default function FirebaseConfigModal({ open, onClose, onConfigSaved }) {
  const [config, setConfig] = useState(getStoredFirebaseConfig());
  const [rawJson, setRawJson] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const securityRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleJsonPaste = (text) => {
    setRawJson(text);
    try {
      // Extract json even if wrapped in `const firebaseConfig = { ... }`
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = Function('"use strict";return (' + match[0] + ')')();
        setConfig((prev) => ({
          ...prev,
          apiKey: parsed.apiKey || '',
          authDomain: parsed.authDomain || '',
          projectId: parsed.projectId || '',
          storageBucket: parsed.storageBucket || '',
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId || '',
          measurementId: parsed.measurementId || '',
        }));
      }
    } catch (e) {
      console.warn('Could not parse JSON config:', e);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testFirestoreConnection(config);
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Error inesperado al probar conexión.',
        error: String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveCustomFirebaseConfig(config);
      if (onConfigSaved) onConfigSaved();
      onClose();
      window.location.reload(); // Refresh to bind new Firestore client
    } catch (e) {
      alert('Error al guardar la configuración: ' + e.message);
    }
  };

  const handleReset = async () => {
    await clearCustomFirebaseConfig();
    setConfig(getStoredFirebaseConfig());
    if (onConfigSaved) onConfigSaved();
    onClose();
    window.location.reload();
  };

  const copyRules = () => {
    navigator.clipboard.writeText(securityRulesSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {isFirebaseConfigured ? (
            <CloudDoneIcon sx={{ color: '#16a34a', fontSize: 28 }} />
          ) : (
            <CloudOffIcon sx={{ color: '#ea580c', fontSize: 28 }} />
          )}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Configuración de Firebase Firestore
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              {isFirebaseConfigured
                ? 'Conectado a Firebase Firestore en la nube'
                : 'Operando en Modo Local (LocalStorage). Ingresa tus credenciales para conectar.'}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {testResult && (
          <Alert
            severity={testResult.success ? 'success' : 'error'}
            sx={{ mb: 3 }}
            onClose={() => setTestResult(null)}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {testResult.message}
            </Typography>
            {testResult.error && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                Detalle: {testResult.error}
              </Typography>
            )}
            {testResult.uid && (
              <Typography variant="caption" sx={{ display: 'block' }}>
                UID anónimo verificado: {testResult.uid}
              </Typography>
            )}
          </Alert>
        )}

        {/* Quick Paste Area */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Pegar Configuración Rápida (Firebase Console)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 1, fontSize: '0.85rem' }}>
            Pega el bloque <code>const firebaseConfig = &#123; ... &#125;</code> de Firebase Console y se llenarán los campos automáticamente:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder='const firebaseConfig = { apiKey: "...", projectId: "...", ... };'
            value={rawJson}
            onChange={(e) => handleJsonPaste(e.target.value)}
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Individual Inputs */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
          Campos de Credenciales
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="API Key (apiKey)"
            value={config.apiKey || ''}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Project ID (projectId)"
            value={config.projectId || ''}
            onChange={(e) => handleChange('projectId', e.target.value)}
            fullWidth
            size="small"
            required
          />
          <TextField
            label="Auth Domain (authDomain)"
            value={config.authDomain || ''}
            onChange={(e) => handleChange('authDomain', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Storage Bucket (storageBucket)"
            value={config.storageBucket || ''}
            onChange={(e) => handleChange('storageBucket', e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="App ID (appId)"
            value={config.appId || ''}
            onChange={(e) => handleChange('appId', e.target.value)}
            fullWidth
            size="small"
          />
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Security Rules Box */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Reglas de Seguridad Recomendadas en Firestore
            </Typography>
            <Button
              size="small"
              startIcon={isCopied ? <CheckCircleIcon sx={{ color: '#16a34a' }} /> : <ContentCopyIcon />}
              onClick={copyRules}
            >
              {isCopied ? '¡Copiado!' : 'Copiar Reglas'}
            </Button>
          </Box>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              borderRadius: 2,
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              overflowX: 'auto',
            }}
          >
            <pre style={{ margin: 0 }}>{securityRulesSnippet}</pre>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={handleReset} color="inherit" size="small">
          Restablecer a Modo Local
        </Button>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={handleTestConnection}
            disabled={isTesting || !config.apiKey || !config.projectId}
            startIcon={isTesting && <CircularProgress size={16} />}
          >
            {isTesting ? 'Probando...' : 'Probar Conexión'}
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!config.apiKey || !config.projectId}
          >
            Guardar y Conectar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
