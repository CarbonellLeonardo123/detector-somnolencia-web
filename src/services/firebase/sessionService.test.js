import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./config', () => ({
  db: null,
  isFirebaseConfigured: false,
}));

import {
  createSession,
  deleteSession,
  getAllFleetSessions,
  getUserSessions,
  updateSession,
} from './sessionService';

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

describe('local session isolation', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
  });

  it('returns only sessions owned by the requested user', async () => {
    await createSession('user-a', { sessionId: 'session-a' });
    await createSession('user-b', { sessionId: 'session-b' });

    expect((await getUserSessions('user-a')).map((session) => session.sessionId)).toEqual(['session-a']);
    expect((await getUserSessions('user-b')).map((session) => session.sessionId)).toEqual(['session-b']);
    expect(await getAllFleetSessions()).toHaveLength(2);
  });

  it('applies dotted metric updates to the nested object', async () => {
    await createSession('user-a', { sessionId: 'session-a' });
    await updateSession('user-a', 'session-a', {
      'metrics.totalAlerts': 3,
      'metrics.microsleepCount': 2,
    });

    const [session] = await getUserSessions('user-a');
    expect(session.metrics.totalAlerts).toBe(3);
    expect(session.metrics.microsleepCount).toBe(2);
    expect(session['metrics.totalAlerts']).toBeUndefined();
  });

  it('does not update or delete another user session', async () => {
    await createSession('user-a', { sessionId: 'shared-id' });
    await updateSession('user-b', 'shared-id', { status: 'tampered' });
    await deleteSession('user-b', 'shared-id');

    const [session] = await getUserSessions('user-a');
    expect(session.status).toBe('active');
  });
});
