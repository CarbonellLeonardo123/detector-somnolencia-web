# Despliegue en Vercel

El repositorio contiene una aplicación Vite y una función Python en `api/analytics.py`.

## Configuración

- Framework: Vite.
- Build: `npm run build`.
- Output: `dist`.
- Python: versión indicada en `.python-version`.
- Dependencias del runtime: `requirements.txt`.

No cambies ni elimines las variables `VITE_FIREBASE_*` existentes en Vercel. Las variables configuradas en el panel no se incluyen en Git ni se borran al desplegar código nuevo.

## Prueba posterior

1. Abre `/api/analytics` y confirma el mensaje de servicio.
2. Ingresa al panel de flota.
3. Abre **Analítica ML**.
4. Confirma que el motor indique `Python analytics` y NumPy/Pandas/scikit-learn.
5. Si aparece `JavaScript fallback local`, revisa los logs de la función Python.
6. Comprueba sesiones reales y demostración sintética por separado.

La función no usa credenciales Firebase ni realiza escrituras. El frontend envía únicamente métricas anonimizadas.
