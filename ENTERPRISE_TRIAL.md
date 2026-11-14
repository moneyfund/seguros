# Entorno de validación de expedientes y emisión (no producción)

Implementación funcional conectada a Firebase SDK. PostgreSQL / SQL Connect sigue siendo el destino definitivo. La colección temporal está aislada de las colecciones legacy y de las de laboratorio; no se migran datos reales hasta aprobar políticas de conservación, backend y pruebas.

## Activación controlada
1. Utilizar un proyecto Firebase de prueba separado y configurar las variables VITE_FIREBASE_* de una rama de validación, no sustituir credenciales reales.
2. Publicar y verificar firestore.rules y storage.rules en ese proyecto. Las reglas del repositorio **no** se publican por GitHub/Vercel. Verificar permisos de Storage para consultar Firestore y CORS de descargas autenticadas (getBlob).
3. Crear mediante la consola el documento companies/main/settings/enterpriseTrial con enabled (boolean) = true. Sin este documento, no hay lecturas/escrituras de expedientes ni solicitudes nuevas. No habilitarlo en el proyecto productivo.
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
