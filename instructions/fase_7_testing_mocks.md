# Fase 7: Testing Automatizado con Vitest y Mocks de Chrome

Esta fase implementa pruebas automatizadas para asegurar que la lógica interna de la extensión sea estable y no se rompa al agregar nuevas funciones en el futuro.

---

## 🎯 Objetivo de la Fase
Configurar **Vitest** como framework de pruebas unitarias y crear simuladores (mocks) de la API global `chrome` para probar el flujo de precedencia de configuraciones e inmutabilidad de GPO de forma aislada.

---

## 📖 Conceptos Teóricos a Aprender

### 1. ¿Por qué probar con Mocks?
En un entorno de Node.js donde corren los tests, el objeto global `chrome` que provee el navegador **no existe**. Intentar llamar a `chrome.storage.sync.get` dará un error instantáneo: `ReferenceError: chrome is not defined`.
Para solucionar esto, creamos un **Mock** (objeto simulado) que imita exactamente el comportamiento de las APIs del navegador en memoria de Node.js.

### 2. Pruebas de Regresión
A medida que la extensión crece, es fácil introducir bugs accidentales (ej. hacer que un cambio en las pestañas no respete el límite GPO). Las pruebas unitarias garantizan que el comportamiento esperado de funciones críticas como `enforceTabLimit` permanezca inalterable a lo largo del tiempo.

---

## 🛠️ Paso a Paso

### Paso 1: Instalar dependencias de testing
Ejecuta en tu consola para descargar las librerías necesarias:
```bash
npm install -D vitest @testing-library/react jsdom
```

### Paso 2: Crear el archivo de configuración de pruebas `vitest.config.ts`
En la raíz de tu proyecto, crea `vitest.config.ts` para indicarle a Vitest que emule un entorno de navegador (`jsdom`):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### Paso 3: Crear el Mock Global de Chrome (`src/test/setup.ts`)
Crea la carpeta `src/test/` y dentro de ella el archivo `setup.ts`. Este script se ejecutará antes de cada test para inyectar la simulación de Chrome:

```typescript
import { vi } from 'vitest';

// Almacenamientos simulados en memoria
let mockSyncStorage: Record<string, unknown> = {};
let mockManagedStorage: Record<string, unknown> = {};

// ✅ El mock devuelve Promises — igual que las Chrome APIs reales en MV3
const chromeMock = {
  storage: {
    sync: {
      get: vi.fn(async (_keys: unknown) => ({ ...mockSyncStorage })),
      set: vi.fn(async (data: Record<string, unknown>) => {
        mockSyncStorage = { ...mockSyncStorage, ...data };
      }),
    },
    managed: {
      get: vi.fn(async (_keys: unknown) => ({ ...mockManagedStorage })),
    },
    local: {
      get: vi.fn(async (_keys: unknown) => ({})),
      set: vi.fn(async (_data: unknown) => {}),
    },
    session: {
      get: vi.fn(async (_keys: unknown) => ({})),
      set: vi.fn(async (_data: unknown) => {}),
    },
  },
  runtime: {
    lastError: null,
  },
};

// Adjuntar el mock al objeto global
global.chrome = chromeMock as unknown as typeof chrome;

// Helper para limpiar los almacenes simulados entre tests
export function resetMockStorage() {
  mockSyncStorage = {};
  mockManagedStorage = {};
}

// Helper para simular una política GPO activa
export function setManagedPolicy(policy: Record<string, unknown>) {
  mockManagedStorage = policy;
}
```

### Paso 4: Escribir la prueba unitaria para la configuración (`src/test/config.test.ts`)
Crea un archivo de pruebas para verificar que la precedencia de políticas GPO sobre las locales funcione exactamente como se diseñó:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMergedConfig, DEFAULT_CONFIG } from '../background/utils/config';
import { resetMockStorage, setManagedPolicy } from './setup';

describe('Configuración con precedencia de GPO', () => {
  beforeEach(() => {
    resetMockStorage();
    vi.clearAllMocks();
  });

  it('debe devolver valores por defecto si no hay configuraciones locales ni GPO', async () => {
    const configState = await getMergedConfig();
    expect(configState.values.tabLimit).toBe(DEFAULT_CONFIG.tabLimit);
    expect(configState.managedKeys.length).toBe(0);
  });

  it('debe priorizar valores locales si existen y no hay GPO', async () => {
    // ✅ async/await directo — el mock devuelve Promise
    await chrome.storage.sync.set({ tabLimit: 8 });

    const configState = await getMergedConfig();
    expect(configState.values.tabLimit).toBe(8);
    expect(configState.managedKeys.length).toBe(0);
  });

  it('debe priorizar GPO sobre la configuración local y marcar la clave como managed', async () => {
    await chrome.storage.sync.set({ tabLimit: 8 });

    // ✅ Usar el helper en lugar de mockImplementationOnce con @ts-ignore
    setManagedPolicy({ tabLimit: 3 });

    const configState = await getMergedConfig();
    expect(configState.values.tabLimit).toBe(3);
    expect(configState.managedKeys).toContain('tabLimit');
  });
});
```

### Paso 5: Añadir el script de test en `package.json`
Modifica tu `"scripts"` en el `package.json`:
```json
"scripts": {
  ...
  "test": "vitest run"
}
```

---

## 🧪 Verificación

1. **Ejecutar las pruebas:** Ejecuta en tu terminal:
   ```bash
   npm run test
   ```
2. **Resultado exitoso:** La terminal debe mostrar un reporte verde indicando que los tests de precedencia pasaron exitosamente.
3. **Cambiar la lógica para verificar fallas:** Modifica intencionalmente `config.ts` para que ignore la GPO (ej. comentando la línea de managed) y vuelve a ejecutar los tests. Vitest debería arrojar un error rojo explicando qué aserción falló, validando el sistema de pruebas.
