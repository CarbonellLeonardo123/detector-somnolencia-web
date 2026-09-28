import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

const LOCAL_STORAGE_USER_KEY = 'somnoguard_user_profile';

/**
 * Registers a new user with Email and Password, sends a verification email,
 * and creates their driver profile in Firestore.
 */
export async function registerWithEmail(email, password, displayName) {
  if (!isFirebaseConfigured || !auth) {
    // Offline local simulation
    const localUser = {
      uid: 'local_' + Date.now(),
      email,
      displayName: displayName || 'Conductor',
      isAnonymous: false,
      emailVerified: true,
      role: 'driver',
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));
    return { user: localUser, verificationSent: true };
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  // Update Auth Profile name
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

  // Create user profile in Firestore
  if (db) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email.split('@')[0],
        role: 'driver', // 'driver' | 'supervisor'
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
  if (!isFirebaseConfigured || !auth) {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER_KEY) || '{}');
    if (saved.email === email) {
      return { user: saved };
    }
    const simulatedUser = {
      uid: 'local_' + Date.now(),
      email,
      displayName: email.split('@')[0],
      isAnonymous: false,
      emailVerified: true,
      role: 'driver',
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(simulatedUser));
    return { user: simulatedUser };
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  
  // Update last login in Firestore
  if (db && cred.user) {
    setDoc(doc(db, 'users', cred.user.uid), { lastLogin: serverTimestamp() }, { merge: true }).catch(() => {});
  }

  return cred;
}

/**
 * Fast Guest / Demo login for presentations without registration
 */
export async function loginAsGuest() {
  if (!isFirebaseConfigured || !auth) {
    const guestUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Conductor Invitado (Demo)',
      isAnonymous: true,
      emailVerified: false,
      role: 'guest',
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
    return { user: guestUser };
  }

  return signInAnonymously(auth);
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
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
}

/**
 * Fetches user profile data from Firestore
 */
export async function getUserProfile(uid) {
  if (!isFirebaseConfigured || !db || !uid) {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER_KEY) || 'null');
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
