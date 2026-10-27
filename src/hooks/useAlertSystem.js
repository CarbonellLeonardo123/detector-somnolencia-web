import { useRef, useCallback, useEffect, useState } from 'react';

export function createAlertEpisodeController() {
  let acknowledged = false;

  return {
    canActivate: () => !acknowledged,
    acknowledge: () => {
      acknowledged = true;
    },
    clear: () => {
      acknowledged = false;
    },
  };
}

export function useAlertSystem() {
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalRef = useRef(null);
  const episodeRef = useRef(createAlertEpisodeController());

  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [isVisualAlertActive, setIsVisualAlertActive] = useState(false);

  // Initialize Web Audio Context on first user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Start sound alarm
  const startAlarm = useCallback(() => {
    if (!episodeRef.current.canActivate()) return;

    initAudio();
    setIsAlarmPlaying(true);
    setIsVisualAlertActive(true);

    if (!audioContextRef.current) return;
    if (oscillatorRef.current) return; // Already active

    try {
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone

      gain.gain.setValueAtTime(0.4, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      // Modulate frequency to create an alternating emergency siren (880Hz <-> 1320Hz)
      let highTone = true;
      intervalRef.current = setInterval(() => {
        if (oscillatorRef.current && audioContextRef.current) {
          const targetFreq = highTone ? 1320 : 880;
          oscillatorRef.current.frequency.setValueAtTime(targetFreq, audioContextRef.current.currentTime);
          highTone = !highTone;
        }
      }, 180);
    } catch (err) {
      console.warn('Web Audio alarm start error:', err);
    }
  }, [initAudio]);

  const silenceAlarm = useCallback(() => {
    setIsAlarmPlaying(false);
    setIsVisualAlertActive(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {
        // already stopped
      }
      oscillatorRef.current = null;
    }

    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch {
        // already disconnected
      }
      gainNodeRef.current = null;
    }
  }, []);

  // Acknowledges the current critical episode. It remains silent until risk clears.
  const acknowledgeAlarm = useCallback(() => {
    episodeRef.current.acknowledge();
    silenceAlarm();
  }, [silenceAlarm]);

  // Clears the episode and rearms the alarm for a future critical event.
  const clearAlarm = useCallback(() => {
    episodeRef.current.clear();
    silenceAlarm();
  }, [silenceAlarm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      silenceAlarm();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [silenceAlarm]);

  return {
    isAlarmPlaying,
    isVisualAlertActive,
    startAlarm,
    acknowledgeAlarm,
    clearAlarm,
    // Backward-compatible alias used by non-critical cleanup paths.
    stopAlarm: clearAlarm,
    initAudio,
  };
}
