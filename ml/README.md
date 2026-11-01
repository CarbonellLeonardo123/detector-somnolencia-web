# SomnoGuard ML académico

Esta carpeta contiene el entrenamiento reproducible y **no usa credenciales de
Firebase**. Los datos reales deben exportarse como ventanas agregadas y
anonimizadas desde la aplicación. No subas videos, correos, nombres ni archivos
`.env` al repositorio.

## Ejecución local o en Colab

```powershell
python -m pip install -r ml/requirements.txt
python ml/generate_demo_dataset.py
python ml/train_neural_network.py ml/data/somnoguard-demo.csv --training-source synthetic-demo
```

OpenCV se demuestra sobre un video que cuente con autorización:

```powershell
python ml/preprocess_video.py ruta\video-autorizado.mp4
```

El notebook `ml/notebooks/somnoguard_ml_colab.ipynb` contiene el recorrido
completo: estadística, regresiones, matrices/vectores, K-Means, OpenCV,
TensorFlow/Keras, evaluación y exportación.

Los artefactos incluidos en `public/models/` son sintéticos y están marcados
`validated: false`. No representan desempeño clínico ni de producción.
