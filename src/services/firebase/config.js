import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const LOCAL_STORAGE_CONFIG_KEY = 'somnoguard_firebase_config';

/**
 * Resolves Firebase configuration with precedence:
 * 1. Explicit in-app stored configuration (localStorage)
 * 2. Vite environment variables (VITE_FIREBASE_*)
 */
export function getStoredFirebaseConfig() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading stored Firebase config:', e);
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };
}

let activeConfig = getStoredFirebaseConfig();

export let isFirebaseConfigured = Boolean(
  activeConfig.apiKey &&
  activeConfig.projectId &&
  activeConfig.apiKey !== 'your_api_key_here'
);

let app = null;
let auth = null;
let db = null;

export function initializeFirebase() {
  activeConfig = getStoredFirebaseConfig();
  isFirebaseConfigured = Boolean(
    activeConfig.apiKey &&
    activeConfig.projectId &&
    activeConfig.apiKey !== 'your_api_key_here'
  );

  if (isFirebaseConfigured) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      return { app, auth, db, isConfigured: true };
    } catch (error) {
      console.warn('Firebase initialization error, operating in local offline mode:', error);
      return { app: null, auth: null, db: null, isConfigured: false, error };
    }
  }

  return { app: null, auth: null, db: null, isConfigured: false };
}

// Initial bootstrap
initializeFirebase();

/**
 * Saves and applies new Firebase credentials
 */
export async function saveCustomFirebaseConfig(config) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
    // Reset apps
    const apps = getApps();
    for (const a of apps) {
      await deleteApp(a).catch(() => {});
    }
    return initializeFirebase();
  } catch (e) {
    console.error('Error saving Firebase config:', e);
    throw e;
  }
}

/**
 * Clears stored configuration to revert to .env
 */
export async function clearCustomFirebaseConfig() {
  localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY);
  const apps = getApps();
  for (const a of apps) {
    await deleteApp(a).catch(() => {});
  }
  return initializeFirebase();
}

/**
 * Tests live connection and write/read permissions to Firestore
 */
export async function testFirestoreConnection(customConfig = null) {
  let testApp = null;
  try {
    const configToTest = customConfig || getStoredFirebaseConfig();
    if (!configToTest.apiKey || !configToTest.projectId) {
      throw new Error('Faltan el apiKey o projectId de Firebase.');
    }

    const testAppName = `test_app_${Date.now()}`;
    testApp = initializeApp(configToTest, testAppName);
    const testAuth = getAuth(testApp);
    const testDb = getFirestore(testApp);

    // Test Anonymous Authentication
    const userCred = await signInAnonymously(testAuth);
    const uid = userCred.user.uid;

    // Test Firestore Document Write
    const testDocRef = doc(testDb, 'users', uid, '_test', 'ping');
    await setDoc(testDocRef, {
      ping: true,
      clientTime: new Date().toISOString(),
      serverTime: serverTimestamp(),
    });

    // Test Firestore Document Read
    const docSnap = await getDoc(testDocRef);
    if (!docSnap.exists()) {
      throw new Error('No se pudo verificar la lectura del documento de prueba en Firestore.');
    }

    // Clean up test document
    await deleteDoc(testDocRef).catch(() => {});
    await deleteApp(testApp).catch(() => {});

    return {
      success: true,
      uid,
      message: '¡Conexión a Firebase Firestore exitosa y permisos verificados!',
    };
  } catch (error) {
    if (testApp) {
      await deleteApp(testApp).catch(() => {});
    }
    return {
      success: false,
      error: error.message || String(error),
      message: 'Fallo al conectar con Firestore. Revisa las credenciales y las Reglas de Seguridad.',
    };
  }
}

export { app, auth, db };
