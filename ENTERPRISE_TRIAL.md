# Entorno de validación de expedientes y emisión (no producción)

Implementación funcional conectada a Firebase SDK. PostgreSQL / SQL Connect sigue siendo el destino definitivo. La colección temporal está aislada de las colecciones legacy y de las de laboratorio; no se migran datos reales hasta aprobar políticas de conservación, backend y pruebas.

## Activación controlada
1. Durante los 40 días de construcción, el propietario autoriza usar seguros-d1a86 en colecciones experimentales separadas, exclusivamente con registros ficticios. No activar Cloud SQL. El modo de pruebas permanece desactivado por defecto; los ambientes de producción y pruebas deberán separarse antes de recibir datos reales.
2. Publicar y verificar firestore.rules y storage.rules en el proyecto autorizado. Las reglas del repositorio **no** se publican por GitHub/Vercel. Verificar permisos de Storage para consultar Firestore y CORS de descargas autenticadas (getBlob).
3. Dirección abre Clientes, confirma el uso exclusivo de datos ficticios y pulsa Habilitar pruebas. Se escribe companies/main/settings/enterpriseTrial.enabled=true. Sin este documento, no hay lecturas/escrituras nuevas. También se puede crear el documento desde la consola. Antes de uso comercial, desactivar, limpiar registros y migrar a SQL.
4. Crear cuentas de prueba verificadas y membresías con clientes y polizas: dos ventas, un operador, atención al cliente, dirección. La vista general corresponde a dirección/operaciones/servicio; ventas filtra ownerUid/agentUid en la consulta y en reglas.
5. Ejecutar el recorrido con nombres, imágenes y PDF sintéticos, jamás cédulas de personas reales ni pólizas reales.
6. Desactivar flag al terminar. El flag bloquea Firestore, no revoca por sí solo lecturas de objetos previos: Storage usa los dos documentos de autorización (membresía/solicitud); para cerrar el entorno completo, revocar miembros y bloquear la ruta enterpriseTrial en Storage. Limpiar objetos de prueba bajo administración.

## Alcance actual
- Registro con correo normalizado, teléfono, ciudad y propietario inmutable; no autoacceso de cliente. Fase 2 requiere vínculo Google/UID verificado y aprobado, previsto en la rama SQL.
- Expediente con los cinco logos, filtro de pólizas, historial y PDF original de prueba.
- Borrador con aseguradora, placa y tres imágenes separadas; captura móvil y archivo local. Envío, toma por operador, devolución con motivo, rechazo, resultado con PDF y aviso persistente por revisión para el agente, cola reactiva de emisión.
- Transacciones Firestore y reglas limitan las transiciones. El cliente verifica archivos con metadata y magic bytes; un cliente modificado aún puede falsificar referencias en Firestore. SQL/servidor confiable exigirá existencia, integridad y análisis de adjuntos, unicidad de póliza, auditoría inmutable y eliminación de huérfanos antes de producción.
- Acceso legacy de ventas a pólizas generales restringido en reglas del repo y consulta frontend; deben publicarse reglas para cerrar acceso por SDK.
- Los archivos previos se conservan bajo nombre único; no hay borrado desde el navegador ni links de descarga públicos usados por UI. Validar política de tokens de Storage antes de datos reales.
- Comisiones, conciliación, reglas de corte, integración Namecheap IMAP/SMTP y portal externo no operativos todavía. No hay fechas ficticias ni contraseñas de correo en frontend.

## Antes de producción
Pruebas negativas de lectura por ID, listados, archivos y transición; desactivación de rol; dos revisores simultáneos; MIME alterado y referencia inexistente; CORS y captura móvil; duplicado de póliza; verificación de historial, auditoría y recuperación. Migrar al backend de SQL Connect y probar las transacciones, nunca presentar esta fase como autorizada para datos reales.

## Cortes y documentos
El centro documental consolida los adjuntos ya registrados por expediente, aseguradora y tipo. Las vistas de finanzas solo suman registros explícitos por corte, fechas, agente y moneda con campos agentUid, policyId, insurerId, cutId, periodStart, periodEnd, currency, amountCents y paidCents. No inferir pagos ni generar reglas faltantes. Finanzas/Dirección consultan todos los registros permitidos; ventas consulta únicamente agentUid propio si se le habilita la vista finanzas. Antes de otorgar datos reales, pruebas de emulador obligatorias y conciliación del modelo SQL.

La CI de seguridad utiliza proyecto demo-acos-enterprise, sin acceso a recursos cloud. Las pruebas Firestore usan referencias sintéticas de adjuntos; no certifican la existencia de archivos ni reglas Storage, que aún deben probarse en emulador e integración.

## Publicación de interfaz
La interfaz puede desplegarse en el proyecto Vercel original, pero su flujo experimental queda bloqueado por defecto hasta que Dirección active el modo de pruebas y se publiquen las reglas aprobadas. La primera CI de seguridad excedió 1.000 expresiones de Rules; se refactorizaron las transiciones para ejecutar únicamente la rama aplicable. Aún no se certifica el acceso ni se publican reglas cloud.

## Control de la fase de validación
Se autorizó probar desde la plataforma actual con colecciones enterpriseClients y enterpriseIssuance aisladas. El interruptor no otorga nuevos roles ni publica reglas y no inicia Cloud SQL. El flujo documental requiere reglas Storage validadas y publicadas por el administrador en Firebase; no cargar cédulas auténticas incluso propias. Para apagar accesos a archivos existentes, revocar permisos de los usuarios de prueba o denegar la ruta enterpriseTrial en Storage. Se añadió una condición explícita resource == null contra sobrescrituras y se mantiene la prueba negativa. No fusionar datos de prueba con datos de clientes finales.

## Flujo consolidado de pólizas
Clientes incorpora datos personales de prueba, contacto, domicilio y correo para el futuro portal. La solicitud incorpora placa, marca, modelo, año, color, VIN/chasis y uso. Los nuevos campos opcionales profile y vehicle requieren publicar estas nuevas reglas de Firestore, manteniendo compatibilidad con registros previos. Pólizas muestra solo solicitudes de prueba ISSUED, permite filtrar por aseguradora y abrir la emisión. Los registros preliminares anteriores se conservan aparte sin cambiar su estado. La acción principal parte del cliente, luego vehículo, fotos clasificadas, revisión y PDF. Vista previa autenticada de imágenes usa Blob local, no URL permanente. Storage todavía necesita prueba y publicación de reglas y validación CORS. No usar documentos auténticos.
