# Modernization Plan — Chrome Tab Monitor

Migración de vanilla JS puro a un stack moderno con **Node.js + Vite + React**, con CI/CD via GitHub Actions.

---

## Contexto del estado actual

| Aspecto | Estado actual |
|---|---|
| Build system | Ninguno — archivos estáticos cargados directamente |
| Frontend | Vanilla JS + HTML + CSS manual |
| Background | Service Worker ES6 module (`background.js`) |
| Utils | Módulos ES6 en `utils/` |
| Tipos | Sin tipos (JavaScript puro) |
| Testing | Manual únicamente |
| CI/CD | Ninguno |
| Package manager | Ninguno (sin `package.json`) |

---

## Decisiones de arquitectura

### Plugin de Vite para extensiones Chrome
Usar **`@crxjs/vite-plugin`** en lugar de `vite-plugin-web-extension`. Razón: CRXJS tiene soporte oficial para MV3, hot module reload en el popup durante desarrollo, y maneja automáticamente el `manifest.json` como entry point de Vite.

### TypeScript
Adoptar TypeScript desde el inicio. La migración incremental es posible: empezar renombrando `.js` → `.ts` sin cambiar lógica y añadir tipos progresivamente.

### Testing
**Vitest** para unit tests (comparte config con Vite) + **@testing-library/react** para componentes React.

### Estructura de carpetas objetivo
```
├── src/
│   ├── background/
│   │   ├── index.ts          # entry point del service worker
│   │   └── utils/            # lógica actual de utils/
│   ├── popup/
│   │   ├── main.tsx          # entry point React
│   │   ├── App.tsx
│   │   └── components/       # componentes React
│   ├── pages/
│   │   └── window-limit-warning/
│   │       ├── main.tsx
│   │       └── Warning.tsx
│   └── shared/
│       └── types.ts          # tipos compartidos entre popup y background
├── public/
│   └── icons/
├── manifest.json             # leído directamente por CRXJS
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .github/
    └── workflows/
```

---

## PASO 1 — Inicializar el entorno Node.js

**Objetivo:** tener `package.json`, versión de Node fijada, y herramientas básicas instaladas.

### Acciones:
1. Crear `.nvmrc` con la versión LTS actual de Node (por ejemplo `20`).
2. Ejecutar `npm init -y` para generar `package.json`.
3. Instalar dependencias de desarrollo:
   ```bash
   npm install -D vite @crxjs/vite-plugin typescript react react-dom @types/react @types/react-dom @types/chrome
   ```
4. Instalar herramientas de calidad de código:
   ```bash
   npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks prettier eslint-config-prettier
   ```
5. Crear `tsconfig.json` con:
   - `"target": "ES2022"` (compatible con MV3 service workers)
   - `"jsx": "react-jsx"`
   - `"strict": true`
   - `"moduleResolution": "bundler"`
6. Actualizar `.gitignore` para incluir `node_modules/`, `dist/`, `.env`.

### Verificación:
- `node -v` y `npm -v` muestran versiones correctas.
- `npm install` completa sin errores.

---

## PASO 2 — Configurar Vite + CRXJS

**Objetivo:** que `npm run dev` levante la extensión con hot reload, y `npm run build` genere la carpeta `dist/` lista para cargar en Chrome.

### Acciones:
1. Crear `vite.config.ts`:
   ```ts
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import { crx } from '@crxjs/vite-plugin';
   import manifest from './manifest.json';

   export default defineConfig({
     plugins: [react(), crx({ manifest })],
   });
   ```
2. Actualizar `manifest.json` para apuntar a los nuevos entry points:
   - `"service_worker": "src/background/index.ts"`
   - El popup entry lo detecta CRXJS automáticamente desde `manifest.json`.
3. Añadir scripts en `package.json`:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "tsc && vite build",
     "preview": "vite preview",
     "lint": "eslint src --ext .ts,.tsx",
     "format": "prettier --write src",
     "test": "vitest"
   }
   ```

### Puntos críticos a tener en cuenta:
- El service worker de MV3 **no admite hot reload** nativo; CRXJS recarga la extensión completa en cambios del background.
- `chrome` global está disponible en el service worker pero no en Vite dev server — los módulos de `src/background/utils/` no se deben importar directamente desde el popup.
- El `manifest.json` pasa a ser la fuente de verdad del build: CRXJS lo lee y genera los bundles correspondientes.

### Verificación:
- `npm run build` genera `dist/` con los archivos correctos.
- Cargar `dist/` en `chrome://extensions/` y verificar que la extensión funcione igual que antes.

---

## PASO 3 — Migrar el Background Service Worker a TypeScript

**Objetivo:** mover `background.js` y `utils/` a `src/background/` con tipado.

### Acciones:
1. Crear `src/background/index.ts` copiando el contenido de `background.js`.
2. Mover cada archivo de `utils/` a `src/background/utils/` renombrando de `.js` → `.ts`.
3. Crear `src/shared/types.ts` con las interfaces de configuración:
   ```ts
   export interface ExtensionConfig {
     enabled: boolean;
     tabLimit: number;
     windowLimit: number;
     autoClose: boolean;
     autoCloseWindows: boolean;
     windowGracePeriod: number;
     notifications: boolean;
     pauseBetweenClosures: number;
     adminRole: boolean;
   }

   export type MessageAction =
     | 'getConfig' | 'saveConfig' | 'getWindowStats'
     | 'getActivityLog' | 'forceCheck' | 'clearLog' | 'closeWindowConfirmed';

   export interface WindowStat {
     windowId: number;
     tabCount: number;
     focused: boolean;
   }
   ```
4. Tipear los parámetros de las funciones en cada módulo usando estas interfaces.
5. **No cambiar ninguna lógica** en este paso — solo tipos y rutas de import.

### Verificación:
- `npm run build` sin errores de TypeScript.
- La extensión funciona igual que antes desde `dist/`.

---

## PASO 4 — Migrar el Popup a React

**Objetivo:** reemplazar `popup.html` + `popup.js` + `styles.css` con componentes React.

### Acciones:
1. Crear `src/popup/main.tsx` como entry point:
   ```tsx
   import React from 'react';
   import { createRoot } from 'react-dom/client';
   import App from './App';
   import './index.css';

   createRoot(document.getElementById('root')!).render(<App />);
   ```
2. Crear `popup.html` apuntando al nuevo entry:
   ```html
   <div id="root"></div>
   <script type="module" src="/src/popup/main.tsx"></script>
   ```
3. Descomponer `popup.js` en componentes React:
   - `components/Header.tsx` — toggle de habilitación + indicador de estado
   - `components/Statistics.tsx` — grilla de stats
   - `components/WindowsList.tsx` — lista de ventanas con progress bars
   - `components/ConfigPanel.tsx` — sección de configuración (admin only)
   - `components/ActivityLog.tsx` — log de actividad (admin only)
   - `components/ActionButtons.tsx` — Save Config + Force Verification
4. Crear hook `hooks/useExtensionState.ts` para centralizar la comunicación con el background via `chrome.runtime.sendMessage`.
5. Migrar `styles.css` — puede mantenerse como CSS global o migrarse a CSS Modules (`.module.css`) por componente.

### Puntos críticos:
- El intervalo de actualización cada 2 segundos pasa a un `useEffect` con `setInterval` + cleanup en return.
- `sendMessage` se abstrae en el hook para no repetirlo en cada componente.
- El popup de Chrome tiene tamaño fijo — evitar layouts que rompan ese constraint.

### Verificación:
- Popup abre sin errores en la consola de Chrome.
- Todos los controles funcionan (toggle, save, force check, clear log).
- Las secciones admin-only se muestran/ocultan correctamente.

---

## PASO 5 — Migrar la página de advertencia de ventanas

**Objetivo:** reemplazar `window-limit-warning.html` + `window-limit-warning.js` con una página React.

### Acciones:
1. Crear `src/pages/window-limit-warning/main.tsx` y `Warning.tsx`.
2. El componente lee los parámetros de la URL (`windowId`, `gracePeriod`) con `new URLSearchParams(window.location.search)`.
3. Implementar el countdown como `useState` + `useEffect` con `setInterval`.
4. Al finalizar el countdown, enviar el mensaje `closeWindowConfirmed` al background.
5. Actualizar `manifest.json` → `web_accessible_resources` para apuntar al HTML generado por Vite.

### Verificación:
- Abrir una ventana extra activa la página de advertencia con el countdown correcto.
- Al terminar el countdown, la ventana se cierra.

---

## PASO 6 — Configurar Linting, Formatting y pre-commit hooks

**Objetivo:** que el código sea consistente y los errores se detecten antes del commit.

### Acciones:
1. Crear `.eslintrc.json` con reglas para TypeScript + React.
2. Crear `.prettierrc` con configuración de formato (single quotes, 2 spaces, trailing comma).
3. Instalar y configurar **Husky** + **lint-staged**:
   ```bash
   npm install -D husky lint-staged
   npx husky init
   ```
4. Configurar `lint-staged` en `package.json`:
   ```json
   "lint-staged": {
     "src/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"]
   }
   ```
5. El pre-commit hook ejecuta `lint-staged` automáticamente.

### Verificación:
- Un commit con código mal formateado lo corrige automáticamente.
- Un commit con error de TypeScript o ESLint lo bloquea con mensaje claro.

---

## PASO 7 — Configurar Testing con Vitest

**Objetivo:** tener tests unitarios para la lógica del background (config, tabManager, etc.).

### Acciones:
1. Instalar dependencias:
   ```bash
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
   ```
2. Añadir configuración de Vitest en `vite.config.ts`:
   ```ts
   test: {
     globals: true,
     environment: 'jsdom',
     setupFiles: './src/test/setup.ts',
   }
   ```
3. Crear mocks de las Chrome APIs en `src/test/chrome-mock.ts` (la API `chrome` no existe en Node/jsdom).
4. Escribir tests iniciales para:
   - `src/background/utils/config.ts` — `getConfig()`, `saveConfig()`
   - `src/background/utils/tabManager.ts` — `enforceTabLimit()`
   - Componentes React básicos con `@testing-library/react`

### Mocking de Chrome APIs:
```ts
// src/test/chrome-mock.ts
globalThis.chrome = {
  storage: { sync: { get: vi.fn(), set: vi.fn() } },
  tabs: { query: vi.fn(), remove: vi.fn() },
  windows: { getAll: vi.fn() },
  runtime: { sendMessage: vi.fn(), lastError: null },
  // ... etc
} as any;
```

### Verificación:
- `npm test` ejecuta todos los tests.
- `npm run test -- --ui` abre la UI de Vitest en el navegador.

---

## PASO 8 — Configurar CI/CD con GitHub Actions

**Objetivo:** que cada PR y push a `main`/`development` ejecute lint, tests, y genere el build automáticamente.

### Estructura de workflows:

#### `.github/workflows/ci.yml` — Se ejecuta en cada PR y push
```yaml
name: CI

on:
  push:
    branches: [main, development]
  pull_request:
    branches: [main, development]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --run
      - run: npm run build
```

#### `.github/workflows/release.yml` — Se ejecuta al crear un tag `v*`
```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Zip extension
        run: zip -r extension-${{ github.ref_name }}.zip dist/
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: extension-*.zip
```

### Verificación:
- Abrir un PR y confirmar que el check de CI pasa.
- Crear un tag `v1.2.0` y confirmar que se genera el release con el `.zip`.

---

## PASO 9 — Actualizar CLAUDE.md y documentación

**Objetivo:** mantener la documentación del proyecto al día con el nuevo stack.

### Acciones:
1. Actualizar `CLAUDE.md` con:
   - Nuevos comandos de desarrollo (`npm run dev`, `npm run build`, `npm test`).
   - Nueva estructura de carpetas.
   - Cómo cargar la extensión desde `dist/` para testing manual.
   - Cómo mockear Chrome APIs en tests.
2. Actualizar `README.md` con instrucciones de desarrollo actualizado.

---

## Orden de ejecución recomendado

```
PASO 1 → PASO 2 → PASO 3 → PASO 6 → PASO 7 → PASO 4 → PASO 5 → PASO 8 → PASO 9
```

Completar cada paso con la extensión funcionando en Chrome antes de avanzar al siguiente. El paso 3 (background a TypeScript) es el más seguro para empezar porque no toca el frontend y permite verificar que el build pipeline funciona con código real.

---

## Riesgos y puntos de atención

| Riesgo | Mitigación |
|---|---|
| CRXJS no soporta alguna configuración de MV3 | Verificar compatibilidad con `manifest.json` actual antes de migrar UI |
| Hot reload del service worker en dev | Esperado — CRXJS recarga toda la extensión, no el módulo aislado |
| Chrome APIs no disponibles en tests | Mocks explícitos en `src/test/chrome-mock.ts` |
| Tamaño del popup en React | Vite hace tree-shaking; verificar que el CSS no crece descontroladamente |
| `adminRole` nunca se persiste | Mantener esta lógica en el hook `useExtensionState` al migrar |
| `window-limit-warning.html` en `web_accessible_resources` | Vite genera hashes en los nombres de archivo — CRXJS maneja esto automáticamente |
