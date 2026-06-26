export interface FaqItem {
    q: string;
    a: string;
}

export const FAQS: FaqItem[] = [
    {
        q: '¿Los alumnos necesitan crear una cuenta?',
        a: 'No. Los estudiantes acceden con su RUT. Sin correos, sin contraseñas, sin instalaciones. El docente comparte el link del examen y listo.',
    },
    {
        q: '¿Funciona desde el celular?',
        a: 'Sí. La interfaz del examen es 100% responsiva. Funciona en cualquier dispositivo con navegador moderno: PC, tablet, smartphone.',
    },
    {
        q: '¿Qué pasa si el alumno pierde internet durante el examen?',
        a: 'Las respuestas se guardan automáticamente cada vez que el alumno avanza a la siguiente pregunta. Si la conexión se corta, al reconectarse el examen continúa desde donde quedó.',
    },
    {
        q: '¿Puedo importar preguntas desde un Word o Excel?',
        a: 'Sí. Aulika acepta importación desde Google Forms y desde plantillas Excel. También puedes crear preguntas directamente en la plataforma.',
    },
    {
        q: '¿Los datos están en Chile?',
        a: 'Los datos de la institución y de los estudiantes se almacenan en servidores con residencia en la región de Sudamérica, cumpliendo con la ley 19.628 de protección de datos personales de Chile.',
    },
    {
        q: '¿Cuánto demora implementar Aulika en mi institución?',
        a: 'Una institución pequeña puede estar operativa en un día. Para instituciones grandes con integración a SGA o importación masiva de datos, el proceso toma entre 3 y 5 días hábiles con nuestro equipo de soporte.',
    },
];
