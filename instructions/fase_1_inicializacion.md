# Fase 1: Inicialización del Entorno Node.js + TypeScript

Esta fase sienta las bases del proyecto configurando Node.js, instalando las dependencias necesarias e inicializando TypeScript.

---

## 🎯 Objetivo de la Fase
Configurar un entorno de desarrollo profesional con control de dependencias (`package.json`) y el compilador de TypeScript (`tsconfig.json`) configurado para compilar a una versión compatible con Manifest V3 de Chrome (ES2022).

---

## 📖 Conceptos Teóricos a Aprender

### 1. ¿Por qué usamos Node.js en una extensión del navegador?
Aunque el navegador ejecuta JavaScript puro directamente, usamos **Node.js** en tiempo de desarrollo para:
* **Gestionar librerías externas** (como React, Tailwind, librerías de testing) de forma centralizada sin tener que descargar archivos manualmente.
* **Ejecutar herramientas de desarrollo** (Vite para empaquetado automático, TypeScript para transpilación, y formateadores).

### 2. El rol de TypeScript (`tsconfig.json`)
JavaScript es un lenguaje dinámicamente tipado, lo que significa que los errores de tipo (como intentar leer una propiedad de algo que es `undefined`) solo se detectan al ejecutar la extensión. 
**TypeScript** compila a JavaScript estático, detectando estos errores *antes* de que cargues la extensión en Chrome.
* `tsconfig.json` le dice al compilador cómo transformar tus archivos `.ts` a `.js` (qué sintaxis de ES utilizar, si debe ser estricto, cómo resolver las rutas de archivos, etc.).

---

## 🛠️ Paso a Paso

### Paso 1: Configurar la versión de Node.js
Crea un archivo llamado `.nvmrc` en la raíz del proyecto para definir qué versión LTS de Node usaremos:
```text
20
```

### Paso 2: Inicializar el Package Manager
Abre la terminal en la raíz del proyecto y ejecuta:
```bash
npm init -y
```
*Esto generará un archivo `package.json` con la configuración predeterminada.*

### Paso 3: Instalar dependencias de desarrollo
Instalaremos todas las librerías necesarias para el compilador de TypeScript, React, Vite y las APIs de Chrome:
```bash
npm install -D vite @crxjs/vite-plugin typescript react react-dom @types/react @types/react-dom @types/chrome
```
* **`@types/chrome`**: Proporciona auto-completado y tipado estricto para el objeto global `chrome` que provee el navegador.

### Paso 4: Crear y configurar `tsconfig.json`
Crea el archivo `tsconfig.json` en la raíz con la siguiente configuración:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting/Strictness */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```
* **`"target": "ES2022"`**: Genera código JavaScript moderno que Chrome soporta de forma nativa en sus motores V8 recientes.
* **`"strict": true`**: Activa todas las comprobaciones estrictas de tipos para máxima seguridad.
* **`"noEmit": true`**: Delega la generación final de archivos a Vite (nuestro bundler), TypeScript solo se encargará de verificar los tipos.

### Paso 5: Actualizar `.gitignore`
Asegúrate de que tu archivo `.gitignore` tenga las siguientes líneas al final para no trackear carpetas generadas automáticamente:
```text
node_modules/
dist/
.env
```

---

## 🧪 Verificación

Para comprobar que esta fase está completa:
1. Verifica que la carpeta `node_modules/` y el archivo `package-lock.json` se hayan creado en la raíz.
2. Ejecuta `npx tsc --noEmit` en la consola. No debería dar errores (aunque aún no tengamos código en la carpeta `src`).
