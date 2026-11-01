# Cumplimiento de requisitos académicos

SomnoGuard conserva la detección en vivo con MediaPipe y añade una capa analítica reproducible. Los indicadores no se presentan como diagnóstico médico ni como garantía de seguridad.

| Requisito | Implementación | Evidencia web |
|---|---|---|
| Regresión lineal simple | `src/utils/analytics/regression.js` y `api/analytics_core.py` | Recta tiempo–fatiga, pendiente, pronóstico, R², MAE y RMSE |
| Regresión lineal múltiple | Ecuación regularizada/pseudoinversa sobre siete características | Coeficientes, métricas y dimensiones de `X`, `β` y `ŷ` |
| Estadística básica | Media, mediana, varianza muestral, desviación estándar y probabilidades empíricas | Tarjetas en Analítica ML |
| NumPy y Pandas | API Python y notebook Colab | Chip del motor y librerías activas |
| TensorFlow y Keras | `ml/train_neural_network.py` y notebook | Panel de red personalizada y artefacto exportado |
| Matplotlib y Seaborn | Notebook y reporte de entrenamiento | Gráficas de correlación, regresión, codo, entrenamiento y confusión |
| Matrices y vectores | Regresión múltiple `ŷ = Xβ` | Dimensiones reales mostradas en web |
| OpenCV | `ml/preprocess_video.py` y notebook | Preprocesamiento de video autorizado |
| Aprendizaje no supervisado | K-Means con estandarización y Silhouette | Segmentos, distribución y centroides |
| Red neuronal personalizada | MLP 7→32→Dropout→16→3 | Normal / Atención / Peligro |

## Diferencias importantes

- MediaPipe es un modelo preentrenado para extraer landmarks; no es la red personalizada del proyecto.
- El índice en vivo es heurístico y no una probabilidad clínica calibrada.
- El artefacto incluido fue construido para demostración sintética y tiene `validated: false`.
- Los nombres de segmentos se asignan después del clustering, según sus centroides.

## Flujo

```text
Cámara → MediaPipe → ventanas de 30 s → Firestore/localStorage
                                      → API Python → indicadores web

CSV anonimizado → Colab/OpenCV/TensorFlow → modelo JSON → inferencia web
```
