# XARCON Insurance OS · Prototipo empresarial

Primera versión visual de una plataforma modular para una **empresa intermediaria de seguros**, desarrollada por XARCON como propuesta para revisión de alcance con los propietarios.

> **Primera versión en construcción, no lista para operar con expedientes de clientes.** La demostración en `/#/demo` usa información ficticia. El nuevo espacio `/#/workspace` integra Firebase Authentication (Google/correo), Firestore y Storage, sujeto a las reglas reales de seguridad que se deben publicar desde Firebase Console. No introducir documentación sensible hasta verificar y auditar los permisos.

## Incluye

- Web pública responsive: portada, soluciones de seguros, proceso comercial, solicitud simulada.
- Panel interno general y vistas de **Dirección, Comercial, Operaciones, Servicio al Cliente, Finanzas, Supervisión y Portal del asegurado**.
- Ventas: embudo Kanban con oportunidades y cambio de etapa en memoria.
- Pólizas: cartera de ejemplo, vencimientos y fichas de expediente.
- Clientes: directorio basado en datos simulados.
- Servicio: casos demostrativos con cambio local de estado.
- Finanzas: comisiones, conciliación de ejemplo y exportación CSV de prueba.
- Equipo: vista de colaboradores, invitación simulada, formulario con identificación, teléfono, foto y código.
- Documentos: selección desde dispositivo o cámara, listando solo nombre y metadatos en memoria, **sin subir archivos**.
- Selector de roles para facilitar una reunión de demostración; **no representa seguridad real**.

## Stack

- React 19 + TypeScript + Vite.
- CSS adaptativo personalizado (verde oscuro y plata).
- Lucide.
- Repositorio GitHub y compatible con Vercel.

## Desarrollo local

```bash
npm install
npm run dev
npm run build
```

Acceder a la web pública en `/`, a la demostración ficticia en `/#/demo` y al espacio autenticado en `/#/workspace`.

## Experiencia visual y navegación

- `/` — sitio público de presentación comercial, rediseñado con **Poppins**, verde profundo, superficies plateadas y fotografías de contexto asegurador.
- `/#/workspace` — autenticación real con Google y controles de Firebase; únicamente usuarios autorizados pueden ver registros de la compañía.
- `/#/demo` — maqueta con datos ficticios para presentación. La ruta directa histórica redirige al acceso empresarial; la demo se abre desde una sesión activa.
- La web pública nunca envía información de formularios ficticios a Firestore.
- Fotografías con licencia gratuita de Pexels (consultar condiciones aplicables): [reunión de asesoría](https://www.pexels.com/photo/an-insurance-agent-discussing-documents-to-a-client-8441785/), [revisión de documentos](https://www.pexels.com/photo/an-elderly-man-consulting-an-insurance-agent-8441780/) y [familia](https://www.pexels.com/photo/a-family-smiling-together-7983214/). Las imágenes se cargan desde el CDN de Pexels.

La identidad comercial es provisional hasta recibir el nombre, marca, información legal y datos de contacto autorizados por los propietarios.

## Proyecto Firebase conectado

- Proyecto: `seguros-d1a86`.
- Entrada privada: `/#/workspace`.
- Authentication: Google y correo/contraseña (activar proveedores en Firebase Console).
- Firestore: colecciones bajo `companies/main`, con roles empresariales, expedientes, ventas, solicitudes, comisiones, documentos y solicitudes de autorización.
- Storage: carga segura disponible en el código, pero **requiere publicar sus propias reglas**; `storage.rules` permanece en modo denegar todos por defecto hasta completar permisos.
- Administradores iniciales autorizados por correo verificado: `norvingarcia220@gmail.com` y `amyblandon171@gmail.com`. No se crean automáticamente cuentas o usuarios con privilegios de otros correos.
- Reglas versionadas en `firestore.rules`, listas para revisar y copiar en Firebase Console → Firestore Database → Rules.
- Una vez publicadas las reglas, verificar con cuentas de prueba y probar que un agente no pueda leer otra área o elevarse privilegios.
- Los documentos de demostración no se migran a producción.
- La base SQL aún no se ha implementado; este MVP utiliza Firestore.

### Próximos pasos de entrega real

1. Publicar y probar reglas Firestore y Storage, con protección de cédulas, pólizas y documentos.
2. Validar registro, acceso y autorizaciones de Amy y XARCON usando cuentas verificadas.
3. Definir condiciones de cada póliza, compañía aseguradora, conciliación y comisiones.
4. Implementar un esquema de auditoría confiable desde backend, historiales, avisos y backups.
5. Evaluar estructura de datos relacional SQL para la versión contractual definitiva.

## Advertencias de protección de datos

- No compartir una URL de demostración como si fuera una plataforma operativa.
- Nunca tratar el selector de perfiles como mecanismo de autenticación o control de acceso.
- No guardar cédulas, pólizas, fotos, datos de salud ni financieros sin autorización, reglas y revisión de seguridad.
- Evitar colocar secretos en variables `VITE_*`: en una web Vite son visibles al usuario final.
- Las futuras integraciones con aseguradoras requieren autorización y validación de sus interfaces oficiales.

## Créditos

Concepto y desarrollo: **XARCON** · Noviembre 2026.
