# ACOS — Operación empresarial v2 (13 noviembre 2026)

Base de construcción, no certificación de producción. No activar Cloud SQL, cargar cédulas reales ni integrar correos sin validación previa. El expediente de cliente es la raíz de las relaciones comerciales.

## Paneles y autorización de servidor

| Área | Lectura | Escritura |
|---|---|---|
| Dirección / administración | Cartera general, emisión, finanzas, personal, auditoría | Gestión autorizada; las transiciones tienen reglas |
| Ventas | Solo sus clientes asignados, solicitudes y sus pólizas, documentos permitidos, comisiones propias | Registrar cliente propio, borradores, documentos, envío y corrección de sus solicitudes |
| Sistemas / emisión | Cartera general y cola de emisión | Tomar solicitud, revisar, pedir corrección, emitir externamente, registrar póliza y adjuntar PDF original |
| Atención al cliente | Cartera general, pólizas, expedientes y documentos necesarios para servicio | Casos, seguimiento, renovaciones según concesión; no emitir ni liquidar |
| Finanzas | Pólizas y datos financieros necesarios de la cartera | Conciliar cortes y registrar pagos; no acceso automático a cédulas |
| Supervisión | Equipo/cartera expresamente asignados | Según concesión |
| Portal cliente (etapa 2) | Solo expedientes vinculados al UID y documentos compartidos | Solicitudes de servicio según futura definición |

Roles + vista autorizada + empresa + relación con expediente se comprueban en cada operación. Agente nunca recibe registros ajenos y filtra solo sobre los registros que el servidor autoriza. No conceder roles de empleado a clientes. Reasignación de clientes solo por dirección y con auditoría; confirmar con ACOS qué acceso histórico conserva el agente anterior (por defecto no conserva acceso al expediente). Su registro de comisión propia se mantiene.

**Bloqueo conocido del legado:** Firestore permite hoy lectura general de pólizas al rol ventas; los documentos legacy se agrupan por UID, no por expediente. No reutilizar ni publicar como autorización de producción. Migrar el adaptador y reglas antes de admitir datos reales.

## Expediente

Cliente con propietario comercial, contacto, historial, solicitudes, documentos, casos, renovaciones y pólizas. Mostrar todas las aseguradoras del catálogo con sus logos originales, cantidad de pólizas registradas por aseguradora y estado/fecha de cada póliza al seleccionar. No confundir registros con cobertura confirmada. No exponer datos financieros fuera de permisos.

Etapa 2: portal apagado por defecto; correo del expediente normalizado y verificado con Google, verificación inicial de identidad y aprobación de asociación al expediente por canal confiable; vincular UID estable, no email como autorización permanente. No autoasignar por coincidencia de email; tratar duplicados, correos compartidos, cambios y revocación. Mostrar solo PDF y documentos publicados expresamente al cliente, no cédulas ni notas internas por defecto.

## Emisión vehicular obligatoria

1. Registrar o seleccionar un cliente autorizado. Seleccionar aseguradora, producto y vehículo.
2. Borrador: capturar cámara o adjuntar cédula frente, cédula reverso, foto de circulación. Clasificar cada archivo. Requisitos configurables por producto/aseguradora; estos tres son la base solicitada, no afirmar que todas las aseguradoras tienen requisitos idénticos.
3. Validar tipo real de archivo, tamaño, escaneo antimalware, existencia y pertenencia de cada adjunto; envío idempotente y transaccional. Registrar auditoría y notificación a Emisión.
4. Operador toma trámite y emite en sistema externo de la aseguradora. Puede devolver con motivo de corrección; agente corrige y reenvía.
5. Operador registra número de póliza original, vigencia, prima y moneda, adjunta PDF original de la aseguradora (sin generar otro PDF ni simular emisión). Transacción crea/vincula póliza, actualiza solicitud y emite notificación al agente. El agente descarga/imprime en móvil o PC.
6. Estados propuestos: DRAFT → SUBMITTED → IN_REVIEW → NEEDS_CORRECTION → SUBMITTED; IN_REVIEW → ISSUED o REJECTED. DRAFT → CANCELLED; otras cancelaciones solo por regla explícita. Control de revisión para conflictos concurrentes. Notificaciones persistentes y contador no leído por usuario; sin datos sensibles en título o push.

## Almacenamiento y auditoría

Ruta conceptual companies/{companyId}/customers/{customerId}/issuance/{requestId}/{documentId}/{version}.{ext}. Metadatos SQL vinculados a expediente/solicitud/póliza, tipo, hash, versión, autor y fecha; identificación no aparece en nombres de archivo. No enlaces públicos permanentes. Descargas autenticadas, comprobación de acceso al recurso en backend y registro de actor; URLs firmadas de corta duración si se requieren. No confiar en rutas, MIME declarado, UID o rol enviados por navegador. Evitar documentos huérfanos con staging y limpieza programada. Storage no puede consultar SQL Connect directamente en sus rules; usar backend autorizado para transferencias o ACL sincronizada y probada. Conservar historial, política de retención y recuperación pendientes de acordar con ACOS. Todo el repositorio es público: sin secretos ni información real.

## Cortes y comisiones

Reglas versionadas por aseguradora, vigencia, fecha de corte, base de cálculo y moneda. Amy facilitará reglas reales; no fijar días, porcentajes ni fórmulas ficticias. Período muestra conteo de pólizas elegibles y agente, importe generado, aprobado, pagado, saldo y fecha de pago. Pagos parciales por asignaciones, conciliación de reversos y duplicados; impedir sobrepagos y cruce de moneda o agente. Cerrar corte con snapshot/auditoría. Definir con Amy cancelaciones, devolución de prima, ajustes, base neta/bruta, fecha de emisión vs cobro y forma de liquidación. No reconocer una comisión automáticamente como cobrada al emitir.

## Correo corporativo

Bandeja de empresa para mensajes laborales autorizados; no importar Gmail personal ni monitorizar cuentas privadas. Preferir buzón corporativo compartido o correo enviado desde ACOS con autor registrado. Si el proveedor es Gmail/Workspace, integración OAuth/API de alcance mínimo y autorización corporativa; si es otro proveedor, adaptar por backend. Registro de enviado, destinatarios, fecha, estado y vínculo autorizado al expediente. No registrar contraseñas, tokens ni contenido sensible en GitHub. Credenciales en Secret Manager. Confirmar con ACOS proveedor, buzones, delegación, alcance y política de retención antes de habilitar sincronización y adjuntos.

## Pruebas de aceptación obligatorias (antes de producción)

- Agente A crea cliente, sube tres adjuntos ficticios, envía; operador recibe alerta y revisa; pide corrección; A corrige; operador sube PDF ficticio y registra póliza; A recibe alerta, abre PDF e imprime.
- Agente B no lista ni lee/descarga cliente, póliza, solicitud, archivo, comisión de A, incluso por ID directo. Acceso de operador y atención según matriz; finanzas no lee documentos de identidad sin autorización específica.
- Repetición de envío, doble operador, doble emisión, adjunto faltante y manipulación de empresa/cliente/actor: rechazo o idempotencia, sin desdoblar pólizas.
- Portal apagado; cuenta Google con email ajeno/no verificado, correo compartido ambiguo y UID revocado no acceden; UID aprobado solo ve documentos compartidos. Probar cambios de correo y revocación.
- Comisión no se liquida dos veces; pago parcial, regla nueva, límites de corte, distintas monedas, póliza cancelada y ajuste.
- Notificación de un tercero, archivo incompatible o suplantación de rol: denegado. Sin tokens públicos de archivos. Pruebas negativas en emuladores.
- Integración de correo deshabilitada hasta autorización y configuración; identificar autor de mensajes corporativos sin acceder a buzones privados.

## Orden de desarrollo

A. Validación SQL local (schema + SDK) y backend controlado; permisos y contratos primero.
B. Expedientes y UI por aseguradora (vista previa del laboratorio en esta rama; datos ficticios).
C. Registro cliente y flujo emisión con archivos, notificaciones y auditoría; pruebas móviles.
D. Finanzas y cortes con datos de Amy.
E. Correo corporativo autorizado; portal de clientes en etapa 2. 
F. Al superar pruebas, aprobar migración y aprovisionamiento Cloud SQL por separado; una sola publicación de producción de Vercel.
