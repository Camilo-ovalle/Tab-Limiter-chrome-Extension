# Guía de Instalación y Pruebas - Chrome Tab Monitor

## **Paso 1: Generar los Iconos de la Extensión**

Primero necesitamos crear los archivos de iconos que Chrome requiere:

1. **Abrir el generador de iconos:**
   - Ve a tu carpeta `chrome-tab-monitor`
   - Haz doble clic en `create-icons.html` para abrirlo en tu navegador
   - Verás una página con el título "Tab Monitor Extension - Icon Generator"

2. **Generar y descargar iconos:**
   - Haz clic en el botón azul "Generate Icons"
   - Verás aparecer 4 iconos (16x16, 32x32, 48x48, 128x128)
   - Haz clic en "Download All", o individualmente:
     - Clic derecho en el primer icono → "Guardar imagen como..." → nómbralo `icon16.png`
     - Clic derecho en el segundo icono → "Guardar imagen como..." → nómbralo `icon32.png`
     - Clic derecho en el tercer icono → "Guardar imagen como..." → nómbralo `icon48.png`
     - Clic derecho en el cuarto icono → "Guardar imagen como..." → nómbralo `icon128.png`

3. **Colocar iconos en la carpeta correcta:**
   - Mueve los 4 archivos PNG a la carpeta `chrome-tab-monitor/icons/`
   - Tu carpeta icons ahora debe contener: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

## **Paso 2: Cargar la Extensión en Chrome**

1. **Abrir la página de extensiones de Chrome:**
   - Abre Google Chrome
   - Escribe `chrome://extensions/` en la barra de direcciones y presiona Enter
   - O ve al menú de Chrome → Más herramientas → Extensiones

2. **Habilitar el Modo de Desarrollador:**
   - Busca el interruptor "Modo de desarrollador" en la esquina superior derecha
   - Haz clic para activarlo (debe aparecer azul/habilitado)

3. **Cargar la extensión:**
   - Haz clic en el botón "Cargar extensión sin empaquetar" (aparece tras habilitar modo desarrollador)
   - Navega y selecciona tu carpeta `chrome-tab-monitor`
   - Haz clic en "Seleccionar carpeta"

4. **Verificar la instalación:**
   - La extensión debe aparecer en tu lista de extensiones
   - Debes ver "Chrome Tab Monitor" con versión 1.0.0
   - Busca el icono de la extensión en tu barra de herramientas de Chrome (arriba a la derecha)

## **Paso 3: Pruebas de Funcionalidad Básica**

### **Prueba 1: Configuración Inicial**
1. **Haz clic en el icono de la extensión** en tu barra de herramientas
2. **Debes ver:**
   - Una ventana popup con el título "Tab Monitor"
   - Estadísticas actuales mostrando tus pestañas abiertas
   - Opciones de configuración
   - El interruptor principal debe estar ACTIVADO

### **Prueba 2: Configuración**
1. **En el popup, intenta cambiar configuraciones:**
   - Cambia "Tab Limit per Window" a `5` (número menor para facilitar pruebas)
   - Asegúrate que "Auto-close excess tabs" esté marcado
   - Asegúrate que "Show notifications" esté marcado
   - Haz clic en "Save Configuration"
   - Debes ver una notificación verde de éxito

### **Prueba 3: Monitoreo de Pestañas**
1. **Abrir múltiples pestañas:**
   - Abre 7-8 pestañas nuevas en la misma ventana
   - Nota que el número en el icono de la extensión se actualiza con el total de pestañas
   - El número debe volverse rojo cuando excedas 5 pestañas

2. **Revisar el popup:**
   - Haz clic en el icono de la extensión
   - En "Current Statistics" debes ver el conteo de ventanas que exceden el límite
   - En "Window Overview" debes ver que tu ventana está sobre el límite (indicador rojo)
   - Revisa "Recent Activity" para ver eventos registrados

### **Prueba 4: Función de Auto-Cierre**
1. **Con 7-8 pestañas abiertas:**
   - La extensión debe comenzar automáticamente a cerrar pestañas en exceso
   - Cerrará las pestañas abiertas más recientemente primero
   - No cerrará la pestaña activa ni pestañas fijadas
   - Debes ver notificaciones sobre pestañas siendo cerradas

2. **Observar el registro de actividad:**
   - Abre el popup y ve a "Recent Activity"
   - Debes ver entradas como "Closed tab: [título de página]"

## **Paso 4: Pruebas Avanzadas**

### **Probar Múltiples Ventanas**
1. **Abre una segunda ventana de Chrome** (Ctrl+Shift+N)
2. **Abre pestañas en ambas ventanas**
3. **Revisa el popup:**
   - Debe mostrar estadísticas para ambas ventanas
   - Cada ventana se monitorea independientemente

### **Probar Lógica de Cierre Inteligente**
1. **Fijar una pestaña** (clic derecho en pestaña → "Fijar pestaña")
2. **Abrir más pestañas para exceder el límite**
3. **Verificar:** La pestaña fijada nunca debe cerrarse
4. **Cambiar a una pestaña diferente** (hacerla activa)
5. **Verificar:** La pestaña activa nunca debe cerrarse

### **Probar Persistencia de Configuración**
1. **Cambiar configuraciones y guardar**
2. **Cerrar el popup**
3. **Reabrir el popup**
4. **Verificar:** Las configuraciones deben recordarse

## **Paso 5: Solución de Problemas Comunes**

### **Si la Extensión No Carga:**
```bash
# Revisar errores:
# 1. Ve a chrome://extensions/
# 2. Busca texto de error rojo bajo "Chrome Tab Monitor"
# 3. Problemas comunes:
#    - Faltan archivos de iconos en carpeta icons/
#    - Permisos de archivo incorrectos
#    - Errores de sintaxis JSON
```

### **Si el Número No Se Actualiza:**
1. **Refrescar la extensión:**
   - Ve a `chrome://extensions/`
   - Haz clic en el icono de refrescar en "Chrome Tab Monitor"
   - O desactiva y reactiva la extensión

### **Si el Auto-Cierre No Funciona:**
1. **Revisar configuraciones:**
   - Abre el popup
   - Asegúrate que "Auto-close excess tabs" esté marcado
   - Asegúrate que la extensión esté habilitada (interruptor principal activado)
   - Intenta hacer clic en el botón "Force Verification"

### **Si el Popup No Abre:**
1. **Revisar errores de JavaScript:**
   - Clic derecho en el icono de la extensión
   - Selecciona "Inspeccionar popup"
   - Busca errores en la consola

## **Paso 6: Lista de Verificación de Pruebas**

- [ ] **Iconos generados y colocados correctamente**
- [ ] **Extensión carga sin errores**
- [ ] **Popup abre y muestra estadísticas actuales**
- [ ] **Configuraciones se pueden cambiar y guardar**
- [ ] **Número se actualiza con el conteo de pestañas**
- [ ] **Número se vuelve rojo cuando se excede el límite**
- [ ] **Auto-cierre remueve pestañas en exceso**
- [ ] **Pestañas fijadas y activas no se cierran**
- [ ] **Registro de actividad muestra eventos recientes**
- [ ] **Múltiples ventanas se monitorean por separado**
- [ ] **Botón de verificación forzada funciona**
- [ ] **Configuraciones persisten después del reinicio**

## **Obtener Ayuda en Caso de Problemas**

### **Revisar Errores:**
1. **Consola del navegador:**
   - Presiona F12 → pestaña Console
   - Busca mensajes de error

2. **Errores de extensión:**
   - Ve a `chrome://extensions/`
   - Busca mensajes de error bajo la extensión

### **Reiniciar la Extensión:**
1. **Desactívala y actívala** en `chrome://extensions/`
2. **O remueve y recarga** la extensión sin empaquetar
3. **Verifica que todos los archivos** estén en su lugar correcto

### **Archivos Requeridos:**
```
chrome-tab-monitor/
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── styles.css
├── create-icons.html
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## **Notas Importantes:**

⚠️ **El problema más común son los archivos de iconos faltantes** - asegúrate de completar el Paso 1 completamente

✅ **La extensión debe funcionar inmediatamente** después de cargarla correctamente

🔧 **Para debugging avanzado:** Usa las herramientas de desarrollador de Chrome (F12) en la página de extensiones

📧 **Si necesitas ayuda:** Revisa la consola de errores y los logs del service worker en chrome://extensions/

---

**¡Sigue estos pasos en orden y tendrás tu extensión funcionando perfectamente!** 🚀