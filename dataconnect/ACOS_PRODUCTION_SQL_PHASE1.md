# ACOS · Base SQL definitiva — fase 1 (24 de noviembre de 2026)

**Estado real:** esquema relacional versionado en GitHub; NO confirma instancia Cloud SQL creada, migración ejecutada, SDK generado, endpoints conectados ni datos reales cargados.

## 1. Decisiones de arquitectura vigentes

- Repositorio único: moneyfund/seguros. Firebase: seguros-d1a86.
- Plataforma web React/Vite en Vercel, Auth de Firebase, archivos privados en Storage y datos operativos transicionales en Firestore.
- Fuente de verdad relacional objetivo: PostgreSQL administrado por Cloud SQL + Firebase Data Connect.
- NO crear otra plataforma, NO reinicializar la base, NO importar información de clientes ni sembrar registros demo.
- Empleados podrán ejercer varias funciones: un miembro primario + asignaciones a múltiples departamentos + varios roles + concesiones por acción y alcance + excepciones explícitas.
- Administración general exclusiva de **Amy y su esposo** una vez hecho el alta/verificación por UID. Los colaboradores y administradores departamentales no heredan acceso global por usar la misma empresa.
- Administrador departamental: puede operar su área y su buzón asignado. No puede leer buzones de otras áreas ni otorgarse permisos.
- Agentes: sus propios clientes/expedientes, pólizas, comisiones y tareas expresamente asignadas; colaboración por delegación trazable.
- Dirección general puede supervisar departamentos y buzones corporativos, **con auditoría de lectura/acción**, no de forma invisible.
- Empezamos con Gmail para acceso mediante Firebase Authentication. Los buzones corporativos y su conexión Namecheap se difieren hasta que ACOS defina la estructura.

## 2. Tablas nuevas incluidas en esta rama

### Estructura, RBAC y ABAC
- MemberDepartment: asignación de uno o varios departamentos, con marcador de administrador DE ESA área.
- AccessPermission: catálogo de pares módulo/acción.
- RolePermission: permisos por rol con alcance OWN, ASSIGNED, DEPARTMENT o COMPANY.
- MemberPermissionOverride: concesión o denegación extraordinaria por persona; DENY prevalece y admite caducidad.
- CustomerAssignment: relación de acceso delegado a clientes sin transferir titularidad del agente.
- MailboxDelegation: permisos de lectura/envío en buzones sin crear cuentas de correo.
- AccessAuditEntry: metadatos de acciones sensibles, sin guardar cuerpos de correo ni números de identificación.

### Tramitación de emisiones
- InsuredVehicle: vehículo asegurado vinculado a cliente.
- IssuanceDocumentRequirement: catálogo configurable de documentación requerida por aseguradora/producto.
- IssuanceRequest: expediente del agente, cola de Emisiones, asignación, estado y revisión.
- IssuanceAttachment: referencia al documento vigente por tipo.
- IssuanceAttachmentVersion: versiones históricas sin sobrescribir el original.
- IssuanceStatusEvent: transición de estado inmutable por revisión.
- IssuancePolicyLink: relación uno a uno con InsurancePolicy existente.
- InboxNotification: notificaciones internas por destinatario e idempotencia.

Se preservan TODAS las tablas originales. La definición está en dataconnect/schema/*.gql. No existe acceso de navegador abierto a estas nuevas tablas por defecto.

## 3. Matriz de permisos — interpretación del backend

| Perfil | Permiso y alcance |
| --- | --- |
| Dirección general | Grants COMPANY explícitos, únicamente a miembros aprobados; supervisión de buzones auditada |
| Administrador de área | Grants DEPARTMENT únicamente para áreas de asignación activa |
| Comercial/agente | OWN y ASSIGNED, sujeto a permisos de módulo, siempre dentro de ACOS |
| Emisiones | DEPARTMENT sobre solicitudes y documentos de su cola |
| Colaboración entre áreas | Rol adicional y/o override ALLOW explícito, registrando quién lo concedió y por qué |
| Usuario suspendido | Cero operaciones, aunque conserve una sesión web abierta |
| Cliente externo (fase 2) | No habilitado en esta entrega |

**Reglas obligatorias para cualquier operación real en SQL:**
1. El servidor verifica el ID token Firebase y el correo verificado, obtiene su UID y vuelve a leer la membresía ACTIVA en la base.
2. La compañía destino sale de la membresía del servidor, nunca de un selector confiado al navegador.
3. La empresa de cada relación (cliente, póliza, departamento, miembro, expediente, documento, buzón) DEBE coincidir; las claves foráneas por sí solas no impiden asociaciones entre empresas.
4. DENY explícito prevalece; un usuario solo obtiene un grant mediante un flujo privilegiado y auditado.
5. El alcance COMPANY para operaciones sensibles requiere delegación de Dirección; departmentAdmin no es autorización automática.
6. Se registra el actor, acción, recurso y decisión; las lecturas de buzones por Dirección son auditables.
7. Cuando cambia una membresía o un permiso, la autorización se recalcula desde datos vigentes; nunca se usa una lista de permisos cacheada indefinidamente.
8. Los documentos se entregan mediante reglas de Storage aprobadas o acceso mediado por el servidor. No se publican enlaces permanentes.

El módulo server/accessPolicy.mjs implementa **solo el cálculo puro de autorización** para uso futuro en backend verificado. No está conectado todavía a consultas SQL ni a la UI actual y no autoriza por sí solo subir documentos reales.

## 4. Flujo transaccional a implementar

1. Agente crea cliente o selecciona cliente propio/asignado.
2. Crea expediente DRAFT y relaciona aseguradora, producto y vehículo, si aplica.
3. Adjunta por tipo cada documento privado requerido (por ejemplo, frente/reverso de identificación y circulación cuando corresponda); metadata va a SQL y binarios a Storage.
4. Al enviar, backend valida requisitos, permisos, tamaño/tipo de documentos, pertenencia a empresa y versión del expediente. Pasa a SUBMITTED, registra evento y notifica a Emisiones **en una misma transacción**.
5. Emisiones revisa; puede pasar a REVIEWING y CORRECTION_REQUIRED con motivo, devolviendo al agente.
6. El agente corrige anexos creando una nueva versión auditable y reenvía.
7. Tras verificación, Emisiones registra póliza auténtica, adjunta PDF auténtico, vincula IssuancePolicyLink y pasa a ISSUED; notifica al agente.
8. Agente accede al expediente y estado actualizado. No existe emisión automática de una póliza por cambiar un estado en pantalla.

Los estados permitidos, transiciones, restricciones sobre pólizas emitidas y las transacciones del servidor deben codificarse y probarse antes de habilitar escritura.

## 5. Deuda técnica localizada (NO resuelta aún)

- src/backend.ts, enterpriseTrial.ts y componentes usan colecciones Firestore; una interfaz que parece funcional no implica que use PostgreSQL.
- src/firebase.ts mantiene un **allowlist temporal de administración** con norvingarcia220@gmail.com y amyblandon171@gmail.com. Contradice la gobernanza final exclusiva de Amy/esposo: planificar transición a roles por UID **sin bloquear las cuentas actuales** y realizar pruebas antes de retirarlo.
- CompanyMember exige un departamento primario; MemberDepartment añade áreas secundarias sin romper el modelo antiguo.
- El PR #6 contiene una propuesta previa y parcialmente solapada de emisión; no fusionarla junto con esta rama sin rebase/deduplicación y revisión.
- El correo Namecheap no debe integrarse ni almacenar credenciales hasta configuración autorizada.
- Los cambios de schema necesitan validación real con Firebase CLI y emulador. Las pruebas Node de esta rama NO sustituyen el compilador Data Connect.
- Las reglas Firestore/Storage y los clientes existentes requieren auditoría antes de almacenar cédulas o información confidencial.

## 6. Aprovisionamiento: siguiente paso externo y facturable

La fuente configura los nombres **propuestos**, no recursos confirmados:
- Firebase project: seguros-d1a86
- Servicio: acos-enterprise
- Instancia Cloud SQL prevista: acos-enterprise-db
- Base: acos_enterprise
- Región prevista: us-central1

**Acción del administrador de Firebase:** abrir [Firebase Console](https://console.firebase.google.com/project/seguros-d1a86/dataconnect), verificar el proyecto correcto, facturación, modalidad de prueba, región, instancia, coste estimado y residencia de datos. No aceptar ningún recurso facturable sin autorización.

**Cuando exista la instancia, desde entorno autenticado de administración:**

```bash
firebase dataconnect:services:list --project seguros-d1a86
firebase dataconnect:sql:diff --project seguros-d1a86
# Revisar cuidadosamente el diff y las operaciones destructivas
firebase dataconnect:sql:migrate --project seguros-d1a86
firebase deploy --only dataconnect --project seguros-d1a86
firebase dataconnect:sdk:generate --project seguros-d1a86
```

Antes de producción: validar sintaxis GQL, migraciones y pruebas de denegación en emuladores; generar el SDK; crear backend privilegiado con revisión de membresía/alcance; ensayar permisos de Amy/esposo/departamento/agente con cuentas propias; migrar datos autorizados con plan de reversión.

## 7. Política de entrega

Rama: internal-acos-sql-core-20261124. Vercel tiene deshabilitados los despliegues de ramas internal-* mediante vercel.json. Este trabajo no toca main, no configura DNS, no crea servicios facturables y no habilita expedientes reales hasta certificación de seguridad.
