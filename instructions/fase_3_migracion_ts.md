# Fase 3: Migración de Utilidades y Background a TypeScript

En esta fase migraremos la lógica del service worker (`background.js`) y todos los módulos utilitarios en `utils/` a TypeScript bajo la carpeta `src/`.

---

## 🎯 Objetivo de la Fase
Migrar el 100% de la lógica de procesamiento (back-end de la extensión) a TypeScript, definiendo tipos e interfaces en [types.ts](file:///home/camiloco345/PersonalProjects/Sutherland-proyects/Tab-Limiter-chrome-Extension/src/shared/types.ts) para garantizar que todo el sistema hable el mismo idioma de forma segura.

---

## 📖 Conceptos Teóricos a Aprender

### 1. Tipos Compartidos (`src/shared/types.ts`)
En desarrollo moderno, es una excelente práctica centralizar las definiciones de datos que consumen tanto la UI (popup) como el Service Worker (background). Esto asegura que si agregas un nuevo campo a la configuración de la extensión, TypeScript te obligará a implementarlo y tiparlo correctamente en ambas partes.

### 2. Conversión Incremental de JS a TS
El renombrado de `.js` a `.ts` fuerza al compilador a examinar el código. Encontraremos problemas comunes:
* **Importaciones de módulos:** TypeScript requiere extensiones limpias (o la omisión de la extensión `.ts` en las sentencias `import` cuando usas bundlers).
* **Parámetros sin tipo implícito (`any`):** TypeScript no permitirá que pases variables sin especificar qué son (números, strings, objetos o funciones).

---

## 🛠️ Paso a Paso

### Paso 1: Crear `src/shared/types.ts`
Define las interfaces básicas del sistema:
```typescript
export interface ExtensionConfig {
  enabled: boolean;
  tabLimit: number;
  windowLimit: number;
  autoClose: boolean;
  autoCloseWindows: boolean;
  windowGracePeriod: number; // en segundos
  notifications: boolean;
  pauseBetweenClosures: number; // en milisegundos
  adminRole: boolean;
}

export interface ActivityLogEntry {
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'action';
  message: string;
  windowId: number | null;
}

export interface WindowStats {
  windowId: number;
  tabCount: number;
  focused: boolean; // nombre real que produce getAllWindowTabCounts()
  // isOverLimit NO existe aquí — se calcula en el popup al vuelo
}

export interface SystemStats {
  totalWindows: number;
  totalTabs: number;
  violationsCount: number;
  windows: WindowStats[];
}
```

### Paso 2: Crear el directorio `src/background/utils/`
Mueve todos los archivos JS de `utils/` a `src/background/utils/` y cámbiales la extensión a `.ts`.
* `utils/config.js` -> `src/background/utils/config.ts`
* `utils/logging.js` -> `src/background/utils/logging.ts`
* `utils/tabManager.js` -> `src/background/utils/tabManager.ts`
* `utils/windowManager.js` -> `src/background/utils/windowManager.ts`
* `utils/badge.js` -> `src/background/utils/badge.ts`
* `utils/messageHandler.js` -> `src/background/utils/messageHandler.ts`
* `utils/windowLimitAlert.js` -> `src/background/utils/windowLimitAlert.ts`

### Paso 3: Tipar los Módulos (Ejemplo: `config.ts`)
Toma la lógica de tu `utils/config.js` y adáptala a TypeScript añadiendo anotaciones de tipo.

**Regla clave:** En Manifest V3 todas las Chrome APIs devuelven Promises nativas. Usa `async/await` directamente — nunca envuelvas una Chrome API en `new Promise()`. El único caso válido de `new Promise()` dentro de una función `async` es para envolver APIs de callback que no son de Chrome, como `setTimeout`:
```typescript
// ✅ Correcto — setTimeout no devuelve Promise
await new Promise((resolve) => setTimeout(resolve, config.pauseBetweenClosures));
```

Aplicado a `config.ts`:
```typescript
import type { ExtensionConfig } from '../../shared/types';

export const DEFAULT_CONFIG: ExtensionConfig = {
  enabled: true,
  tabLimit: 5,
  windowLimit: 3,
  autoClose: true,
  autoCloseWindows: true,
  windowGracePeriod: 5000, // ms
  notifications: true,
  pauseBetweenClosures: 1000, // ms
  adminRole: false, // Nota: adminRole no debe persistir en storage
};

// ✅ async/await puro — chrome.storage.sync.get devuelve una Promise en MV3
export async function getConfig(): Promise<ExtensionConfig> {
  try {
    // Doble cast necesario: @types/chrome espera Record<string, unknown> pero
    // ExtensionConfig no tiene firma de índice. Cast directo a Record<> falla —
    // hay que pasar por unknown como puente.
    const result = await chrome.storage.sync.get(
      DEFAULT_CONFIG as unknown as Record<string, unknown>,
    );
    return {
      ...DEFAULT_CONFIG,
      ...(result as Partial<ExtensionConfig>),
      adminRole: DEFAULT_CONFIG.adminRole, // nunca leer adminRole del storage
    };
  } catch (error) {
    console.error('Tab Monitor: Error loading config:', error);
    return DEFAULT_CONFIG;
  }
}

// Partial<ExtensionConfig> permite pasar solo los campos que cambiaron
export async function saveConfig(config: Partial<ExtensionConfig>): Promise<void> {
  try {
    await chrome.storage.sync.set(config as unknown as Record<string, unknown>);
  } catch (error) {
    console.error('Tab Monitor: Error saving config:', error);
  }
}
```

**Por qué el tipo de retorno `Promise<T>` es explícito si `async` ya lo infiere:**
TypeScript puede inferirlo, pero anotarlo explícitamente documenta el contrato de la función y hace que los errores de tipo aparezcan en la firma, no en quien la llama.

**Por qué el doble cast `as unknown as Record<string, unknown>`:**
`@types/chrome` tipifica `chrome.storage.sync.get()` esperando `Partial<{ [key: string]: unknown }>`. Un interface con propiedades nombradas (`ExtensionConfig`) no es directamente asignable a un tipo con firma de índice — TypeScript lo rechaza. El puente por `unknown` es el patrón estándar para estos casos: cualquier tipo es asignable a `unknown`, y desde `unknown` puedes castear a lo que necesites.

### Paso 4: Tipar e Integrar el Service Worker (`src/background/index.ts`)
Reescribe tu archivo principal `background.js` a `src/background/index.ts`. Asegúrate de importar los módulos con rutas relativas correctas (sin añadir la extensión `.ts` al final):
```typescript
import { getConfig } from './utils/config';
import { enforceTabLimit } from './utils/tabManager';
import { handleMessage } from './utils/messageHandler';
// ...otras importaciones

// Escuchar eventos de creación de pestañas
chrome.tabs.onCreated.addListener(async (tab) => {
  const config = await getConfig();
  if (!config.enabled) return;
  await enforceTabLimit(tab.windowId, config);
});

// Registrar el message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Importante para mantener el canal abierto asíncronamente
});
```

*Repite el proceso para cada archivo utilitario agregando tipos a variables como IDs de ventanas, arrays de tabs y logs.*

---

## 🧪 Verificación

1. **Compilación sin errores:** Ejecuta `npm run build` en la terminal.
   * Vite compilará todo el código TypeScript y verificará si hay errores de tipos. Si la terminal no muestra alertas en rojo, la migración es correcta.
2. **Revisión del Service Worker en Chrome:**
   * Abre `chrome://extensions/` y presiona el botón de **Recargar** en la tarjeta de la extensión.
   * Haz clic en el enlace "service worker" para abrir las Chrome Developer Tools del script en segundo plano. No debería haber errores de inicialización o importación en la pestaña Console.
