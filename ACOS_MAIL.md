# ACOS Mail — conexión corporativa

## Estado y alcance
Interfaz privada real, API de servidor con IMAP/SMTP Namecheap, bandejas, encabezados, lectura de texto, adjuntos, composición, respuesta, borradores nuevos, marcado de lectura y supervisión de Dirección. No se crean mensajes de demostración en producción. No existe conexión activa hasta que se compren y configuren los buzones. El proveedor conserva los mensajes, no Firestore ni SQL.

## Activación (responsable autorizado)
1. Comprar el dominio empresarial, verificar que pertenece a ACOS y contratar Private Email. Crear exclusivamente cuentas corporativas, personales de trabajo y/o compartidas por departamento. Configurar los registros MX, SPF, DKIM y DMARC indicados en el panel de Namecheap, sin sobreescribir otros servicios sin revisar.
2. Habilitar IMAP/SMTP en "Connect third-party apps"; generar contraseñas de aplicación por buzón. Namecheap: mail.privateemail.com, IMAP 993 TLS, SMTP 465 TLS. No usar las claves maestras ni enviar secretos por chat.
3. Comunicar a todos los colaboradores la política de uso corporativo, alcance de supervisión, finalidades, responsables, retención y canales para asuntos privados. Documentar la autorización de cada buzón supervisado y cumplir las obligaciones laborales y de privacidad aplicables. No conectar cuentas personales. Activar monitoringApproved solo después.
4. En Vercel > proyecto seguros > Settings > Environment Variables, crear variables **servidor, Production**, nunca VITE_:
   - ACOS_MAIL_ENABLED=false mientras se configura.
   - ACOS_MAIL_DOMAIN=<dominio corporativo verificado>.
   - ACOS_MAILBOXES_JSON=<registro privado JSON>. Cada elemento incluye id, label, address, department, uids (UID de Firebase de usuarios autorizados), password (contraseña de aplicación) y monitoringApproved (booleano). Los buzones compartidos solo para colaboradores explícitamente autorizados. No copiar ningún secreto a GitHub. Ejemplo de estructura sin contraseña real:
     [{"id":"ventas","label":"Ventas","department":"ventas","address":"ventas@empresa.example","uids":["UID_FIREBASE_AUTORIZADO"],"password":"<APP_PASSWORD>","monitoringApproved":false}]
   - Solo si se usa un proyecto Firebase distinto: ACOS_MAIL_FIREBASE_PROJECT y ACOS_MAIL_FIREBASE_API_KEY, coherentes con el frontend. Por defecto usa el proyecto ACOS y su clave pública.
5. Copiar y publicar firestore.rules de la revisión ACOS Mail. El nuevo match /companies/main/mailAudit/{auditId} solo permite a propietarios verificados crear/leer registros, con UID autenticado y timestamp del servidor, sin editar/borrar. No activar la supervisión hasta validarlo. Estos registros son append-only para clientes y no constituyen auditoría inviolable contra el administrador de infraestructura; migrar a registro servidor inmutable antes de operación formal.
6. Establecer ACOS_MAIL_ENABLED=true y redesplegar una sola vez. Comprobar autenticación, acceso cruzado, conexión IMAP, carpeta Sent/Drafts, envío entre dos cuentas de prueba, recepción y revocación de usuario. Verificar credenciales/dominio de cada cuenta antes de habilitar. Si nombres de carpetas son distintos, añadir folders en cada buzón con claves inbox/sent/drafts/archive/spam/trash; servidor valida nombres. Comprobar duplicación de copia de Enviados según proveedor.
7. Supervisión: el propietario accede a #/direccion/correo, selecciona área/colaborador/buzón autorizado, indica motivo, abre y consulta mensajes. API exige autorización de monitoreo y registro exitoso previo a cada listado/lectura/adjunto; no puede enviar, guardar ni modificar mensajes bajo supervisión. Personal accede a #/modulo/correo; clientes excluidos. No se monitorizan cuentas Gmail personales ni se usan sus contraseñas para iniciar sesión.

## Límites de esta versión
- Hasta 30 encabezados por página; búsqueda local en esa página. No hay búsqueda IMAP global ni sincronización automática/notificaciones push. La lista obtiene encabezados sin leer el cuerpo y los mensajes se abren bajo demanda.
- Mensajes completos de hasta 3 MB; hasta 5 adjuntos, total 2 MB por envío. Adjuntos de descarga hasta 2 MB. Para mayores, usar webmail de Namecheap. No se renderiza HTML remoto ni píxeles de rastreo. No ejecutar archivos descargados; escaneo antivirus y controles de retención antes de producción.
- Borradores nuevos persistidos en IMAP; editar como un nuevo borrador, no elimina el anterior. Archivo, spam y papelera son consultas, no movimientos ni eliminación. Cerrar sesión o cambiar de módulo pierde el borrador sin guardar. No guardar secretos ni contenido en localStorage.
- Sin reintentos SMTP automáticos: si la confirmación se pierde, revisar Enviados y proveedor. El resultado distingue aceptación SMTP, rechazo parcial y fallo al guardar copia. No acredita entrega definitiva.
- Python stdlib en función Vercel, sin dependencias externas. El runtime y los protocolos deben comprobarse tras disponer del dominio y credenciales. No se han realizado operaciones contra Namecheap ni adquirido servicios.
- Revisar límites del plan Vercel comercial, rate limiting, coste y protección de credenciales antes del lanzamiento.
