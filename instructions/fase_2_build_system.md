# Fase 2: Configuración de Vite + CRXJS (El Build System)

Esta fase establece el motor de empaquetado de la extensión, permitiendo compilar código TypeScript/React y habilitar la recarga rápida durante el desarrollo.

---

## 🎯 Objetivo de la Fase
Configurar **Vite** y el plugin **CRXJS** para compilar la extensión en una carpeta de distribución `/dist` que podamos cargar en Chrome, con soporte para HMR (Hot Module Replacement) en la UI del Popup.

---

## 📖 Conceptos Teóricos a Aprender

### 1. ¿Qué es un Bundler (Vite) en el contexto de una Extensión de Chrome?
Un navegador no puede importar archivos TypeScript (.ts/.tsx) directamente, ni sabe cómo estructurar módulos complejos en un único script optimizado. **Vite** toma tu árbol de dependencias, compila el código y genera archivos `.js`, `.css` e imágenes optimizadas en una carpeta de salida (`dist/`).

### 2. ¿Qué hace CRXJS?
Las extensiones de Chrome tienen una estructura especial gobernada por el `manifest.json`. **CRXJS** es un plugin específico de Vite que:
* Lee el `manifest.json` original.
* Descubre automáticamente todos los archivos asociados (Service Workers, Popups, Content Scripts) y los registra como puntos de entrada de Vite.
* Modifica temporalmente la extensión cargada en desarrollo para que cuando modifiques código del popup o warning page, la interfaz se actualice **instantáneamente** (HMR) sin tener que hacer clic en "Recargar extensión".

---

## 🛠️ Paso a Paso

### Paso 1: Crear la estructura de carpetas inicial (`src`)
Crea la siguiente jerarquía de archivos y carpetas dentro de tu proyecto:
```text
src/
├── background/
│   └── index.ts
└── popup/
    ├── index.html
    └── main.tsx
```

### Paso 2: Crear el archivo `src/popup/index.html`
Este será el nuevo archivo HTML del popup, que cargará a React:
```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tab Monitor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### Paso 3: Crear el archivo `src/popup/main.tsx`
Crea una inicialización básica de React:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Tab Monitor</h1>
      <p>Inicializado con React + TypeScript + Vite</p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Paso 4: Crear un Service Worker básico en `src/background/index.ts`
```typescript
console.log("Service Worker inicializado en TypeScript!");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extensión instalada correctamente.");
});
```

### Paso 5: Crear el archivo de configuración `vite.config.ts`
En la raíz del proyecto, crea `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  }
});
```

### Paso 6: Actualizar `manifest.json`
Modifica tu archivo `manifest.json` existente en la raíz para apuntar a los nuevos archivos origen:
```json
{
  "manifest_version": 3,
  "name": "Chrome Tab Monitor",
  "version": "1.0.0",
  "description": "Monitorea y limita pestañas y ventanas del navegador.",
  "permissions": [
    "storage",
    "tabs",
    "windows",
    "notifications"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": "icons/icon128.png"
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Paso 7: Configurar los scripts en `package.json`
Añade o reemplaza la sección de `"scripts"` en tu `package.json`:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

---

## 🧪 Verificación

1. **Construir el proyecto:** Ejecuta `npm run build` en la terminal.
   * Debería generarse la carpeta `/dist` en la raíz conteniendo el `manifest.json` compilado, el service worker y la carpeta de assets del popup.
2. **Cargar en Chrome:**
   * Abre `chrome://extensions/`.
   * Asegúrate de tener activo el "Modo desarrollador".
   * Haz clic en **Cargar descomprimida** (Load unpacked) y selecciona la carpeta `/dist` (¡no la raíz del proyecto!).
   * Abre el popup y verifica que muestre "Tab Monitor - Inicializado con React...".
3. **Probar Desarrollo (HMR):**
   * Ejecuta `npm run dev` en tu consola.
   * Cambia el texto en `src/popup/main.tsx` (ej. pon "Hola Mundo").
   * Haz clic en el icono de la extensión. El popup debe mostrar los cambios inmediatamente.
