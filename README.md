# XARCON Insurance OS · Prototipo empresarial

Primera versión visual de una plataforma modular para una **empresa intermediaria de seguros**, desarrollada por XARCON como propuesta para revisión de alcance con los propietarios.

> **No es un sistema operativo listo para producción.** Todos los clientes, aseguradoras, importes, pólizas, comisiones y métricas son ficticios. La demostración no utiliza autenticación real ni persiste datos; los roles únicamente muestran vistas de interfaz. No se deben introducir datos reales ni documentos sensibles.

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

Acceder a la web pública en `/` y a la demostración interna en `/#/demo`.

## Integración futura con Firebase

Los archivos `firestore.rules` y `storage.rules` deniegan todo acceso hasta configurar una arquitectura segura. `.env.example` incluye variables de configuración públicas del SDK para el entorno correspondiente. **No se ha conectado Firestore, Storage ni Firebase Authentication.**

Al recibir el proyecto Firebase, las etapas siguientes son:

1. Levantar requisitos funcionales aprobados y el modelo de datos: usuarios, perfiles, departamentos, prospectos, clientes, cotizaciones, pólizas, aseguradoras, solicitudes, liquidaciones, documentos, eventos de auditoría.
2. Definir autenticación de correos empresariales y proceso de autorización por administradores, con privilegios gestionados en backend; verificar cada operación en reglas/servidor.
3. Separar el acceso a datos en una capa de repositorios y reemplazar las fuentes ficticias por Firestore; los documentos se almacenarán privadamente en Storage con referencias restringidas.
4. Incorporar validaciones de campos, cargas seguras, registros de auditoría, pruebas de permisos y respaldos.
5. Confirmar condiciones legales, consentimientos y operaciones regulatorias para intermediación de seguros en Nicaragua.
6. Analizar si la base relacional SQL será necesaria desde el inicio o en una fase posterior, antes de fijar el modelo definitivo y las integraciones con aseguradoras.

## Advertencias de protección de datos

- No compartir una URL de demostración como si fuera una plataforma operativa.
- Nunca tratar el selector de perfiles como mecanismo de autenticación o control de acceso.
- No guardar cédulas, pólizas, fotos, datos de salud ni financieros sin autorización, reglas y revisión de seguridad.
- Evitar colocar secretos en variables `VITE_*`: en una web Vite son visibles al usuario final.
- Las futuras integraciones con aseguradoras requieren autorización y validación de sus interfaces oficiales.

## Créditos

Concepto y desarrollo: **XARCON** · Noviembre 2026.
