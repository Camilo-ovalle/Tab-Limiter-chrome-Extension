# Fase 8: Integración Continua (CI/CD con GitHub Actions)

Esta fase implementa la automatización del control de calidad y despliegue del proyecto a través de GitHub Actions.

---

## 🎯 Objetivo de la Fase
Configurar flujos de trabajo (workflows) automatizados en la nube que corran pruebas unitarias, validación de sintaxis (lint) y generen el archivo `.zip` final de la extensión listo para subir a la tienda en cada nueva versión.

---

## 📖 Conceptos Teóricos a Aprender

### 1. ¿Qué es la Integración Continua (CI)?
Consiste en ejecutar de forma automática comprobaciones (como verificar que todo compile y pasen los tests) cada vez que subes código a tu repositorio de Git. Esto previene que se introduzcan fallos en la rama principal (`main`).

### 2. ¿Qué es el Despliegue Continuo (CD)?
Consiste en empaquetar y distribuir el producto terminado de manera automática. En el caso de extensiones de navegador, el CD genera un paquete comprimido (`.zip`) con los recursos de producción minificados. Este `.zip` puede adjuntarse directamente como un asset en GitHub Releases o subirse a la Chrome Web Store API.

---

## 🛠️ Paso a Paso

### Paso 1: Configurar ESLint y Prettier (Prerequisito de Calidad)
Instala las dependencias necesarias en tu entorno de desarrollo local:
```bash
npm install -D eslint @eslint/js typescript-eslint eslint-config-prettier prettier
```

> **Nota:** ESLint v9+ usa **flat config** (`eslint.config.js`), no el formato `.eslintrc.json` de versiones anteriores.

Crea un archivo `eslint.config.js` en la raíz:
```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
```

Añade los scripts en `package.json`:
```json
"scripts": {
  ...
  "lint": "eslint src",
  "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\""
}
```

> **`--write` y `--check` son mutuamente excluyentes en Prettier.** `format` corrige los archivos; `format:check` solo verifica sin modificar (úsalo en CI).

### Paso 2: Crear el directorio de Workflows
Crea la siguiente ruta de carpetas en tu repositorio:
```text
.github/
└── workflows/
```

### Paso 3: Crear el flujo de Integración Continua (`.github/workflows/ci.yml`)
Este flujo se ejecutará en cada Pull Request y push a la rama `main` para asegurar que el código cumple con los estándares:

```yaml
name: Integración Continua (CI)

on:
  push:
    branches: [ main, development ]
  pull_request:
    branches: [ main, development ]

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Descargar Código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Instalar Dependencias
        run: npm ci

      - name: Validar Formato (Prettier)
        run: npm run format:check

      - name: Validar Código (ESLint)
        run: npm run lint

      - name: Ejecutar Pruebas (Vitest)
        run: npm run test

      - name: Compilar Extensión (Build)
        run: npm run build
```

### Paso 4: Crear el flujo de Despliegue Continuo (`.github/workflows/release.yml`)
Este flujo se disparará únicamente cuando crees una nueva versión en Git (usando etiquetas como `v1.0.0` o `v2.1.3`). Compilará el proyecto y creará un archivo `.zip` descargable:

```yaml
name: Despliegue Continuo (CD)

on:
  push:
    tags:
      - 'v*' # Se dispara al subir tags que inicien con 'v', ej: v1.0.0

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Descargar Código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'

      - name: Instalar Dependencias
        run: npm ci

      - name: Compilar Extensión
        run: npm run build

      - name: Crear Archivo ZIP
        run: |
          cd dist
          zip -r ../chrome-tab-monitor-${{ github.ref_name }}.zip .
          cd ..

      - name: Crear GitHub Release y Adjuntar ZIP
        uses: softprops/action-gh-release@v2
        with:
          files: chrome-tab-monitor-${{ github.ref_name }}.zip
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🧪 Verificación

1. **Prueba local de calidad:** Ejecuta `npm run format`, `npm run lint`, `npm run test` y `npm run build` en tu local. Todo debe completar exitosamente sin advertencias críticas.
2. **Subir cambios a GitHub:**
   * Haz un commit de tu código e inicializa el repositorio remoto.
   * Abre un Pull Request. Verifica en la pestaña **Actions** de GitHub que el job `Integración Continua (CI)` empiece a correr en un contenedor de Linux limpio y termine con éxito (check verde).
3. **Probar la generación de releases:**
   * En tu consola de Git local, crea y sube una etiqueta:
     ```bash
     git tag v1.0.0
     git push origin v1.0.0
     ```
   * Monitorea la pestaña **Actions**. Debería ejecutarse el workflow `Despliegue Continuo (CD)`.
   * Al finalizar, ve a la sección **Releases** en tu repositorio de GitHub. Deberías encontrar la versión `v1.0.0` creada con el archivo `chrome-tab-monitor-v1.0.0.zip` listo para descargar e importar.
