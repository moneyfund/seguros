# ACOS · Cartera de referencia con aseguradoras de Nicaragua

## Fuente institucional
Catálogo estático consultado el 10 de noviembre de 2026 en la Superintendencia de Bancos y de Otras Instituciones Financieras (SIBOIF):
https://siboif.gob.ni/supervision/intendencia-seguros/instituciones

Contiene cinco instituciones de seguros autorizadas:
- INISER (registro 3101)
- ASSA, Compañía de Seguros, S.A. (3102)
- Compañía de Seguros América, S.A. (3103)
- Seguros Lafise, S.A. (3104)
- MAPFRE | SEGUROS NICARAGUA, S.A. (3105)

Nombres y resoluciones están en src/insurers.ts. El catálogo no acredita que ACOS sea un agente vinculado a ellas ni que cuente con APIs o acceso a su plataforma.

## Recorrido de reunión con Amy

1. Acceder con una cuenta de Dirección a la vista previa de la rama.
2. En el panel general pulsar "Abrir centro operativo", o usar #/laboratorio.
3. Abrir "Vista ejecutiva". Los indicadores muestran únicamente lo almacenado en las colecciones piloto.
4. Pulsar "Cargar cartera operativa ficticia" una sola vez, sin introducir datos personales de terceros.
5. Revisar el embudo comercial, la cola de servicio, las renovaciones y el historial de actividad.
6. En "Aseguradoras", consultar las cinco compañías listadas por SIBOIF y la cartera de prueba asociada a cada una. Pulsar "Registrar póliza de ejemplo".
7. En Clientes, abrir un expediente ficticio y seguir sus pólizas, oportunidades, comisiones y casos. Desde la ficha abrir acciones.
8. Crear una oportunidad seleccionando aseguradora de interés. Avanzar sus etapas.
9. Registrar una póliza de prueba vinculada a ese cliente y oportunidad; se calcula y guarda automáticamente una comisión ficticia.
10. Abrir una solicitud y resolverla; consultar Auditoría. Usar documentos ficticios de prueba si se desea mostrar subida.
11. Volver a Vista ejecutiva y confirmar que los indicadores cambiaron sin refrescar (onSnapshot).

## Reglas de separación
- Los nombres de las aseguradoras son reales, pero TODOS los nombres de clientes, números de póliza, fechas, primas, comisiones y casos de la semilla son ficticios.
- Ninguna acción emite o consulta una póliza real, envía mensajes a una aseguradora ni cotiza una cobertura.
- La segunda semilla es idempotente: pilotMeta/insurerPortfolioV2. Si ya se cargó, el sistema no duplica registros.
- Los datos previos de la primera semilla no se borran ni modifican; pueden coexistir.
- Solo Dirección puede leer/escribir pilotClients, pilotLeads, pilotPolicies, pilotCommissions, pilotTickets, pilotDocuments y pilotActivities según reglas publicadas.
- Los archivos de prueba se almacenan en Storage en el espacio pilotDocuments; nunca cargar cédulas reales.
- La integración de PostgreSQL y Firebase SQL Connect continúa como tarea separada. Este panel usa Firestore para los datos ficticios persistentes.

## Recomendaciones antes de producción
- Migrar el catálogo a tabla Insurer con clave, nombre legal, estado operativo y fecha de validación de SIBOIF.
- Añadir vigencia de relaciones comerciales por aseguradora, autorización de agentes, versionado del catálogo y conciliación.
- No tratar "Vigente" en la semilla como confirmación de cobertura externa.
- Probar reglas Firestore/Storage en emuladores; no publicar cargas de documentos personales hasta completar pruebas de privacidad.
