# Diccionario de datos

Las sesiones nuevas usan `schemaVersion: 2`. Las vistas siguen aceptando sesiones antiguas.

## Ventana agregada de 30 segundos

| Campo | Tipo | Descripción |
|---|---|---|
| `windowIndex` | entero | Posición de la ventana en la sesión |
| `startedAt`, `endedAt` | milisegundos | Límites temporales locales |
| `elapsedSeconds` | entero | Tiempo desde el inicio de la sesión |
| `sampleCount` | entero | Cuadros procesados |
| `faceDetectedSamples` | entero | Cuadros con rostro |
| `facePresenceRatio` | 0–1 | Proporción de cuadros válidos |
| `dataQuality` | texto | `good`, `limited` o `insufficient` |
| `avgEAR`, `medianEAR` | número | Media y mediana de apertura ocular |
| `minEAR`, `maxEAR` | número | Extremos de apertura ocular |
| `earVariance`, `earStdDev` | número | Dispersión muestral de EAR |
| `fatigueMean`, `fatigueMedian` | 0–100 | Resumen del índice heurístico |
| `fatigueVariance`, `fatigueStdDev` | número | Dispersión de fatiga |
| `maxFatigue` | 0–100 | Máximo observado |
| `attentionMean` | 0–100 | Atención media |
| `blinkRateMean` | número | Parpadeos por minuto medios |
| `closedEyeRatio` | 0–1 | Cuadros con ojos cerrados / cuadros con rostro |
| `perclosPct` | 0–100 | PERCLOS en porcentaje |
| `blinkCount` | entero | Parpadeos ocurridos en la ventana |
| `microsleepsDelta` | entero | Micro-sueños ocurridos en la ventana |
| `alertsDelta` | entero | Alertas ocurridas en la ventana |
| `dominantState` | texto | Estado más frecuente |

Los alias `fatiguePct`, `blinkRate`, `attentionScore` y `state` se conservan para compatibilidad.

## Privacidad

La API recibe identificadores anónimos de sesión y métricas agregadas. Rechaza UID, driverId, correo, nombre, token, credenciales, imágenes, frames y videos. El CSV exportado tampoco contiene información personal.
