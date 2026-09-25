import { useState, useEffect, useRef } from 'react';
import { initializeFaceLandmarker, disposeFaceLandmarker } from '../services/detection/faceLandmarker';

export function useFaceDetector() {
  const [isModelReady, setIsModelReady] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [modelError, setModelError] = useState(null);
  const detectorRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadModel() {
      try {
        setIsLoadingModel(true);
        setModelError(null);
        const detector = await initializeFaceLandmarker();
        if (isMounted) {
          detectorRef.current = detector;
          setIsModelReady(true);
          setIsLoadingModel(false);
        }
      } catch (err) {
        console.error('Failed to load FaceLandmarker model:', err);
        if (isMounted) {
          setModelError('Error cargando el modelo de visión artificial MediaPipe.');
          setIsLoadingModel(false);
        }
      }
    }

    loadModel();

    return () => {
      isMounted = false;
      disposeFaceLandmarker();
    };
  }, []);

  return {
    detectorRef,
    isModelReady,
    isLoadingModel,
    modelError,
  };
}
