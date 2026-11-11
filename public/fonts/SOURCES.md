# Tipografías ACOS

- Poppins: archivos WOFF2 locales existentes; licencia OFL en `poppins-OFL.txt`. Usada en interfaces, formularios, datos, navegación y textos.
- `lunaquete-regular-latin.woff`: subconjunto Regular incrustado en el manual oficial proporcionado por el cliente, convertido de TTF a WOFF sin modificar glifos. El archivo incrustado declara `OS/2.fsType = 0` y contiene 82 caracteres. Se usa en titulares públicos, sin negrita ni cursiva artificiales.

No se presenta este subconjunto como una distribución completa de la familia. `unicode-range` limita su uso a los caracteres disponibles; Georgia cubre signos ausentes. Para incorporar otros idiomas, pesos o cursivas, sustituirlo por los archivos web originales autorizados de Lunaquete. Las fuentes no se consultan a servidores externos.
