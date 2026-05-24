# Fase 4: Soporte GPO (Managed Storage Enterprise)

Esta fase implementa la compatibilidad con Directivas de Grupo de Windows (GPO) para permitir que la extensión se administre y despliegue centralizadamente en entornos corporativos.

---

## 🎯 Objetivo de la Fase

Habilitar dos capacidades independientes de administración empresarial:

1. **Instalación forzada** — el administrador despliega la extensión automáticamente a los navegadores de los equipos según la OU donde estén.
2. **Configuración gestionada** — el administrador impone valores de configuración (límites de pestañas, ventanas, etc.) que el usuario no puede modificar.

Ambas se configuran via GPO pero mediante políticas de Chrome distintas.

---

## 📖 Conceptos Teóricos a Aprender

### 1. Las dos políticas de Chrome involucradas

| Política | Qué hace | Dónde se aplica |
|---|---|---|
| `ExtensionInstallForcelist` | Instala la extensión automáticamente en el navegador | Por OU — solo las PCs en esa OU la reciben |
| `3rdparty/extensions/<id>/policy` | Configura los valores de la extensión ya instalada | Por OU — distintas OUs pueden tener distintos límites |

Son independientes pero complementarias. Puedes usar una sin la otra.

### 2. ¿Cómo lee Chrome las políticas GPO?

Los administradores inyectan valores directamente en el Registro de Windows bajo rutas de políticas de Google Chrome. Chrome lee esas claves y las expone a las extensiones via `chrome.storage.managed`. Si no hay nada configurado en el registro, `chrome.storage.managed.get()` devuelve un objeto vacío `{}`.

### 3. El Esquema de Políticas (`schema.json`)

Chrome requiere un esquema JSON (draft-03) que declare qué campos acepta la política de configuración, sus tipos y rangos. Si una clave del registro no coincide con el esquema, Chrome la descarta.

> **Nota:** El esquema solo aplica a la política de configuración (`chrome.storage.managed`). La instalación forzada (`ExtensionInstallForcelist`) no requiere schema — es una política propia de Chrome.

### 4. La API `chrome.storage.managed`

A diferencia de `chrome.storage.sync` o `chrome.storage.local`, el almacenamiento administrado es **de solo lectura** para la extensión. Solo el administrador del sistema puede escribir en él, nunca el código de la extensión.

---

## 🛠️ Paso a Paso

### Paso 1: Crear el archivo `schema.json`

Crea `schema.json` en la raíz del proyecto. Este archivo define qué políticas puede configurar el administrador via GPO:

```json
{
  "$schema": "http://json-schema.org/draft-03/schema#",
  "type": "object",
  "properties": {
    "enabled": {
      "type": "boolean",
      "description": "Habilita o deshabilita el monitoreo global de pestañas y ventanas."
    },
    "tabLimit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "description": "Límite máximo de pestañas permitidas por ventana."
    },
    "windowLimit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10,
      "description": "Límite máximo de ventanas de navegador permitidas simultáneamente."
    },
    "autoClose": {
      "type": "boolean",
      "description": "Habilita el cierre automático de pestañas excedentes."
    },
    "autoCloseWindows": {
      "type": "boolean",
      "description": "Habilita el cierre automático de ventanas excedentes."
    }
  }
}
```

> **Por qué draft-03:** Chrome Enterprise requiere explícitamente JSON Schema draft-03 para los schemas de extensiones. Versiones más nuevas (draft-07, draft-2019) son ignoradas.

### Paso 2: Registrar el esquema en `manifest.json`

Añade la propiedad `"storage"` apuntando al schema. También agrega el permiso `"management"` que necesitarás para consultar si la extensión fue instalada de forma gestionada:

```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",
    "tabs",
    "windows",
    "notifications"
  ],
  "storage": {
    "managed_schema": "schema.json"
  }
}
```

### Paso 3: Implementar la precedencia en `src/background/utils/config.ts`

Agrega una nueva interfaz `ConfigState` y la función `getMergedConfig()` a tu `config.ts` existente. Esta función fusiona las tres fuentes de configuración respetando la cadena de prioridad:

```typescript
import type { ExtensionConfig } from '../../shared/types';
import { DEFAULT_CONFIG } from './config';

// Extiende la respuesta de config para indicar qué campos controla GPO
export interface ConfigState {
  values: ExtensionConfig;
  managedKeys: Array<keyof ExtensionConfig>; // campos de solo lectura en la UI
}

// ✅ async/await puro — chrome.storage.managed.get devuelve Promise en MV3
export async function getMergedConfig(): Promise<ConfigState> {
  // Leer ambas fuentes en paralelo — son independientes entre sí
  const [syncResult, managedResult] = await Promise.all([
    chrome.storage.sync.get(DEFAULT_CONFIG as unknown as Record<string, unknown>),
    chrome.storage.managed.get(null),
  ]);

  const localConfig = syncResult as Partial<ExtensionConfig>;
  const managedConfig = managedResult as Partial<ExtensionConfig>;

  // Los campos presentes en managedConfig son los que controla GPO
  const managedKeys = Object.keys(managedConfig) as Array<keyof ExtensionConfig>;

  // Cadena de prioridad: GPO > local > DEFAULT_CONFIG
  // El spread de derecha sobreescribe al de izquierda
  const finalConfig: ExtensionConfig = {
    ...DEFAULT_CONFIG,
    ...localConfig,
    ...managedConfig, // GPO gana siempre
    adminRole: false, // nunca persiste en ningún storage
  };

  return { values: finalConfig, managedKeys };
}
```

**Por qué `Promise.all`:** ambas lecturas de storage son independientes. En lugar de esperar a que termine una para comenzar la otra, se lanzan en paralelo y se espera solo a que ambas completen.

### Paso 4: Configurar la instalación forzada en el GPO

> Este paso se configura en el servidor de dominio (Controlador de Dominio), no en el código de la extensión. Ver `laboratorio_ad_gpo.md` para la guía completa del entorno de pruebas.

La política `ExtensionInstallForcelist` de Chrome acepta una lista de extensiones que Chrome instalará automáticamente en todos los navegadores del equipo afectado, sin que el usuario pueda desinstalarlas.

**Formato del valor:**
```
<extension-id>;<update-url>
```

**Para extensiones publicadas en Chrome Web Store:**
```
abcdefghijklmnopqrstuvwxyz123456;https://clients2.google.com/service/update2/crx
```

**Para extensiones auto-hospedadas (entorno corporativo sin CWS):**
Se necesita un servidor web local con un XML de actualización. El formato del XML es:
```xml
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='<extension-id>'>
    <updatecheck codebase='http://servidor-interno/tab-monitor.crx' version='1.1.0' />
  </app>
</gupdate>
```

Y la URL del GPO apuntaría a ese XML:
```
abcdefghijklmnopqrstuvwxyz123456;http://servidor-interno/update.xml
```

**Cómo se aplica por OU:** en el Controlador de Dominio, creas el GPO con esta política y lo enlazas únicamente a la OU que quieres que reciba la extensión. Las PCs en otras OUs no la reciben. Ver `laboratorio_ad_gpo.md`.

---

## 🧪 Verificación Local (sin dominio)

Para probar la configuración gestionada en tu máquina local sin un servidor de Active Directory:

1. **Obtener el ID de la extensión:** Abre `chrome://extensions/`, activa "Modo desarrollador" y copia el ID de tu extensión.

2. **Abrir el Editor de Registro:** `Win + R` → `regedit` → Enter.

3. **Crear la ruta de claves de configuración:**
   ```
   HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\3rdparty\extensions\<TU-ID>\policy
   ```
   Crea cada subclave que no exista: clic derecho → Nuevo → Clave.

4. **Agregar una política de prueba:**
   Dentro de `policy`: clic derecho → Nuevo → **Valor DWORD (32 bits)** → nombre `tabLimit` → valor `4` en base Decimal.

5. **Verificar en Chrome:**
   - Navega a `chrome://policy`
   - Clic en **Volver a cargar políticas**
   - Busca una sección con el ID de tu extensión mostrando `tabLimit: 4` con estado "OK"

6. **Verificar en la extensión:**
   En el popup, el campo de límite de pestañas debe mostrar `4` y estar deshabilitado con el indicador GPO.

> Para probar la **instalación forzada** localmente puedes agregar la clave:
> `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist`
> con valor `1` = `<id>;https://clients2.google.com/service/update2/crx`
> Chrome instalará la extensión automáticamente al reiniciar.
