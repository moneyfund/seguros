# ACOS — web pública editorial

Rama de base: `feature/acos-enterprise-core-sql-20261109` (`275605d`).
Rama de revisión: `feature/acos-public-editorial-20261110`.

## Dirección y alcance

Composición central de arquitectura vectorial que representa protección, verde profundo y plata, Manrope e Instrument Serif servidas localmente con sus licencias. Se conserva exactamente el archivo de marca original. Se reemplaza la presentación pública, con seis categorías interactivas y secciones de empresa, acompañamiento, proceso de cinco etapas, infraestructura digital y contacto.

Los estilos nuevos están limitados a `.acos-public`. No cambian las rutas de `App.tsx`, la raíz empresarial, los componentes privados, las reglas, los roles, Firebase ni Data Connect. No se añadieron dependencias de la aplicación. Las imágenes de aseguradoras permanecen en el repositorio y el sistema privado; no se anuncian vínculos comerciales no confirmados en la web pública.

## Entradas

- Web pública: `#/inicio` y `#/web`.
- Secciones: `#/inicio/nosotros`, `#/inicio/soluciones`, `#/inicio/empresas`, `#/inicio/proceso`, `#/inicio/contacto`.
- Anclas anteriores conservadas: `#inicio`, `#servicios`, `#filosofia`, `#proceso`, `#contacto`.
- Acceso empresarial: raíz y `#/acceso`. Registro, aprobaciones y panel conservan sus rutas anteriores. Los accesos heredados demo/dashboard/admin siguen normalizándose al acceso autenticado.

## Contactos por confirmar

Editar únicamente `publicContact` en `src/public-site-config.ts` con canales autorizados por ACOS. Correo, teléfono, WhatsApp y dirección están vacíos de forma deliberada. Los datos de inicio de sesión del personal no son contactos comerciales.

Sin canales configurados, los CTA abren una consulta contextual y copiable. Se informa expresamente que no se envía ni guarda una solicitud. Si se confirma un canal, aparecerá el enlace a correo, teléfono o WhatsApp correspondiente. No existe formulario con confirmación falsa ni escritura en el sistema privado.

La plataforma digital se identifica como en desarrollo y el portal de clientes como no disponible. Las categorías de seguros son orientativas, sujetas a evaluación, disponibilidad y condiciones de la aseguradora.

## Verificación realizada

- `npm run typecheck`: correcto.
- `npm run build`: correcto. La advertencia de chunk superior a 500 kB ya existía en la base; la carga conjunta de la aplicación privada se conserva para no ampliar el alcance de esta intervención.
- `git diff --check`: correcto.
- GitHub Actions `build`: correcto para el primer commit publicado.
- El despliegue automático en el proyecto existente `seguros` llegó a Ready. No se creó un proyecto adicional ni se fusionó a `main`. La integración del repositorio ya despliega también a `seguros-mknk`.

Pruebas funcionales sobre el JavaScript compilado en un DOM en memoria: **11 grupos correctos, sin errores de ejecución**.

1. Portada y seis categorías.
2. Panel y consulta contextual de cada categoría.
3. Teclado: Home, End y flechas con recorrido circular.
4. Ausencia de canales de contacto inventados.
5. Copia del mensaje y ausencia de confirmación de envío.
6. Alternativa de copia manual cuando se deniega el portapapeles.
7. Apertura/cierre del aviso de privacidad y restauración del desplazamiento.
8. Apertura/cierre del menú y Escape.
9. Rutas públicas nuevas y heredadas.
10. Rutas empresariales conservan el formulario de autenticación; rutas antiguas se normalizan.
11. Regreso del acceso empresarial al sitio público.

## Revisión pendiente

La vista previa requiere Vercel Authentication. La conexión disponible no tiene autorizado el proyecto `seguros`; no fue posible obtener acceso para inspeccionarla. No se cambió Deployment Protection.

**No se da por concluida la revisión visual/responsive ni la auditoría de accesibilidad en navegador.** Las pruebas en memoria no comprueban distribución, contraste renderizado, desbordamientos, foco nativo de `<dialog>` ni interacción táctil. El CSS incluye adaptaciones para móvil/tableta/escritorio y `prefers-reduced-motion`, pendientes de inspección visual real.

La autenticación real, las aprobaciones y los permisos de cuentas privadas no se ejercitaron. Se comprobó la conservación de los archivos y el acceso sin sesión, sin crear usuarios ni registros.

Después de autorizar el proyecto en la conexión de Vercel, revisar a 320, 390, 768, 1024 y 1440 px: portada, todas las secciones, selector, menú, consultas, privacidad, historial, regreso al sistema privado y preferencia de movimiento reducido.
