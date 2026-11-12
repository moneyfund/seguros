# ACOS · Incorporación y autorización de personal (propuesta de fase 1)

## Qué incorpora esta rama
- Solicitud con Google/Firebase Auth (correo verificado), nombre, teléfono, área solicitada, foto y cédula.
- Solicitudes con estados draft / pending / approved / rejected.
- Administración de solicitudes y revisión de documentos desde el panel de Dirección.
- Asignación de departamento, código de empleado, uno o varios roles y lista de vistas.
- Edición de vistas y roles de colaboradores autorizados.
- Reglas versionadas para proteger documentos de incorporación y evitar autoasignación de privilegios.

## Política de correos
**No está permitido recolectar cédulas hasta configurar y verificar la propiedad del dominio institucional.**

1. Adquirir el dominio definitivo con autorización empresarial.
2. Configurar un servicio de correo empresarial (se recomienda evaluar Google Workspace).
3. Crear cuentas corporativas individuales administradas por ACOS.
4. Definir VITE_ACOS_STAFF_DOMAIN en Vercel con el dominio real (sin @).
5. Crear el documento Firestore /companies/main/settings/staffIdentity con { domain: "dominio-real" } mediante una cuenta administrativa.
6. Verificar Google Sign-In y Firebase Auth con usuarios de prueba del dominio.
7. Publicar reglas firestore.rules y storage.rules únicamente después de ejecutar pruebas del emulador y revisión de permisos.
8. Habilitar App Check, cuotas de subida y políticas de retención de documentos antes del uso real.

## Protección de datos
- En el cliente se comprueban formatos y tamaños, pero los requisitos definitivos los aplican Storage/Firestore Rules.
- Un empleado sin aprobar solo puede subir y leer archivos en su propio expediente durante su solicitud. Dirección puede leerlos.
- Los archivos se descargan como blobs autenticados; no se generan URLs persistentes de descarga con tokens.
- La foto y la identificación se almacenan fuera de los archivos públicos de la web.
- Debe definirse una política de consentimiento, caducidad, retención y eliminación de cédulas con el cliente.
- La rama no instala ni cambia las reglas reales de Firebase Console.

## Avisos al personal
La aprobación deja notificationStatus = pending_configuration. No significa que se haya enviado un correo.
Para la entrega automática se requiere un proceso privilegiado (p. ej. Cloud Functions + proveedor transaccional con dominio validado) y un registro auditable de entrega. Nunca se deben enviar correos desde el navegador con credenciales SMTP.

## Áreas, roles y permisos
- Department: adscripción organizativa del colaborador.
- Roles: capacidades operativas delegadas por dirección (puede tener más de uno).
- allowedSections: subconjunto de las vistas permitidas para esos roles.
- El menú no confiere autoridad para acceder a datos; las reglas del servidor son la fuente de control. Algunas pantallas actuales siguen usando reglas del rol primario y requerirán integración posterior con el modelo SQL definitivo.
- Código automático tipo VEN-XXXXXXXX, basado en un identificador estable de empleado; es provisional hasta tener una secuencia y restricción UNIQUE en PostgreSQL.

## Pruebas obligatorias antes de producción
- Cuenta ajena al dominio no puede crear solicitudes ni subir archivos.
- Solicitante puede leer solo su propia solicitud y sus archivos.
- Solicitante no puede editar estado approved ni otorgarse permisos.
- Usuario pendiente no puede acceder a CRM, pólizas o equipo.
- Dirección puede revisar y aprobar; ningún otro rol puede aprobar.
- Descarga de cédula es inaccesible a otros agentes.
- Todas las vistas asignadas deben respetar la autorización de datos y los límites de cada rol.
- Cambiar el email del proveedor no debe permitir acceso residual.
- Una solicitud interrumpida puede reanudarse y completar sus archivos.
- Login, preview y upload funcionan en Windows y Android; iOS se prueba por separado.

## Advertencia
Esta rama es una propuesta técnica que debe revisarse en PR. No integrar a producción ni subir datos reales hasta comprobar reglas, conexión de Firebase y el dominio institucional. Los cambios no configuran PostgreSQL ni un servicio de email automático.
