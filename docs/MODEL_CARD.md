# Model Card — SomnoGuard MLP académico base

## Propósito

Clasificar una ventana agregada como `normal`, `atención` o `peligro` para demostrar una red neuronal personalizada para una empresa de transporte.

## Entradas

`avgEAR`, `minEAR`, `perclos`, `blinkRate`, `microsleeps`, `elapsedMinutes` y `facePresenceRatio`.

## Arquitectura objetivo

```text
Input(7) → Dense(32, ReLU) → Dropout(0.20)
         → Dense(16, ReLU) → Dense(3, Softmax)
```

El entrenamiento usa TensorFlow/Keras, `EarlyStopping`, pesos de clase y separación por conductor para evitar que ventanas del mismo conductor aparezcan en entrenamiento y validación.

## Estado

- Fuente incluida: `synthetic-demo`.
- Validación real: no realizada.
- `validated: false`.
- Inferencia web: pesos JSON, sin `eval` ni `pickle`.

## Uso previsto

Sustentación académica, exploración de patrones y prototipo supervisado. Antes de usarlo con una empresa debe reentrenarse con datos consentidos, evaluar sesgos por iluminación/cámara/persona y comparar precision, recall, F1 y matriz de confusión.

## Uso no previsto

- Diagnóstico médico.
- Sanciones automáticas a trabajadores.
- Sustitución de descansos, supervisión o protocolos de seguridad.
- Afirmaciones de precisión clínica con datos sintéticos.
