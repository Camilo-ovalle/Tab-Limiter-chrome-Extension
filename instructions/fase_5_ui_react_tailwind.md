# Fase 5: UI Moderna con React y Tailwind CSS

En esta fase diseñaremos una interfaz gráfica premium y receptiva, reconstruyendo el Popup y la página de advertencia utilizando componentes React y estilos con Tailwind CSS.

---

## 🎯 Objetivo de la Fase
Reemplazar la UI estática actual por una aplicación moderna React, integrando Tailwind CSS para estilos estilizados, animaciones fluidas e indicadores visuales de políticas corporativas GPO (campos bloqueados con icono de candado/organización).

---

## 📖 Conceptos Teóricos a Aprender

### 1. ¿Cómo funciona Tailwind CSS v4 con Vite?
Tailwind CSS v4 usa un plugin nativo de Vite (`@tailwindcss/vite`) en lugar de PostCSS. Durante el build, Vite escanea todos tus componentes React (`.tsx`) buscando clases de Tailwind y compila **únicamente** las clases utilizadas en un solo archivo CSS optimizado. Ya no existen `tailwind.config.js` ni `postcss.config.js` — todo se configura en el propio CSS con la directiva `@theme`.

> **Nota:** `npx tailwindcss init` era un comando de v3 y ya no existe en v4.

### 2. Estado Visual Gestionado por Políticas
Cuando un campo es controlado por una GPO, el componente React debe reflejar un estado deshabilitado (`disabled`) y mostrar una alerta visual clara al usuario final de que la política está "Administrada por su organización", mejorando la experiencia del usuario y cumpliendo con estándares empresariales de software.

---

## 🛠️ Paso a Paso

### Paso 1: Instalar el plugin de Tailwind para Vite
Ejecuta en tu terminal:
```bash
npm install -D tailwindcss @tailwindcss/vite
```

### Paso 2: Registrar el plugin en `vite.config.ts`
Agrega `tailwindcss()` a la lista de plugins (antes de CRXJS):
```typescript
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  // ...
});
```

### Paso 3: Crear el archivo CSS global
Crea `src/popup/index.css`. En v4 la directiva de entrada es `@import 'tailwindcss'` y los colores personalizados van en `@theme`:
```css
@import 'tailwindcss';

@theme {
  --color-brand-dark: #0f172a;
  --color-brand-primary: #3b82f6;
  --color-brand-accent: #10b981;
  --color-brand-warning: #f59e0b;
  --color-brand-danger: #ef4444;
}

body {
  margin: 0;
  background-color: #0f172a;
  color: #f1f5f9;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  width: 420px;
  overflow-x: hidden;
}
```
Importa este archivo al inicio de `src/popup/main.tsx`:
```typescript
import './index.css';
```

> **Tipos de Vite para CSS:** Si TypeScript lanza `error TS2882: Cannot find module './index.css'`, crea `src/vite-env.d.ts` con:
> ```typescript
> /// <reference types="vite/client" />
> ```

### Paso 4: Crear Componentes de la Interfaz

Crea la subcarpeta de componentes en `src/popup/components/` para organizar la UI:
* **`StatsCard.tsx`**: Muestra las estadísticas de pestañas y ventanas con barras de progreso.
* **`WindowList.tsx`**: Renderiza la lista de ventanas activas con sus recuentos.
* **`ConfigPanel.tsx`**: Formulario de configuración con controles para límites, notificaciones, etc.

#### Ejemplo de Campo Configurable con Candado GPO (`ConfigInput.tsx`):
```tsx
import React from 'react';

interface ConfigInputProps {
  label: string;
  value: number | boolean;
  type: 'number' | 'checkbox';
  isManaged: boolean; // Si es controlado por GPO
  onChange: (value: number | boolean) => void;
}

export const ConfigInput: React.FC<ConfigInputProps> = ({
  label,
  value,
  type,
  isManaged,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        {isManaged && (
          <span title="Configuración administrada por su organización (GPO)">
            🏢 <span className="text-[10px] text-slate-500 font-semibold uppercase">GPO</span>
          </span>
        )}
      </div>

      {type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={value as boolean}
          disabled={isManaged}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded bg-slate-700 border-slate-600 focus:ring-blue-500 disabled:opacity-50"
        />
      ) : (
        <input
          type="number"
          value={value as number}
          disabled={isManaged}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 p-1 text-center text-sm rounded bg-slate-800 border border-slate-700 text-white disabled:opacity-50 disabled:bg-slate-900"
        />
      )}
    </div>
  );
};
```

---

## 🧪 Verificación

1. **Revisar estilos en Dev Server:**
   * Ejecuta `npm run dev`.
   * Abre el popup y verifica que los componentes tengan estilos correctos, fuentes fluidas y que los campos se inhabiliten visualmente (opacidad reducida e icono corporativo) si simulas un valor en la clave de políticas GPO.
2. **Compilar y verificar tamaño:**
   * Ejecuta `npm run build`.
   * Asegúrate de que el archivo CSS generado en `dist/assets/` esté optimizado y no contenga estilos no utilizados de Tailwind.
