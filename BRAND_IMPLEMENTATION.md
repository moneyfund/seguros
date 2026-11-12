# ACOS — aplicación del manual de marca

Referencia: manual de identidad visual, edición 01, octubre 2026, suministrado por el cliente. Revisión sobre `73ec9d7`, manteniendo el carrusel de aseguradoras y la igualdad de accesos de las dos cuentas directoras.

## Sistema visual

- Azul institucional `#001929`, champagne `#DABB83`, dorado `#CFA76F`, cobre `#D4A06C`, bronce `#B28648` y oro intenso `#DB9D23`.
- Marfil `#F3EEEA`, gris niebla `#F2F3F4` y blanco como superficies. Neutrales derivados para texto y bordes legibles.
- Los colores se centralizan en `src/brand-tokens.css`. `brand-identity.css` aplica las variantes en cada superficie. Los colores semánticos de errores, advertencias y confirmaciones conservan su significado.
- Arte original del PDF: principal para acceso y pie; horizontal negativo para navegación pública y barra lateral privada; isotipo para móvil y favicon. Procedencia en `public/brand/README.md`.
- Lunaquete Regular local para titulares de la web pública; Poppins local para lectura, datos y controles. Procedencia y límites del subconjunto en `public/fonts/SOURCES.md`.

## Alcance

Actualiza web pública, carrusel, login, registro, guía de accesos, panel administrativo, paneles de agentes, formularios, directorio de aseguradoras y laboratorio operativo. Conserva fotografías, navegación, servicios, consultas y procedimientos existentes.

No modifica Firebase, reglas, SQL, roles, correos de administradores, permisos ni acceso a registros. La única modificación estructural de `ConnectedWorkspace` exporta el componente visual existente para su revisión aislada; no añade rutas públicas ni omite autenticación. El despliegue de producción no importa ni incluye los adaptadores de prueba.

Los teléfonos, dominios y correos representados en las aplicaciones del manual no se incorporan a los canales de venta en esta revisión de diseño. Los contactos comerciales continúan configurándose en `public-site-config.ts`.

## Comprobación

- `npm run typecheck` y `npm run build`.
- `scripts/public-site-qa.mjs`: rutas y puertas de autenticación reales sin sesión, catálogo, consultas, móvil, identidad, contraste y capturas a cinco anchos.
- `node scripts/build-brand-fixture.mjs` + `scripts/brand-qa.mjs`: componentes privados reales con adaptadores de lectura locales, datos ficticios y escrituras bloqueadas; panel de Dirección/agente, menús, formulario y contraste en cinco anchos.
- Las pruebas aisladas revisan presentación e interacción; no certifican el backend ni permisos con sesiones reales. Los resultados y capturas quedan en GitHub Actions.
- No se fusiona a main ni se altera la protección de Vercel. La rama de revisión utiliza los proyectos existentes.
