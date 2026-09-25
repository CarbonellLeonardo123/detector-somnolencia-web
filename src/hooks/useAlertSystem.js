import { useRef, useCallback, useEffect, useState } from 'react';

export function useAlertSystem() {
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalRef = useRef(null);

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

  // Stop sound alarm
  const stopAlarm = useCallback(() => {
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
      } catch (e) {
        // already stopped
      }
      oscillatorRef.current = null;
    }

    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch (e) {
        // already disconnected
      }
      gainNodeRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stopAlarm]);

  return {
    isAlarmPlaying,
    isVisualAlertActive,
    startAlarm,
    stopAlarm,
    initAudio,
  };
}
