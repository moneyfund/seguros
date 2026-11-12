# ACOS · Laboratorio operativo (datos ficticios)

## Objetivo
Demostrar procesos reales, con persistencia y eventos en tiempo real, sin introducir datos personales de clientes ni documentos auténticos. La interfaz utiliza Firestore y Firebase Storage; no simula guardados. Las operaciones necesitarán las reglas de seguridad verificadas y publicadas.

## Dependencia
Esta rama parte de la propuesta de incorporación y roles del PR #1. No fusionar en main sin incorporar primero ese PR o rebasar el trabajo.

## Acceso y recorrido
- Entrar al portal con una cuenta administrativa verificada.
- En el menú lateral, seleccionar Laboratorio operativo (sólo dirección).
- Presionar Cargar escenario de prueba una sola vez. Los nombres, correos, aseguradoras y cifras son ficticios.
- Crear un cliente; asociar una oportunidad; avanzar su estado; crear una póliza y comisión; abrir y resolver una solicitud; adjuntar un PDF ficticio.
- Recargar la página: los registros persisten en Firestore y se actualizan mediante onSnapshot.

## Aislamiento
Colecciones exclusivas:
- companies/main/pilotClients
- companies/main/pilotLeads
- companies/main/pilotPolicies
- companies/main/pilotCommissions
- companies/main/pilotTickets
- companies/main/pilotDocuments
- companies/main/pilotActivities
- companies/main/pilotMeta

Los archivos se almacenan bajo companies/main/pilotDocuments/{ownerUid}/{uuid}.{ext}. Cada documento tiene isPilot=true. Las reglas del servidor permiten consultar y modificar únicamente a los propietarios administrativos.

## Funciones
1. Clientes de prueba con seguimiento por oportunidad, póliza y documentos.
2. Embudo comercial y transición de estados.
3. Registro de pólizas con aseguradora, vigencias, prima y tasa de comisión.
4. Cálculo de comisión y cierre de oportunidad vinculada al guardar una póliza.
5. Solicitudes de atención con resolución y actividad registrada.
6. Documentos de prueba: PDF/imágenes, usuario que subió, cliente y póliza asociada, descarga autenticada.
7. Panel de indicadores basados en datos guardados, actualizado en vivo.
8. Bitácora de eventos con usuario autenticado y hora de servidor.
9. Escenario ficticio precargable de forma idempotente mediante una transacción.

## Fuera de alcance
- PostgreSQL / Firebase SQL Connect no conectado aún; es un piloto con persistencia real en Firestore.
- Sin integración con Namecheap ni envío de correos.
- Sin emisión legal de pólizas.
- Sin acceso a módulos piloto para empleados ni asegurados externos.
- No introducir datos reales ni documentos de identidad auténticos.

## Antes de usarlo con Amy
1. Validar reglas en Firebase Emulator Suite y publicar sólo las versiones aprobadas.
2. Verificar conexión al proyecto Firebase deseado.
3. Abrir dos sesiones administrativas y comprobar sincronización.
4. Confirmar que usuarios no autorizados reciben error permission-denied.
5. Confirmar que getBlob permite descargar archivos autorizados y que Storage tiene configuración CORS necesaria.
6. Verificar relaciones, cálculo de comisión y atribución de subidas.
7. No introducir información auténtica hasta construir la infraestructura final y efectuar pruebas formales de seguridad.

## Evolución
El dominio está encapsulado en pilotData.ts. Podemos sustituir el adaptador Firestore por uno tipado de Firebase SQL Connect al completar PostgreSQL y el modelo relacional, preservando la interfaz.
