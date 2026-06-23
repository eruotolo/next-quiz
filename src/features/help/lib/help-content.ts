import {
    Activity,
    BarChart3,
    BookOpen,
    GraduationCap,
    Home,
    Settings,
    type LucideIcon,
    UserCog,
    Users,
} from 'lucide-react';

// Alcance del Profesor en cada sección:
// - 'scoped'   : accede, pero acotado a los datos de sus grupos.
// - 'readonly' : solo puede ver el listado (no gestiona).
// - 'none'     : la sección no está disponible para el rol.
export type ProfessorAccess = 'scoped' | 'readonly' | 'none';

export interface FormShot {
    src: string;
    caption: string;
}

export interface HelpSection {
    id: string;
    label: string;
    path: string;
    icon: LucideIcon;
    purpose: string;
    steps: string[];
    professorAccess: ProfessorAccess;
    professorNote?: string;
    adminNote?: string;
    screenshots: {
        admin?: string;
        professor?: string;
    };
    // Capturas de formularios/diálogos de gestión (solo se muestran a quien gestiona la sección).
    forms?: FormShot[];
}

export const HELP_SECTIONS: HelpSection[] = [
    {
        id: 'inicio',
        label: 'Inicio',
        path: '',
        icon: Home,
        purpose: 'El panel de inicio resume el estado de la institución: estudiantes activos, exámenes en curso, promedio general y los últimos resultados, todo en una sola vista.',
        steps: [
            'Revisa las tarjetas superiores para ver las métricas clave del momento.',
            'El bloque “Exámenes en curso” lista las evaluaciones activas en tiempo real.',
            'En “Últimos resultados” accedes rápido a las notas más recientes.',
        ],
        professorAccess: 'scoped',
        professorNote: 'Como profesor ves las métricas y resultados de los grupos donde estás asignado.',
        screenshots: { admin: '/help/inicio-admin.webp', professor: '/help/inicio-profesor.webp' },
    },
    {
        id: 'grupos',
        label: 'Grupos',
        path: '/groups',
        icon: Users,
        purpose: 'Los grupos (o cursos) organizan a tus estudiantes. Cada estudiante pertenece a un grupo y los exámenes se asignan a uno o más grupos.',
        steps: [
            'Crea un grupo con el botón “Nuevo grupo”.',
            'Asigna uno o más profesores al grupo.',
            'Edita o elimina grupos existentes cuando lo necesites.',
        ],
        professorAccess: 'readonly',
        professorNote: 'Como profesor ves los grupos en los que estás asignado, pero la creación y edición la realiza el administrador.',
        screenshots: { admin: '/help/grupos-admin.webp' },
        forms: [
            {
                src: '/help/grupos-form-nuevo.webp',
                caption: 'Crear o editar un grupo y asignarle profesores.',
            },
        ],
    },
    {
        id: 'estudiantes',
        label: 'Estudiantes',
        path: '/students',
        icon: GraduationCap,
        purpose: 'Gestión de los alumnos de la institución. Cada estudiante accede a rendir sus exámenes con su RUT, sin contraseña.',
        steps: [
            'Agrega estudiantes de a uno con “Nuevo estudiante”.',
            'Importa listas completas desde un archivo Excel.',
            'Edita sus datos o activa/desactiva su acceso.',
        ],
        professorAccess: 'scoped',
        professorNote: 'Como profesor gestionas los estudiantes de tus grupos (ver, crear, editar). La eliminación queda reservada al administrador.',
        screenshots: {
            admin: '/help/estudiantes-admin.webp',
            professor: '/help/estudiantes-profesor.webp',
        },
        forms: [
            {
                src: '/help/estudiantes-form-nuevo.webp',
                caption: 'Alta individual de un estudiante (nombre, RUT, email y grupo).',
            },
            {
                src: '/help/estudiantes-form-importar.webp',
                caption: 'Importación masiva de estudiantes desde un archivo Excel.',
            },
        ],
    },
    {
        id: 'profesores',
        label: 'Profesores',
        path: '/professors',
        icon: UserCog,
        purpose: 'Administración del cuerpo docente: los profesores que crean y aplican exámenes en la institución.',
        steps: [
            'Crea profesores con sus datos de acceso (email y contraseña).',
            'Edita o elimina profesores existentes.',
            'Asígnalos a los grupos desde la sección Grupos.',
        ],
        professorAccess: 'readonly',
        professorNote: 'Como profesor puedes ver el listado del cuerpo docente, pero la gestión la realiza el administrador.',
        screenshots: { admin: '/help/profesores-admin.webp' },
        forms: [
            {
                src: '/help/profesores-form-nuevo.webp',
                caption: 'Crear o editar un profesor con sus datos de acceso.',
            },
        ],
    },
    {
        id: 'examenes',
        label: 'Exámenes',
        path: '/exams',
        icon: BookOpen,
        purpose: 'Creación y configuración de evaluaciones: preguntas, tiempo límite, fechas de inicio y cierre, escala de notas y vigilancia anti-trampa.',
        steps: [
            'Crea un examen con “Nuevo examen” y completa materia, unidad y fechas de inicio/cierre.',
            'Carga las preguntas manualmente o impórtalas desde una plantilla.',
            'Configura la vigilancia (anti-trampa) y la escala de evaluación.',
            'Publica el examen para que los alumnos del grupo puedan rendirlo.',
        ],
        professorAccess: 'scoped',
        professorNote: 'Como profesor creas y editas exámenes para tus grupos. Al editar uno compartido, los grupos ajenos ya asignados se conservan.',
        screenshots: { admin: '/help/examenes-admin.webp', professor: '/help/examenes-profesor.webp' },
        forms: [
            {
                src: '/help/examenes-form-ajustes.webp',
                caption: 'Configuración del examen: materia, unidad, fechas, anti-trampa y escala de notas.',
            },
            {
                src: '/help/examenes-form-preguntas.webp',
                caption: 'Editor de preguntas y opciones del examen.',
            },
        ],
    },
    {
        id: 'resultados',
        label: 'Resultados',
        path: '/results',
        icon: BarChart3,
        purpose: 'Las notas finales de los exámenes entregados, con filtros y el detalle de cada estudiante pregunta por pregunta.',
        steps: [
            'Filtra por examen o por grupo.',
            'Abre el detalle de un resultado para ver la respuesta de cada pregunta.',
            'Exporta o imprime el comprobante cuando lo necesites.',
        ],
        professorAccess: 'scoped',
        professorNote: 'Como profesor ves los resultados de los estudiantes de tus grupos.',
        screenshots: {
            admin: '/help/resultados-admin.webp',
            professor: '/help/resultados-profesor.webp',
        },
    },
    {
        id: 'en-vivo',
        label: 'En vivo',
        path: '/liveresults',
        icon: Activity,
        purpose: 'Seguimiento en tiempo real mientras los alumnos rinden: quién está respondiendo y cómo avanza cada uno.',
        steps: [
            'Elige el examen activo que quieres monitorear.',
            'Observá el avance pregunta por pregunta de cada estudiante a medida que responden.',
        ],
        professorAccess: 'scoped',
        professorNote: 'Como profesor monitoreas en vivo los exámenes de tus grupos.',
        screenshots: { admin: '/help/en-vivo-admin.webp' },
    },
    {
        id: 'ajustes',
        label: 'Ajustes',
        path: '/settings',
        icon: Settings,
        purpose: 'Configuración general de la institución (datos, preferencias).',
        steps: ['Actualizá los datos y preferencias de la institución.'],
        professorAccess: 'none',
        adminNote: 'Sección exclusiva del administrador.',
        screenshots: { admin: '/help/ajustes-admin.webp' },
    },
];
