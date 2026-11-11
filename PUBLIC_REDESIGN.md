# ACOS — web pública comercial

Web pública en #/inicio, sobre feature/acos-public-editorial-20261110 (PR #4), derivada de feature/acos-enterprise-core-sql-20261109.

## Experiencia implementada

- Portada fotográfica con verde corporativo, plata y acentos verdes claros.
- Tipografía Poppins local; logo oficial intacto.
- Acceso inmediato a seis categorías: vida, vehículos, salud, hogar, empresas y asesoría.
- Catálogo fotográfico de distintas proporciones, filtros por público y fichas con consulta contextual.
- Sección empresarial, presentación de ACOS, cinco etapas de atención, preguntas frecuentes y contacto.
- Plataforma digital identificada como en desarrollo, sin datos de clientes ni promesa de acceso disponible.
- Menú adaptable, diálogos nativos, navegación por teclado, cierre con Escape y movimiento reducido.
- Fotografías reales comprimidas a WebP y alojadas en el repositorio. Procedencia en public/images/SOURCES.md.
- Sin logos de aseguradoras en la web pública: no se presupone ninguna alianza.

## Contactos

Los canales comerciales siguen en src/public-site-config.ts. Hasta su confirmación, el visitante puede preparar y copiar una consulta. No hay formulario que registre o simule enviar datos. No se usan correos de colaboradores como contactos de venta.

## Verificación reproducible

- npm run typecheck
- npm run build
- scripts/public-site-qa.mjs, con Playwright y axe en un directorio de herramientas independiente.
- Workflow Public website browser checks: capturas a 320, 390, 768, 1024 y 1440 px, catálogo/filtros, fichas, consultas, copia y fallo de portapapeles, FAQ, privacidad, menú móvil, rutas heredadas y puertas de acceso privadas.
- Evidencia de cada ejecución en el artefacto public-website-review de GitHub Actions: capturas, results.json y accessibility.json. El resultado de Actions es la fuente del estado de esas pruebas.
- El navegador del entorno local no puede abrir sockets. El workflow de comprobaciones visuales está preparado para ejecutarse en el runner de CI.
- El build mantiene el aviso previo de tamaño del bundle compartido con el sistema privado. No se cambia la arquitectura para esta intervención.

## Límites

No se modificaron App.tsx, Firebase, SQL Connect, reglas, roles, aprobaciones, paneles ni expedientes. Las pruebas privadas comprueban la pantalla de autenticación sin sesión; no crean cuentas ni datos ni sustituyen pruebas con roles autenticados.

La vista previa usa el proyecto Vercel existente. No se fusiona a main ni se cambia la protección o la audiencia. El resultado de la publicación y la revisión visual se documentan en el PR #4.
