# ACOS — política de despliegues y acceso

Proyecto: `moneyfund/seguros`. Aplicación React + Vite. Esta política rige el proyecto **real** de ACOS, no la antigua demostración.

## Único proyecto de Vercel y URL estable
- Mantener **un solo proyecto Vercel** vinculado al repositorio. No crear un proyecto nuevo por cada actualización.
- Rama de producción: `main`. Las mejoras se realizan en ramas de trabajo y se validan en despliegues Preview antes de fusionarse a producción.
- Compartir **únicamente el dominio de producción** asignado en Vercel → Project → Settings → Domains (por ejemplo, un dominio propio o el `<nombre-proyecto>.vercel.app` que muestre el panel). **Nunca** compartir como URL definitiva los enlaces únicos con un hash generado por despliegue.
- En Settings → Deployment Protection, configurar la web de producción para que sea pública. Se recomienda **Standard Protection** si se desea restringir previews; también se puede desactivar Vercel Authentication para el proyecto según necesidades. No utilizar `All Deployments` si la web comercial debe ser pública.
- No activar protección pública de los paneles mediante Vercel Authentication: la seguridad interna debe estar en Firebase Authentication y reglas de acceso verificadas para cada rol.

## Autenticación Firebase
- Firebase Project: `seguros-d1a86`.
- Autorizar en Firebase Console → Authentication → Settings → Authorized domains **solo el dominio estable de producción** usado por los visitantes (y los dominios de desarrollo estrictamente necesarios). No agregar cada URL por commit.
- La web comercial está en `/` y `/#/inicio`, y no debe requerir iniciar sesión.
- El acceso privado está en `/#/acceso` y `/#/workspace`; requiere autenticación y permisos verificados desde Firebase. El ocultamiento visual de elementos no es control de acceso.

## Publicación y seguridad
1. Confirmar el proyecto correcto, repositorio `moneyfund/seguros`, rama `main` y dominio de producción **antes** de publicar.
2. Validar `npm run typecheck` y `npm run build` y verificar que las rutas y los recursos cargan.
3. Validar la web pública en incógnito y comprobar que **no solicita cuenta de Vercel**.
4. Probar inicio de sesión en el dominio estable y acceso solo a las áreas autorizadas.
5. No cargar expedientes reales, documentos ni datos sensibles hasta publicar y auditar las reglas de Firestore y Storage, restricciones de roles, registros de auditoría y respaldos.
6. Mantener desarrollo/pruebas separado de producción; ante una falla, volver a una versión de producción verificada.

**Nota:** Vercel Hobby está limitado por sus términos a uso personal y no comercial; contratar un plan adecuado antes de la explotación comercial de ACOS.

**Dirección de producción verificada:** pendiente de asignación/confirmación en Vercel. No inventar ni anunciar una URL hasta verificar el dominio y el despliegue.
