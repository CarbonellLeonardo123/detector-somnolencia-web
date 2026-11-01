# Guía de Google Colab

1. Sube la carpeta `ml/`, el CSV exportado desde **Flota → Analítica ML** y, opcionalmente, un video autorizado.
2. Abre `ml/notebooks/somnoguard_ml_colab.ipynb`.
3. Ejecuta las celdas en orden.
4. Confirma que el CSV indique `dataSource=real` o `synthetic-demo`.
5. Revisa estadística, regresiones, matriz de correlación, codo y Silhouette.
6. Para OpenCV, define la ruta del video autorizado; nunca subas grabaciones sin consentimiento.
7. Entrena la MLP y revisa curvas, matriz de confusión y F1.
8. Exporta el archivo `.keras`, el JSON de inferencia y metadata.
9. Sustituye los artefactos de `public/models/` solo después de revisar `trainingSource` y `validated`.

También puede ejecutarse localmente:

```powershell
python -m pip install -r ml/requirements.txt
python ml/generate_demo_dataset.py
python ml/train_neural_network.py ml/data/somnoguard-demo.csv --training-source synthetic-demo
python ml/preprocess_video.py ruta\video-autorizado.mp4
```

TensorFlow/OpenCV/Matplotlib/Seaborn no forman parte del runtime ligero de Vercel; se utilizan en Colab o en el proceso de entrenamiento.
