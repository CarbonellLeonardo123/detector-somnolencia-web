# 🧠 SomnoGuard &mdash; Detector de Somnolencia y Fatiga en Tiempo Real

> Sistema inteligente y proactivo de monitoreo para la seguridad vial y laboral. Detecta signos tempranos de somnolencia, fatiga y micro-sueños en tiempo real mediante la cámara web, utilizando visión artificial en el navegador (**MediaPipe FaceLandmarker**), el algoritmo matemático **Eye Aspect Ratio (EAR)** y almacenamiento persistente en la nube (**Firebase Firestore**).

---

## 📸 Vista Previa del Sistema

- **Monitor en Vivo:** Feed de cámara web a 640x480 con proyección de landmarks oculares y faciales en tiempo real.
- **Semáforo de Estado:** Máquina de estados visual (`NORMAL`, `ATENCIÓN`, `ALERTA`, `PELIGRO`, `CALIBRANDO`).
- **Gauge Radial:** Probabilidad de fatiga (0 a 100%) y nivel de atención del conductor.
- **Gráficas en Vivo (Recharts):**
  - Historial dinámico de apertura ocular (**EAR**) frente al umbral crítico.
  - Curva de nivel de atención vs. fatiga acumulada.
- **Sistema de Alerta de Emergencia:**
  - Sirena acústica sintetizada en el navegador (Web Audio API).
  - Overlay de pantalla completa con destello rojo y botón de reconocimiento.
- **Historial de Sesiones:** Registro histórico de sesiones, tiempos, tasas de parpadeo y conteo de micro-sueños.

---

## 🔬 Fundamento Matemático y Visión Artificial

### 1. Eye Aspect Ratio (EAR)

El algoritmo se basa en la formulación canónica de **Tereza Soukupová y Jan Čech (2016)**, calculando la relación de aspecto ocular a partir de 6 puntos de referencia (landmarks) por ojo:

$$\text{EAR} = \frac{\|P_2 - P_6\| + \|P_3 - P_5\|}{2 \cdot \|P_1 - P_4\|}$$

Donde:
- $\|P_1 - P_4\|$ corresponde a la distancia euclidiana horizontal entre los extremos interior y exterior del ojo.
- $\|P_2 - P_6\|$ y $\|P_3 - P_5\|$ son las distancias verticales entre los párpados superior e inferior.

#### Índices de Landmarks (MediaPipe Face Mesh):
- **Ojo Derecho:** `[33, 160, 158, 133, 153, 144]`
- **Ojo Izquierdo:** `[362, 385, 387, 263, 373, 380]`

### 2. Detección de Parpadeo y Micro-Sueño
- **Calibración Adaptativa:** Durante los primeros 3 segundos de monitoreo, el sistema mide la apertura ocular natural del usuario para calcular un umbral personalizado ($\text{Umbral} = \text{EAR}_{\text{base}} \times 0.72$).
- **Parpadeo Regular:** Ojos cerrados por una duración de $80\,\text{ms} \le t \le 400\,\text{ms}$.
- **Tasa de Parpadeo:** Conteo de parpadeos en una ventana deslizante de 60 segundos normalizada por minuto (rango normal: 12 a 20 parpadeos/min).
- **Micro-Sueño Crítico:** Ojos cerrados continuamente durante más de **1.5 segundos** ($t \ge 1500\,\text{ms}$). Dispara inmediatamente la alarma sonora y el estado `PELIGRO`.

### 3. Fusión Multi-Señal de Probabilidad de Fatiga (%)

La probabilidad de fatiga fusiona 3 señales ponderadas:
$$\text{Fatiga} = 0.45 \cdot S_{\text{EAR}} + 0.25 \cdot S_{\text{Parpadeo}} + 0.30 \cdot S_{\text{Micro-Sueño}}$$

El resultado se suaviza mediante una **Media Móvil Exponencial (EMA)** para evitar falsos positivos por parpadeos aislados.

---

## 🚀 Arquitectura y Tecnologías

```
Frontend:            React 19 + Vite 8
Librería UI:         Material UI (MUI v6/v7) con diseño limpio y claro
Gráficas:            Recharts (LineChart y AreaChart reactivos)
Visión Artificial:   @mediapipe/tasks-vision (FaceLandmarker + Blendshapes vía WebAssembly + WebGL)
Audio:               Web Audio API (generador de tonos sinusoidales/dientes de sierra)
Persistencia:        Firebase Firestore + Firebase Anonymous Auth (con fallback a LocalStorage)
Enrutamiento:        React Router DOM 7
Deploy:              Vercel / Render
```

---

## 📂 Estructura del Proyecto

```
detector-somnolencia-web/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── alerts/
│   │   │   └── AlertOverlay.jsx          # Overlay de alarma y silenciador
│   │   ├── camera/
│   │   │   └── WebcamFeed.jsx            # Video, landmarks y controles
│   │   ├── charts/
│   │   │   ├── AttentionChart.jsx        # Gráfica de atención vs fatiga
│   │   │   └── EARTimelineChart.jsx      # Gráfica de EAR vs umbral
│   │   ├── dashboard/
│   │   │   ├── FatigueGauge.jsx          # Gauge circular de fatiga
│   │   │   ├── MetricsPanel.jsx          # Tarjetas de métricas en vivo
│   │   │   └── StatusIndicator.jsx       # Semáforo de estado del conductor
│   │   ├── history/
│   │   │   ├── SessionCard.jsx           # Tarjeta resumen de sesión
│   │   │   └── SessionList.jsx           # Listado de sesiones pasadas
│   │   └── layout/
│   │       ├── Header.jsx                # Barra superior con navegación
│   │       └── MainLayout.jsx            # Contenedor principal y footer
│   ├── context/
│   │   ├── AuthContext.jsx               # Proveedor de autenticación
│   │   └── DetectionContext.jsx          # Estado global de monitoreo
│   ├── hooks/
│   │   ├── useAlertSystem.js             # Alarma acústica (Web Audio API)
│   │   ├── useAnonymousAuth.js           # Auth anónima con fallback local
│   │   ├── useDetectionLoop.js           # Loop rAF con async-lock
│   │   ├── useFaceDetector.js            # Ciclo de vida de MediaPipe
│   │   ├── useSessionRecorder.js         # Persistencia por bucket (30s)
│   │   └── useWebcam.js                  # Control y permisos de webcam
│   ├── pages/
│   │   ├── HistoryPage.jsx               # Vista de historial
│   │   └── MonitorPage.jsx               # Vista principal de monitoreo
│   ├── services/
│   │   ├── detection/
│   │   │   ├── drowsinessEngine.js       # Motor matemático de fatiga
│   │   │   ├── earCalculator.js          # Extracción de EAR y blendshapes
│   │   │   └── faceLandmarker.js         # Inicialización de MediaPipe
│   │   └── firebase/
│   │       ├── alertService.js           # Registro de alertas en Firestore
│   │       ├── config.js                 # Configuración de Firebase SDK
│   │       └── sessionService.js         # CRUD de sesiones en Firestore
│   ├── theme/
│   │   └── muiTheme.js                   # Tema Material Design claro
│   ├── utils/
│   │   ├── constants.js                  # Índices de landmarks y umbrales
│   │   ├── formatters.js                 # Formateo de fechas y duraciones
│   │   ├── math.js                       # Distancia euclidiana y clamp
│   │   └── statistics.js                 # Medias móviles y tasas
│   ├── App.jsx                           # Rutas y configuración de la app
│   ├── index.css                         # Reseteo CSS responsivo
│   └── main.jsx                          # Punto de entrada
├── .env.example                          # Plantilla de variables de entorno
├── .gitignore                            # Exclusiones de Git
├── vercel.json                           # Configuración SPA para Vercel
├── package.json
└── README.md
```

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos
- **Node.js** (versión 18 o superior recomendada).
- Navegador web moderno con soporte para **WebGL** y acceso a cámara web (Chrome, Edge, Firefox, Brave, Safari).

### 1. Clonar e Instalar Dependencias

```bash
# Navegar a la carpeta del proyecto
cd detector-somnolencia-web

# Instalar dependencias
npm install
```

### 2. Configurar Firebase (Opcional)

El proyecto incluye un **modo offline/local automático**. Si no configuras Firebase, el sistema almacenará el historial y las alertas en el `LocalStorage` del navegador de forma transparente.

Para conectar con una base de datos real de **Firebase Firestore**:
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilita **Firestore Database** y **Anonymous Authentication** (en la sección *Authentication -> Sign-in method*).
3. Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Completa los valores con las credenciales de tu proyecto en `.env.local`.

### 3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Abre tu navegador en la URL indicada (habitualmente `http://localhost:5173/`).

### 4. Construir para Producción

```bash
npm run build
npm run preview
```

---

## 🌿 Flujo Profesional de Git (Git Flow)

Para subir y gestionar el proyecto en GitHub con un flujo de trabajo profesional basado en ramas (`main` y `develop`), sigue estos pasos:

### 1. Inicializar el Repositorio Local

```bash
git init
git add .
git commit -m "feat: initial commit with SomnoGuard drowsiness detection system"
```

### 2. Configurar la Rama Principal (`main`)

```bash
git branch -M main
```

### 3. Crear y Cambiar a la Rama de Desarrollo (`develop`)

```bash
git checkout -b develop
```

### 4. Conectar con tu Repositorio en GitHub

Crea un repositorio vacío en GitHub (por ejemplo, `detector-somnolencia-web`) y enlaza el origen remoto:

```bash
git remote add origin https://github.com/TU_USUARIO/detector-somnolencia-web.git
```

### 5. Publicar Ambas Ramas en GitHub

```bash
# Subir la rama main (versión estable de producción)
git push -u origin main

# Subir la rama develop (rama de trabajo y desarrollo activo)
git push -u origin develop
```

### 6. Flujo Diario de Trabajo (Feature Branches)

Para desarrollar una nueva característica:
```bash
# 1. Asegúrate de partir desde develop actualizado
git checkout develop
git pull origin develop

# 2. Crea una rama de funcionalidad
git checkout -b feature/nueva-funcionalidad

# 3. Realiza tus cambios y confirma
git add .
git commit -m "feat: implementar nueva funcionalidad"

# 4. Sube la rama y crea un Pull Request hacia develop
git push -u origin feature/nueva-funcionalidad
```

Una vez validada la versión en `develop`, realiza el pase a producción fusionando hacia `main`:
```bash
git checkout main
git merge develop
git push origin main
```

---

## ☁️ Despliegue en la Nube (Vercel / Render)

### Despliegue en Vercel (Recomendado)
El proyecto incluye el archivo [`vercel.json`](file:///c:/Users/USER/Downloads/detector-somnolencia-web/vercel.json) con reescritura de rutas para Single Page Application (SPA).

1. Ingresa a [Vercel](https://vercel.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New Project"** y selecciona el repositorio de GitHub.
3. En la sección **Build and Output Settings**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Si configuraste Firebase, agrega las variables de entorno (`VITE_FIREBASE_*`) en el panel de configuración de Vercel.
5. Haz clic en **"Deploy"**.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
