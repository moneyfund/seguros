# ACOS · Catálogo comercial unificado

Actualización 2026-11-24. Se contrastaron las secciones públicas Inicio, Personas y Empresas de https://advisersnicaragua.com/. ACOS usa su propia identidad, redacción y componentes. La referencia tiene nombres superpuestos; se normalizan CAR (obra civil), EAR (montaje), TREC (equipos/contratistas), SOA/SOAT, vehículos/daños propios, microseguro/PYME y fianzas/cartas fianza/caución. Vida Ley y SCTR se presentan como denominaciones para asesoría, no como afirmaciones de obligatoriedad ni de disponibilidad en Nicaragua.

Fuente única del catálogo: src/insuranceCatalog.ts. Sus claves estables están preparadas para el futuro catálogo SQL; por ahora, los formularios Firestore de oportunidades y registros preliminares conservan su campo product con la denominación legible. Las fichas públicas usan información orientativa y reutilizan los canales de consulta actuales de ACOS. No se copian datos de contacto ni condiciones de Advisers.

El centro interno de prospectos, clientes y pólizas dispone del catálogo navegable. Los selectores de oportunidades y registros preliminares usan los 22 productos. El laboratorio anterior mantiene sus datos y únicamente comparte las opciones del catálogo. El flujo actual de emisión/registro documental especializado en SOA sigue intacto: los demás productos necesitan definir y validar sus propios requisitos y reglas antes de habilitar escrituras de pólizas emitidas. No se cambia Firestore Rules, Storage Rules, acceso, correo, ni se aprovisiona SQL.

Pruebas: catálogo (identificadores, alias, búsquedas, categorías, flujos), TypeScript, compilación y pruebas existentes. Verificar además búsqueda, filtros, ficha y consulta pública en dispositivos móviles.
