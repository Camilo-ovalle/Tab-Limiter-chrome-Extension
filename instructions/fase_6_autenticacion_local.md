# Fase 6: Descartada

La funcionalidad de autenticación local con contraseña fue descartada. Las razones:

- Complejidad innecesaria antes de tener el despliegue GPO estable
- Riesgo de seguridad: cualquier contraseña embebida en el bundle puede extraerse
- La gestión de límites por máquina se hará vía GPO directamente cuando el proceso de aprobación corporativo lo permita

## Alternativas futuras (si se necesita override puntual)

- **Por GPO diferenciado:** crear una OU de pruebas con políticas distintas
- **Por parámetro GPO:** añadir una política `allowUserOverride: true` en `schema.json` que desbloquee los campos en el popup para OUs específicas — sin contraseña, controlado centralmente
- **Sin override:** ajustar el GPO de test y hacer `gpupdate /force`

Esta fase se salta. La siguiente es la **Fase 7: Testing con Vitest**.
