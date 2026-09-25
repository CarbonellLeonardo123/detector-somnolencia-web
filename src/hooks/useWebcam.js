import { useRef, useState, useCallback, useEffect } from 'react';
import { CONFIG } from '../utils/constants';

export function useWebcam() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);

  const startCamera = useCallback(async () => {
    setError(null);

    if (streamRef.current) {
      return; // Already streaming
    }

    try {
      const constraints = {
        video: {
          width: { ideal: CONFIG.CAMERA_WIDTH },
          height: { ideal: CONFIG.CAMERA_HEIGHT },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve);
          };
        });
      }

      setIsStreaming(true);
      setHasPermission(true);
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado por el usuario.'
          : 'No se pudo acceder a la cámara web. Asegúrate de tener una cámara conectada.'
      );
      setHasPermission(false);
      setIsStreaming(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isStreaming,
    error,
    hasPermission,
    startCamera,
    stopCamera,
  };
}
