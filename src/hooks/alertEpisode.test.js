import { describe, expect, it } from 'vitest';
import { createAlertEpisodeController } from './useAlertSystem';

describe('alert episode acknowledgement', () => {
  it('stays silenced for the current episode and rearms after the risk clears', () => {
    const episode = createAlertEpisodeController();

    expect(episode.canActivate()).toBe(true);
    episode.acknowledge();
    expect(episode.canActivate()).toBe(false);

    episode.clear();
    expect(episode.canActivate()).toBe(true);
  });
});
