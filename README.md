# ACOS · Plataforma empresarial de correduría de seguros

Desarrollado por XARCON sobre React 19, TypeScript, Vite y Firebase para ACOS Nicaragua.

## Estado operativo
- **Web pública comercial:** catálogo de seguros, asesoría, aseguradoras y contacto, con la identidad oficial definida por ACOS.
- **Acceso empresarial:** Firebase Authentication y control de identidad/roles; interfaz de Dirección, colaboradores y servicios operativos.
- **Piloto:** componentes administrativos, expedientes y modelos de datos en construcción; la existencia de una pantalla **no acredita** que su flujo ya esté listo para operar.
- **SQL:** estructura para Firebase Data Connect / Cloud SQL PostgreSQL versionada en `dataconnect/`. Aún debe provisionarse, migrarse, auditarse y probarse con cuentas de prueba y facturación autorizada. **No hay instancia SQL conectada ni migración de clientes implementada.**

No introducir pólizas reales, identificaciones, información sensible de clientes ni expedientes en el entorno hasta completar controles de seguridad, reglas publicadas y pruebas negativas de roles/usuarios.

## Navegación
- `/` o `/#/inicio`: web pública sin autenticación.
- `/#/acceso` y `/#/workspace`: panel con Firebase Authentication y autorización de empresa.
- `/#/registro`, `/#/mi-panel` y `/#/direccion/...`: rutas internas sujetas a verificación de permisos.
- `/#/demo`: retirada y redirigida al acceso privado.

## Desarrollo y validación
```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Arquitectura y normas
- Proyecto Firebase de integración: `seguros-d1a86`, con autenticación, Firestore y Storage.
- SQL Connect: `dataconnect/` y `dataconnect/README.md`. Operaciones administrativas SQL definidas como NO_ACCESS hasta implementar backend fiable.
- Seguridad: revisar `firestore.rules` y `storage.rules`, publicarlas con autorización y comprobarlas en emulador antes de permitir datos reales.
- Acceso empresarial: la UI es informativa; los permisos reales se aplican en backend y reglas.
- Credenciales sensibles: nunca en el repositorio ni en variables `VITE_*`.
- Contexto de funcionalidades: `EXECUTION_PLAN.md`, `INSURANCE_WORKFLOW.md`, `STAFF_ONBOARDING.md`, `PILOT_WORKSPACE.md`.

## Publicación única
- Única rama de producción: `main`.
- Proyecto de Vercel elegido: `seguros`; dominio temporal identificado en el dashboard: `seguros-green.vercel.app`.
- Despliegues Preview pertenecen a ramas; no compartir las URL efímeras como definitivas.
- Hay un proyecto duplicado `seguros-mknk` que debe desconectarse/eliminarse **después** de verificar producción y transferir cualquier configuración exclusiva. No crear terceros.
- Para la futura migración a dominio propio, agregarlo en Vercel Domains y Firebase Authentication Authorized domains; conservar `main` y el proyecto existente.
- Ver `DEPLOYMENT.md` para política operativa y verificaciones posteriores al despliegue.

**Estado:** integración de software lista para validación progresiva, no certificación para gestionar datos de clientes reales.
