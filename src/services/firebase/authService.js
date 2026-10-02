import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  reload,
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

/**
 * Registers a new user with Email and Password, sends a verification email,
 * and records their profile in Firestore.
 */
export async function registerWithEmail(email, password, displayName) {
  const name = displayName || email.split('@')[0];

  if (!isFirebaseConfigured || !auth) {
    const localUser = {
      uid: 'user_' + Date.now(),
      email,
      displayName: name,
      isAnonymous: false,
      emailVerified: true,
      role: 'driver',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(localUser));

    // Save to local users list
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || '[]');
    existing.unshift(localUser);
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(existing));

    return { user: localUser, verificationSent: false, localOnly: true };
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  if (displayName) {
    await updateProfile(user, { displayName }).catch(() => {});
  }

  // Send official Firebase email verification
  auth.languageCode = 'es';
  await sendEmailVerification(user);

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

  return { user, verificationSent: true };
}

/**
 * Signs in an existing user with Email and Password
 */
export async function loginWithEmail(email, password) {
  if (!isFirebaseConfigured || !auth) {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_USER_KEY) || '{}');
    if (saved.email === email) {
      saved.lastLogin = new Date().toISOString();
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(saved));
      return { user: saved };
    }
    const simulatedUser = {
      uid: 'user_' + Date.now(),
      email,
      displayName: email.split('@')[0],
      isAnonymous: false,
      emailVerified: true,
      role: 'driver',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(simulatedUser));
    return { user: simulatedUser };
  }

  const cred = await signInWithEmailAndPassword(auth, email, password);
  await reload(cred.user);
  if (!cred.user.emailVerified) {
    await signOut(auth);
    const error = new Error('Debes verificar tu correo antes de iniciar sesión.');
    error.code = 'auth/email-not-verified';
    throw error;
  }

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
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
    return { user: guestUser };
  }

  try {
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
  } catch (err) {
    console.warn('Firebase anonymous sign in failed, falling back to demo guest:', err);
    const guestUser = {
      uid: 'guest_' + Math.random().toString(36).substring(2, 9),
      displayName: guestName,
      isAnonymous: true,
      emailVerified: false,
      role: 'guest',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
    return { user: guestUser };
  }
}

/**
 * Resends the verification email to the currently logged in user
 */
export async function resendVerificationEmail(user) {
  if (!user || user.isAnonymous) return false;
  auth.languageCode = 'es';
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
      } catch (errOrder) {
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
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_USERS_KEY) || '[]');
}
