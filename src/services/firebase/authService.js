import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

const LOCAL_STORAGE_USERS_KEY = 'somnoguard_registered_users_list';
const LOCAL_STORAGE_USER_KEY = 'somnoguard_user_profile';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'somnoguard_local_accounts';
const PASSWORD_HASH_ITERATIONS = 100000;

function createAuthError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function readLocalJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function derivePasswordHash(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: base64ToBytes(salt),
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return bytesToBase64(new Uint8Array(bits));
}

async function createPasswordCredentials(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const passwordSalt = bytesToBase64(saltBytes);
  return {
    passwordSalt,
    passwordHash: await derivePasswordHash(password, passwordSalt),
  };
}

function toPublicUser(account) {
  if (!account) return null;
  const user = { ...account };
  delete user.passwordHash;
  delete user.passwordSalt;
  return user;
}

function saveCurrentLocalUser(user) {
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
}

function updateLocalUsersList(user) {
  const existing = readLocalJson(LOCAL_STORAGE_USERS_KEY, []);
  const updated = [user, ...existing.filter((item) => item.uid !== user.uid && item.email !== user.email)];
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated));
}

/**
 * Registers a new user with Email and Password, sends a verification email,
 * and records their profile in Firestore.
 */
export async function registerWithEmail(email, password, displayName) {
  const normalizedEmail = normalizeEmail(email);
  const name = displayName || normalizedEmail.split('@')[0];

  if (!isFirebaseConfigured || !auth) {
    if (password.length < 6) {
      throw createAuthError('auth/weak-password', 'La contraseña debe tener al menos 6 caracteres.');
    }

    const accounts = readLocalJson(LOCAL_STORAGE_ACCOUNTS_KEY, {});
    const legacyUsers = readLocalJson(LOCAL_STORAGE_USERS_KEY, []);
    if (accounts[normalizedEmail]) {
      throw createAuthError('auth/email-already-in-use', 'Este correo ya está registrado.');
    }

    const legacyUser = legacyUsers.find((item) => normalizeEmail(item.email) === normalizedEmail);
    const credentials = await createPasswordCredentials(password);
    const localUser = {
      uid: legacyUser?.uid || 'user_' + Date.now(),
      email: normalizedEmail,
      displayName: displayName || legacyUser?.displayName || name,
      isAnonymous: false,
      emailVerified: true,
      role: 'driver',
      createdAt: legacyUser?.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    accounts[normalizedEmail] = { ...localUser, ...credentials };
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    saveCurrentLocalUser(localUser);
    updateLocalUsersList(localUser);

    return { user: localUser, verificationSent: false, localOnly: true };
  }

  const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const user = cred.user;

  if (displayName) {
    await updateProfile(user, { displayName }).catch(() => {});
  }

  // Send official Firebase email verification
  let verificationSent = false;
  try {
    await sendEmailVerification(user);
    verificationSent = true;
  } catch (err) {
    console.warn('Could not send verification email:', err);
  }

  // Create user profile document in Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role: 'driver',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Error creating user document in Firestore:', err);
    }
  }

  return { user, verificationSent };
}

/**
 * Signs in an existing user with Email and Password
 */
export async function loginWithEmail(email, password) {
  const normalizedEmail = normalizeEmail(email);

  if (!isFirebaseConfigured || !auth) {
    const accounts = readLocalJson(LOCAL_STORAGE_ACCOUNTS_KEY, {});
    const account = accounts[normalizedEmail];

    if (!account) {
      const legacyUsers = readLocalJson(LOCAL_STORAGE_USERS_KEY, []);
      const legacyCurrentUser = readLocalJson(LOCAL_STORAGE_USER_KEY, null);
      const hasLegacyAccount = legacyUsers.some((item) => normalizeEmail(item.email) === normalizedEmail)
        || normalizeEmail(legacyCurrentUser?.email) === normalizedEmail;
      if (hasLegacyAccount) {
        throw createAuthError(
          'auth/local-account-upgrade-required',
          'Esta cuenta local fue creada con una versión anterior. Regístrala nuevamente.'
        );
      }
      throw createAuthError('auth/invalid-credential', 'Correo o contraseña incorrectos.');
    }

    const passwordHash = await derivePasswordHash(password, account.passwordSalt);
    if (passwordHash !== account.passwordHash) {
      throw createAuthError('auth/invalid-credential', 'Correo o contraseña incorrectos.');
    }

    const updatedAccount = { ...account, lastLogin: new Date().toISOString() };
    accounts[normalizedEmail] = updatedAccount;
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));

    const localUser = toPublicUser(updatedAccount);
    saveCurrentLocalUser(localUser);
    updateLocalUsersList(localUser);
    return { user: localUser };
  }

  const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);

  // Update last login in Firestore
  if (db && cred.user) {
    setDoc(
      doc(db, 'users', cred.user.uid),
      {
        lastLogin: serverTimestamp(),
        email: cred.user.email,
        displayName: cred.user.displayName || cred.user.email.split('@')[0],
      },
      { merge: true }
    ).catch(() => {});
  }

  return cred;
}

/**
 * Fast Guest / Demo login for presentations without registration
 */
export async function loginAsGuest() {
  const guestName = 'Conductor Invitado';

  if (!isFirebaseConfigured || !auth) {
    const guestUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      displayName: guestName,
      isAnonymous: true,
      emailVerified: false,
      role: 'guest',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    saveCurrentLocalUser(guestUser);
    return { user: guestUser };
  }

  const cred = await signInAnonymously(auth);

  if (db && cred.user) {
    setDoc(
      doc(db, 'users', cred.user.uid),
      {
        uid: cred.user.uid,
        displayName: guestName,
        isAnonymous: true,
        role: 'guest',
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {});
  }

  return cred;
}

/**
 * Resends the verification email to the currently logged in user
 */
export async function resendVerificationEmail(user) {
  if (!user || user.isAnonymous) return false;
  await sendEmailVerification(user);
  return true;
}

/**
 * Sends a password reset email
 */
export async function resetPassword(email) {
  if (!isFirebaseConfigured || !auth) return true;
  await sendPasswordResetEmail(auth, email);
  return true;
}

/**
 * Signs out the current user
 */
export async function logoutUser() {
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  sessionStorage.removeItem('somnoguard_has_entered');
  sessionStorage.removeItem('somnoguard_admin_authenticated');
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
}

/**
 * Fetches user profile data from Firestore
 */
export async function getUserProfile(uid) {
  if (!isFirebaseConfigured || !db || !uid) {
    const saved = readLocalJson(LOCAL_STORAGE_USER_KEY, null);
    return saved?.uid === uid ? saved : null;
  }

  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.warn('Error fetching user profile:', e);
  }

  return null;
}

/**
 * Real Firestore query for the Fleet Admin Panel:
 * Returns all real users registered in Firestore with their registration and last login timestamps!
 */
export async function getAllRegisteredUsers() {
  if (isFirebaseConfigured && db) {
    try {
      const usersRef = collection(db, 'users');
      let snapshot;
      try {
        const q = query(usersRef, orderBy('createdAt', 'desc'), limit(50));
        snapshot = await getDocs(q);
      } catch {
        // Fallback in case orderBy requires index or documents lack createdAt
        snapshot = await getDocs(query(usersRef, limit(50)));
      }
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || null),
          lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : (data.lastLogin || null),
        });
      });
      // Sort client-side
      list.sort((a, b) => new Date(b.createdAt || b.lastLogin || 0) - new Date(a.createdAt || a.lastLogin || 0));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Error fetching all users from Firestore:', e);
    }
  }

  // Fallback to local storage list
  return readLocalJson(LOCAL_STORAGE_USERS_KEY, []).map(toPublicUser);
}
