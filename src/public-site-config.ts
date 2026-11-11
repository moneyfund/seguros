/** Only publish business-confirmed contact channels. Employee accounts are not sales contacts. */
export const publicContact = { email: '', phone: '', whatsapp: '', address: '' };

/** Areas of advice, not binding offers or promises of coverage from a particular insurer. */
export const publicSolutions = [
  {
    id: 'vida', name: 'Seguro de vida', shortName: 'Vida y familia', audience: 'personas',
    headline: 'Por los que más querés.',
    description: 'Pensá en el futuro de tu familia. Te ayudamos a explorar alternativas de protección para las personas que dependen de vos.',
    summary: 'Un respaldo para el futuro de quienes más querés.',
    topics: ['Necesidades de protección familiar', 'Beneficiarios y suma asegurada', 'Condiciones, requisitos y exclusiones'],
    image: '/images/vida.webp', alt: 'Una familia disfrutando de una tarde al aire libre.',
  },
  {
    id: 'vehiculos', name: 'Seguro vehicular', shortName: 'Vehículos', audience: 'personas',
    headline: 'Que tus planes sigan en marcha.',
    description: 'Tu vehículo forma parte de tu día a día. Revisamos su uso y tus necesidades para orientarte sobre las opciones de protección.',
    summary: 'Protección para acompañarte en cada trayecto.',
    topics: ['Uso y características del vehículo', 'Responsabilidad civil y daños a consultar', 'Deducibles, límites y exclusiones'],
    image: '/images/vehiculos.webp', alt: 'Un vehículo en circulación por una carretera.',
  },
  {
    id: 'salud', name: 'Seguro de salud', shortName: 'Salud', audience: 'personas',
    headline: 'Tu bienestar merece atención.',
    description: 'Conocé qué aspectos revisar al elegir un seguro de salud. Te orientamos para entender los alcances y las condiciones de las alternativas disponibles.',
    summary: 'Opciones para cuidar de vos y de tu familia.',
    topics: ['Necesidades de atención médica', 'Red de atención y límites a consultar', 'Requisitos, carencias y exclusiones'],
    image: '/images/salud.webp', alt: 'Profesional de salud con bata y estetoscopio.',
  },
  {
    id: 'hogar', name: 'Seguro de hogar', shortName: 'Hogar', audience: 'personas',
    headline: 'Cuidá el lugar donde pasa tu vida.',
    description: 'Tu casa y lo que hay en ella merecen protección. Conversamos sobre el inmueble, su contenido y los riesgos que necesitás considerar.',
    summary: 'Tu hogar y tu patrimonio, en buenas decisiones.',
    topics: ['Características del inmueble y su contenido', 'Riesgos del entorno a evaluar', 'Límites y condiciones de protección'],
    image: '/images/hogar.webp', alt: 'Casa con jardín e iluminación cálida al atardecer.',
  },
  {
    id: 'empresas', name: 'Seguros empresariales', shortName: 'Empresas', audience: 'empresas',
    headline: 'Vos hacés crecer tu negocio.',
    description: 'Cada empresa tiene necesidades distintas. Analizamos tu actividad, tus activos y tu equipo para orientarte sobre alternativas de protección.',
    summary: 'Respaldo para lo que construís cada día.',
    topics: ['Actividad, instalaciones y activos', 'Responsabilidades de la operación', 'Necesidades de protección del equipo'],
    image: '/images/empresas.webp', alt: 'Interior de una cafetería con mesas y área de atención.',
  },
  {
    id: 'asesoria', name: 'Asesoría y acompañamiento', shortName: 'Asesoría', audience: 'todos',
    headline: 'Elegir bien empieza por entender.',
    description: 'Te ayudamos a comprender las condiciones, organizar tus documentos y dar seguimiento a las gestiones de tu seguro.',
    summary: 'Resolvemos tus dudas. Te acompañamos a decidir.',
    topics: ['Orientación sobre alternativas y condiciones', 'Apoyo con requisitos y documentos', 'Seguimiento de consultas y gestiones'],
    image: '/images/asesoria.webp', alt: 'Personas revisando documentación en una mesa de trabajo.',
  },
] as const;

export type SolutionId = typeof publicSolutions[number]['id'];
