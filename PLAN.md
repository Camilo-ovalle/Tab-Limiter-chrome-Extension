# Plan de Objetivos para la Actualización del Proyecto

Este documento describe los objetivos clave que se persiguen al actualizar y modernizar la extensión **Chrome Tab Monitor**. La meta es transformar una base de código estática y manual en un proyecto robusto, escalable, tipado y automatizado.

---

## 🎯 Objetivos Principales

### 1. Robustez y Prevención de Errores (TypeScript)
* **Tipado Estricto:** Migrar toda la lógica del Service Worker (`background.js`) y utilidades a TypeScript para capturar errores en tiempo de compilación y evitar fallos inesperados en producción.
* **Interfaces Claras:** Definir contratos claros (interfaces) para las configuraciones, logs, estadísticas de ventanas y comunicación por mensajes.

### 2. Modernización del Desarrollo y HMR (Vite + CRXJS)
* **Hot Module Replacement (HMR):** Permitir que los cambios realizados en el popup se reflejen instantáneamente sin necesidad de recargar la extensión manualmente en Chrome.
* **Empaquetado Eficiente:** Utilizar Vite y `@crxjs/vite-plugin` para procesar y optimizar automáticamente el manifiesto, scripts y recursos de la extensión.

### 3. Escalabilidad de la Interfaz (React)
* **Componentización:** Reescribir la interfaz del popup y de las páginas de alerta utilizando React para crear componentes reutilizables y limpios.
* **Gestión de Estado Reactiva:** Facilitar el flujo y actualización de datos (como estadísticas en vivo y logs) mediante estados de React, evitando la manipulación directa y manual del DOM.

### 4. Automatización de Calidad y Formato (ESLint + Prettier + Husky)
* **Consistencia:** Establecer reglas estrictas de estilo y formato de código automáticas.
* **Pre-commit Hooks:** Impedir que se suba código con errores de lint o formato roto mediante ganchos de Git controlados por Husky.

### 5. Estabilidad Mediante Pruebas (Vitest)
* **Pruebas Unitarias:** Implementar suites de pruebas automatizadas con Vitest para validar la lógica compleja de conteo y cierre automático de pestañas y ventanas sin necesidad de probarlas manualmente cada vez.
* **Mocks de la API de Chrome:** Simular el entorno de extensiones de Chrome para validar que los eventos se disparen y procesen correctamente.

### 6. Integración y Entrega Continua (CI/CD con GitHub Actions)
* **Validación en Pull Requests:** Ejecutar automáticamente las pruebas, formateadores y constructores en la nube antes de permitir la fusión de código.
* **Compilación de Producción Automática:** Generar automáticamente un archivo `.zip` listo para la Chrome Web Store cuando se cree una nueva versión (tag) del proyecto.

---

## 🛠️ Entregables del Proyecto

1. **Entorno de desarrollo moderno:** Comandos `npm run dev` y `npm run build` operativos.
2. **Código base tipado:** Todo el código fuente migrado a `.ts` y `.tsx`.
3. **Frontend modularizado:** Popup y Warning Page reconstruidos en React.
4. **Pipeline de CI/CD configurado:** Archivos de GitHub Actions activos en `.github/workflows/`.
5. **Suite de pruebas:** Tests unitarios cubriendo los escenarios críticos del límite de pestañas y ventanas.
