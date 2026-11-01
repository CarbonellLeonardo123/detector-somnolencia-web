import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./config', () => ({
  auth: null,
  db: null,
  isFirebaseConfigured: false,
}));

import { loginWithEmail, registerWithEmail } from './authService';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  clear() {
    this.values.clear();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  removeItem(key) {
    this.values.delete(key);
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

describe('local authentication', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    vi.stubGlobal('sessionStorage', new MemoryStorage());
  });

  it('rejects an unknown email instead of creating an account during login', async () => {
    await expect(loginWithEmail('unknown@example.com', 'secret123')).rejects.toMatchObject({
      code: 'auth/invalid-credential',
    });

    expect(localStorage.getItem('somnoguard_user_profile')).toBeNull();
  });

  it('stores only a salted password hash and validates it on login', async () => {
    const result = await registerWithEmail('driver@example.com', 'secret123', 'Driver');
    const accounts = JSON.parse(localStorage.getItem('somnoguard_local_accounts'));
    const account = accounts['driver@example.com'];

    expect(result.user.email).toBe('driver@example.com');
    expect(account.passwordHash).toBeTruthy();
    expect(account.passwordSalt).toBeTruthy();
    expect(JSON.stringify(account)).not.toContain('secret123');

    await expect(loginWithEmail('driver@example.com', 'wrong-password')).rejects.toMatchObject({
      code: 'auth/invalid-credential',
    });

    const login = await loginWithEmail('DRIVER@example.com', 'secret123');
    expect(login.user.uid).toBe(result.user.uid);
  });

  it('rejects legacy accounts that have no password hash with a migration error', async () => {
    localStorage.setItem(
      'somnoguard_registered_users_list',
      JSON.stringify([{ uid: 'legacy-1', email: 'legacy@example.com', displayName: 'Legacy' }])
    );

    await expect(loginWithEmail('legacy@example.com', 'secret123')).rejects.toMatchObject({
      code: 'auth/local-account-upgrade-required',
    });

    const migrated = await registerWithEmail('legacy@example.com', 'new-secret123', 'Legacy');
    expect(migrated.user.uid).toBe('legacy-1');
    await expect(loginWithEmail('legacy@example.com', 'new-secret123')).resolves.toMatchObject({
      user: { uid: 'legacy-1' },
    });
  });
});
