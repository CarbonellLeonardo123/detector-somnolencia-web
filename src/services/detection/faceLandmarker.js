import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

let landmarkerInstance = null;
let initPromise = null;

/**
 * Initializes the MediaPipe FaceLandmarker with GPU acceleration
 * and blendshape output enabled for eyelid tracking.
 */
export async function initializeFaceLandmarker() {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      });

      return landmarkerInstance;
    } catch (error) {
      console.error('Error initializing MediaPipe FaceLandmarker with GPU, retrying with CPU:', error);
      // Fallback to CPU delegate if WebGL/GPU fails
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        landmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
        });

        return landmarkerInstance;
      } catch (fallbackError) {
        console.error('Failed to initialize FaceLandmarker on CPU:', fallbackError);
        throw fallbackError;
      }
    }
  })();

  return initPromise;
}

/**
 * Performs face landmark detection on a video element for the current timestamp
 */
export function detectFaceInVideo(landmarker, videoElement, timestamp = performance.now()) {
  if (!landmarker || !videoElement || videoElement.readyState < 2) {
    return null;
  }

  try {
    return landmarker.detectForVideo(videoElement, timestamp);
  } catch (err) {
    console.warn('MediaPipe detectForVideo exception:', err);
    return null;
  }
}

/**
 * Cleans up the landmarker instance
 */
export function disposeFaceLandmarker() {
  if (landmarkerInstance) {
    try {
      landmarkerInstance.close();
    } catch (e) {
      console.warn('Error closing FaceLandmarker:', e);
    }
    landmarkerInstance = null;
    initPromise = null;
  }
}
