# ACOS · Accesos separados y pruebas de incorporación

## URL única, tres rutas de negocio

Las URLs funcionan en cualquier despliegue del branch que tenga los nuevos cambios:

- **Mapa de accesos:** `#/accesos`
- **Registro del colaborador:** `#/registro`
- **Solicitudes y aprobación de Dirección:** `#/direccion/solicitudes`
- **Panel del colaborador:** `#/mi-panel`
- **Vista ilustrativa de menús por rol:** `#/direccion/vistas`
- **Módulos internos con enlace directo:** `#/modulo/resumen`, `#/modulo/prospectos`, etc.
- **Laboratorio anterior:** `#/laboratorio`

Las rutas no se abren como tres despliegues Vercel. Todas pertenecen a la misma app y comparten la misma autenticación Firebase.

## Qué debe ver cada identidad

1. **Visitante sin cuenta:** `#/registro` ofrece crear cuenta con correo y contraseña o acceso Google.
2. **Cuenta sin correo verificado:** recibe la pantalla de verificación, sin acceso a documentos.
3. **Cuenta verificada sin invitación:** no puede enviar el expediente. Dirección debe crear una invitación con ese correo exacto.
4. **Cuenta invitada:** completa nombre, teléfono, departamento solicitado, fotografía y archivo de identificación. Para las pruebas usar únicamente archivos ficticios.
5. **Solicitante pendiente:** ve el mensaje de revisión; no tiene acceso al panel.
6. **Dirección autorizada:** en `#/direccion/solicitudes` invita correos y aprueba solicitudes, eligiendo departamento, rol y vistas permitidas.
7. **Colaborador aprobado:** tras refrescar sesión, `#/mi-panel` muestra únicamente las vistas indicadas en `allowedSections`.
8. **Dirección abriendo `#/registro`:** ve una ilustración de la solicitud para no tener que cerrar su sesión administrativa.
9. **Dirección abriendo `#/mi-panel`:** ve la maqueta navegable de menús por rol (sin impersonar empleados ni modificar datos).

## Secuencia completa para probar

1. Abrir `#/direccion/solicitudes` con cuenta administrativa autorizada.
2. En la sección de invitación, indicar un correo de prueba, p. ej. una segunda cuenta propia, y escoger Ventas.
3. En ventana privada, abrir `#/registro` con el correo invitado. Registrar/ingresar y verificar correo.
4. Completar solicitud con datos de prueba. Nunca cargar cédulas auténticas en un entorno no auditado.
5. En Dirección, refrescar lista de solicitudes; abrir foto/documento ficticio; aprobar con rol Ventas y vistas `resumen`, `prospectos`, `documentos`.
6. En la sesión del colaborador, pulsar **Comprobar acceso** y entrar en `#/mi-panel`.
7. Comprobar que Finanzas, Equipo y Configuración no aparecen y no pueden consultarse por URL.
8. Dirección actualiza las vistas de ese miembro: cambios se reflejan durante sesión sin otorgar acceso a datos fuera del perfil.
9. Verificar denegación de lectura/escritura directa a registros sin rol/vista.

## Seguridad y limitaciones

- La cuenta que inicia sesión determina el panel, no el hash de la URL. Es deliberado.
- La vista previa por departamento es ilustrativa y nunca produce credenciales ni crea derechos de lectura.
- Las colecciones de personal e invitaciones siguen usando Firestore mientras se provisiona SQL Connect.
- Reglas Firestore y Storage de la rama requieren compilación/emulación y despliegue controlado antes de invitar personal.
- Los mails de notificación automáticos y el proveedor corporativo todavía están pendientes.
- `main` de producción no se modifica hasta completar los controles de seguridad.
- Vercel tiene dos proyectos conectados al mismo repo. Se conservarán ambos hasta elegir proyecto canónico y desactivar la integración duplicada.
