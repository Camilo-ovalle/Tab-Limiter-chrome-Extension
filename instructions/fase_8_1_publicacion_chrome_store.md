# Fase 8.1 — Publicación en Chrome Web Store

## Objetivo

Documentar el proceso completo de publicación de la extensión en la Chrome Web Store y cómo el pipeline de CI/CD (configurado en la Fase 8) se conecta con la store para automatizar los releases a partir de la segunda publicación.

---

## El flujo de extremo a extremo

```
Tú haces: git tag v1.0.0 && git push origin v1.0.0
                    ↓
        GitHub Actions se dispara (release.yml)
                    ↓
        npm run build → genera dist/
                    ↓
        Se crea .zip de dist/
                    ↓
        Se sube el .zip a Chrome Web Store via API
                    ↓
        Google revisa (1–3 días hábiles)
                    ↓
        Se publica automáticamente (o rechaza con motivo)
```

---

## Credenciales necesarias

Son **3 credenciales** que deben guardarse como GitHub Secrets una vez obtenidas.

### 1. `CHROME_EXTENSION_ID`

El ID único de la extensión en la store. Tiene la forma `abcdefghijklmnopqrstuvwxyz123456`.

**Se obtiene:** solo existe después de la primera publicación manual (ver sección siguiente). Google lo asigna al crear el listing.

### 2. `CHROME_CLIENT_ID` y `CHROME_CLIENT_SECRET`

Credenciales OAuth 2.0 para que GitHub Actions pueda hablar con la Chrome Web Store API en nombre de tu cuenta Google.

**Pasos para obtenerlas:**

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto nuevo (o usar uno existente)
3. En el menú lateral: **APIs y servicios → Biblioteca**
4. Buscar y habilitar la **Chrome Web Store API**
5. Ir a **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth 2.0**
6. Tipo de aplicación: **Aplicación de escritorio**
7. Descargar el JSON resultante — contiene `client_id` y `client_secret`

### 3. `CHROME_REFRESH_TOKEN`

Token de larga duración que permite a la API actuar sin intervención humana. Se genera **una sola vez**.

**Pasos para obtenerlo:**

```bash
# Instalar la CLI
npm install -g chrome-webstore-upload-cli

# Lanzar el flujo de autorización
chrome-webstore-upload get-refresh-token \
  --client-id TU_CLIENT_ID \
  --client-secret TU_CLIENT_SECRET
```

El comando genera una URL. Ábrela en el navegador con tu cuenta Google de desarrollador, acepta los permisos, y la CLI imprime el refresh token. Guárdalo — no expira a menos que revoques el acceso.

---

## Primera publicación — obligatoriamente manual

**La primera vez no puede ser automática.** Google requiere que el listing exista antes de poder usar la API.

### Requisitos previos

| Requisito | Detalle |
|-----------|---------|
| Cuenta Google Developer | Registrarse en chrome.google.com/webstore/devconsole |
| Cuota de desarrollador | Pago único de **$5 USD** |
| Assets del listing | Ver lista abajo |

### Assets que debes preparar antes de subir

- **Ícono 128×128 px** — PNG, el mismo del `manifest.json`
- **Screenshots** — mínimo 1, máximo 5. Tamaño exacto: 1280×800 px o 640×400 px
- **Ícono del store** — 440×280 px (imagen promocional pequeña, opcional pero recomendada)
- **Descripción corta** — máximo 132 caracteres
- **Descripción larga** — hasta 16.000 caracteres, soporta saltos de línea
- **Categoría** — por ejemplo: "Productividad"
- **Idioma** — al menos inglés o español

### Pasos de la primera publicación

1. Ir a [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
2. Pagar la cuota de $5 si es la primera extensión de la cuenta
3. Click en **"Nuevo elemento"**
4. Subir el `.zip` de `dist/` (generado con `npm run build`)
5. Completar el listing: descripción, screenshots, ícono, categoría
6. En **"Privacidad"**: declarar qué permisos usa y por qué (requerido por Google)
7. Enviar a revisión
8. Esperar 1–3 días hábiles — Google revisa manualmente
9. Una vez aprobada, copiar el **Extension ID** de la URL del listing

A partir de aquí, todas las actualizaciones pueden ser automáticas via el workflow de release.

---

## Declaración de privacidad y permisos (requerida por Google)

La extensión usa los siguientes permisos que Google pedirá justificar:

| Permiso | Justificación |
|---------|--------------|
| `tabs` | Contar y cerrar pestañas que excedan el límite configurado |
| `windows` | Contar y controlar el número de ventanas abiertas |
| `storage` | Guardar la configuración del usuario en `chrome.storage.sync` |
| `notifications` | Alertar al usuario cuando se acerca al límite |
| `management` (si aplica) | Políticas GPO via `chrome.storage.managed` |

**Host permissions:** ninguna — la extensión no accede a contenido de páginas web.

---

## Configuración de GitHub Secrets

Una vez obtenidas las credenciales, agregarlas en:
**GitHub → repositorio → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|-------|
| `CHROME_EXTENSION_ID` | El ID del listing (después de primera publicación) |
| `CHROME_CLIENT_ID` | Del JSON descargado de Google Cloud Console |
| `CHROME_CLIENT_SECRET` | Del JSON descargado de Google Cloud Console |
| `CHROME_REFRESH_TOKEN` | Generado con `chrome-webstore-upload get-refresh-token` |

---

## El workflow de release (a implementar en Fase 8)

El archivo `.github/workflows/release.yml` se dispara con cualquier tag `v*`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Lo que hace el workflow:

1. Checkout del código
2. `npm ci && npm run build` → genera `dist/`
3. Comprime `dist/` en `extension.zip`
4. Crea un GitHub Release con `extension.zip` como asset (historial de versiones)
5. Sube `extension.zip` a la Chrome Web Store via `chrome-webstore-upload-cli`
6. Publica la nueva versión (queda en revisión de Google)

La herramienta que gestiona la comunicación con la API de Google es [`chrome-webstore-upload-cli`](https://github.com/nickvdyck/chrome-webstore-upload-cli).

---

## Checklist de esta fase

- [ ] Cuenta Google Developer registrada y cuota de $5 pagada
- [ ] Assets del listing preparados (ícono 128px, screenshots 1280×800)
- [ ] Primera publicación manual completada y Extension ID guardado
- [ ] Proyecto creado en Google Cloud Console con Chrome Web Store API habilitada
- [ ] Credenciales OAuth 2.0 generadas (Client ID + Client Secret)
- [ ] Refresh Token generado con la CLI
- [ ] 4 GitHub Secrets configurados en el repositorio
- [ ] Workflow `release.yml` implementado y probado con un tag de prueba

---

## Notas importantes

- **Versión en `manifest.json`** — debe incrementarse en cada release. Google rechaza subir el mismo número de versión dos veces.
- **Tiempo de revisión** — Google no garantiza tiempos. Extensiones nuevas suelen tardar más (hasta 1 semana). Updates menores son más rápidos.
- **Rechazos** — si Google rechaza, envían un correo con el motivo. Los rechazos más comunes son: permisos no justificados, código ofuscado, o capturas de pantalla de baja calidad.
- **Distribución privada** — si la extensión es solo para uso interno en la empresa, se puede publicar como **"Privada (solo para tu organización)"** usando Google Workspace. Esto requiere que todos los usuarios tengan cuenta del mismo dominio Google Workspace.
