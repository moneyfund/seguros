/** Business-approved public details only. Empty channels stay hidden.
 * WhatsApp requires an international number using digits only.
 * Do not use employee login addresses as commercial contact details.
 */
export const publicContact = { email: '', phone: '', whatsapp: '', address: '' };

export const publicSolutions = [
  { id: 'vida', number: '01', name: 'Vida y familia', headline: 'Para quienes dan sentido a todo.', description: 'Conversamos sobre las personas que dependen de vos y las prioridades de tu familia, para explorar alternativas de protección.', topics: ['Protección familiar', 'Prioridades a futuro', 'Condiciones y beneficiarios'], cta: 'Consultar sobre vida', word: 'Cuidar.' },
  { id: 'vehiculos', number: '02', name: 'Vehículos', headline: 'Seguí avanzando con claridad.', description: 'Te orientamos para entender las opciones de seguro según tu vehículo, su uso y las condiciones que necesitás revisar.', topics: ['Uso del vehículo', 'Deducibles y exclusiones', 'Responsabilidad civil'], cta: 'Consultar sobre vehículos', word: 'Avanzar.' },
  { id: 'salud', number: '03', name: 'Salud', headline: 'Tu bienestar, con perspectiva.', description: 'Ponemos en contexto las alternativas de protección para que puedas revisar alcances, condiciones y requisitos con información clara.', topics: ['Necesidades de atención', 'Alcances y límites', 'Requisitos de contratación'], cta: 'Consultar sobre salud', word: 'Vivir.' },
  { id: 'hogar', number: '04', name: 'Hogar y patrimonio', headline: 'Hay mucho más que paredes.', description: 'Exploramos las necesidades de protección de tu hogar y lo que guardás en él, de acuerdo con sus características y los riesgos a considerar.', topics: ['Inmueble y contenido', 'Riesgos del entorno', 'Condiciones de protección'], cta: 'Consultar sobre hogar', word: 'Habitar.' },
  { id: 'empresas', number: '05', name: 'Empresas', headline: 'Respaldo para seguir construyendo.', description: 'Revisamos la actividad de tu empresa, sus activos y sus responsabilidades para orientar una conversación informada sobre riesgos.', topics: ['Actividad y operación', 'Activos y responsabilidades', 'Necesidades del equipo'], cta: 'Consultar sobre empresas', word: 'Crecer.' },
  { id: 'asesoria', number: '06', name: 'Asesoría y acompañamiento', headline: 'Una buena decisión empieza aquí.', description: 'Te ayudamos a plantear las preguntas correctas, comprender las condiciones y organizar los siguientes pasos de tu seguro.', topics: ['Lectura de condiciones', 'Organización documental', 'Seguimiento de gestiones'], cta: 'Solicitar orientación', word: 'Entender.' },
] as const;
export type SolutionId = typeof publicSolutions[number]['id'];
