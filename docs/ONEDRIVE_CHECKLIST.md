# Checklist de entrega y transferencia

## OneDrive

- [ ] Código fuente sin `node_modules`, `dist`, `.git`, `.vercel` ni `.env*`.
- [ ] Notebook Colab y carpeta `ml/`.
- [ ] Documentos de `docs/`.
- [ ] CSV de demostración identificado como sintético.
- [ ] Modelo y metadata con `validated: false` cuando corresponda.
- [ ] Video final de cinco minutos.
- [ ] Archivo `somnoguard-cambios.bundle`.
- [ ] ZIP limpio y archivo de hashes SHA-256.

## Transferencia a la laptop propia

Recomendación principal: usar el `.bundle` de Git para preservar historial y el ZIP como respaldo legible.

```powershell
git clone https://github.com/CarbonellLeonardo123/detector-somnolencia-web.git
cd detector-somnolencia-web
git fetch C:\ruta\somnoguard-cambios.bundle codex/auth-ui-fixes:transfer-laptop
git switch transfer-laptop
npm install
npm test
npm run build
```

Antes de subir, integra la rama remota actual, resuelve conflictos y revisa el despliegue Preview de Vercel. El bundle no contiene credenciales de GitHub ni variables de Firebase.
