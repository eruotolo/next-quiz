import type { DriveStep } from 'driver.js';

const DASHBOARD_STEPS: DriveStep[] = [
    {
        element: '[data-tour="sidebar"]',
        popover: {
            title: 'Navegación principal',
            description:
                'Desde aquí accedés a estudiantes, grupos, exámenes, resultados y configuración de tu institución.',
            side: 'right',
            align: 'start',
        },
    },
    {
        element: '[data-tour="stat-tiles"]',
        popover: {
            title: 'Métricas en tiempo real',
            description:
                'Un resumen del estado de tu institución: alumnos activos, exámenes en curso, promedio general y asistencia a evaluaciones.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="new-exam-btn"]',
        popover: {
            title: 'Crear contenido',
            description:
                'Creá exámenes, agregá estudiantes o nuevos grupos desde este menú rápido.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="active-exams"]',
        popover: {
            title: 'Exámenes en curso',
            description:
                'Monitoreá en tiempo real qué alumnos están rindiendo ahora mismo y cuántas preguntas llevan respondidas.',
            side: 'top',
        },
    },
    {
        element: '[data-tour="recent-results"]',
        popover: {
            title: 'Últimos resultados',
            description:
                'Consultá las notas más recientes de tus estudiantes y accedé al detalle de cada evaluación.',
            side: 'top',
        },
    },
];

const EXAMS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="exam-status-tabs"]',
        popover: {
            title: 'Estado del examen',
            description:
                'Filtrá por estado: Borrador, Programado, En curso o Corregido. Los números muestran cuántos hay en cada etapa.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="exam-stats"]',
        popover: {
            title: 'Vista rápida',
            description: 'Hacé clic en cualquier tile para filtrar la lista por ese estado.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="exam-new-btn"]',
        popover: {
            title: 'Crear examen',
            description: 'Creá un nuevo examen desde cero o usá una plantilla Excel o Markdown.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="exam-list"]',
        popover: {
            title: 'Lista de exámenes',
            description:
                'Cada fila muestra el estado, los grupos asignados, participación y promedio. Hacé clic en los tres puntos para editar, publicar o eliminar.',
            side: 'top',
        },
    },
];

const STUDENTS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="student-actions"]',
        popover: {
            title: 'Agregar estudiantes',
            description:
                'Agregá un estudiante manualmente o importá una planilla Excel con múltiples estudiantes a la vez.',
            side: 'bottom',
            align: 'end',
        },
    },
    {
        element: '[data-tour="student-filters"]',
        popover: {
            title: 'Filtros de búsqueda',
            description:
                'Buscá por nombre, RUT o email. También podés filtrar por curso y estado de activación.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="student-table"]',
        popover: {
            title: 'Lista de estudiantes',
            description:
                'Cada fila muestra el estudiante, su curso y su último examen. Los tres puntos permiten editar, activar o eliminar.',
            side: 'top',
        },
    },
];

const GROUPS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="groups-header"]',
        popover: {
            title: 'Gestión de grupos',
            description:
                'Los grupos organizan a tus estudiantes por carrera, semestre o nivel. Cada examen se asigna a uno o más grupos.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="groups-list"]',
        popover: {
            title: 'Lista de grupos',
            description:
                'Cada tarjeta muestra el grupo, sus estudiantes y los exámenes asignados. Hacé clic en un grupo para ver el detalle.',
            side: 'top',
        },
    },
];

const RESULTS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="results-filters"]',
        popover: {
            title: 'Filtros de resultados',
            description:
                'Filtrá por examen, grupo o rango de fechas para encontrar los resultados que necesitás.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '[data-tour="results-table"]',
        popover: {
            title: 'Tabla de resultados',
            description:
                'Cada fila muestra el estudiante, su nota y el desglose de respuestas correctas. Podés ordenar por cualquier columna.',
            side: 'top',
        },
    },
];

const COURSES_STEPS: DriveStep[] = [
    {
        element: '[data-tour="courses-header"]',
        popover: {
            title: 'Gestión de materias',
            description: 'Crea y administra las materias o asignaturas de tu institución.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="courses-list"]',
        popover: {
            title: 'Lista de materias',
            description:
                'Aquí verás todas las materias, con su programa, período y profesores asignados.',
            side: 'top',
        },
    },
];

const PROFESSORS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="professors-header"]',
        popover: {
            title: 'Gestión de profesores',
            description: 'Administra los accesos y roles de los docentes.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="professors-list"]',
        popover: {
            title: 'Lista de profesores',
            description: 'Cada profesor muestra su rol y los grupos que tiene asignados.',
            side: 'top',
        },
    },
];

const PROGRAMS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="programs-header"]',
        popover: {
            title: 'Gestión de programas',
            description: 'Organiza las carreras, niveles o programas académicos.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="programs-list"]',
        popover: {
            title: 'Lista de programas',
            description: 'Detalle de los grupos y materias asociadas a cada programa.',
            side: 'top',
        },
    },
];

const PERIODS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="periods-header"]',
        popover: {
            title: 'Períodos académicos',
            description: 'Administra los semestres o años académicos activos.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="periods-list"]',
        popover: {
            title: 'Lista de períodos',
            description: 'Visualiza las fechas y el estado de cada período.',
            side: 'top',
        },
    },
];

const QUESTIONS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="questions-filters"]',
        popover: {
            title: 'Banco de preguntas',
            description: 'Filtra y busca preguntas por asignatura, unidad, dificultad o tags.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="questions-list"]',
        popover: {
            title: 'Tus preguntas',
            description: 'Crea, edita y reutiliza preguntas para distintos exámenes.',
            side: 'top',
        },
    },
];

const LIVERESULTS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="liveresults-header"]',
        popover: {
            title: 'Resultados en vivo',
            description: 'Selecciona el examen y grupo para monitorear en tiempo real.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="liveresults-stats"]',
        popover: {
            title: 'Estadísticas generales',
            description: 'Observa cuántos alumnos están rindiendo y el progreso general.',
            side: 'bottom',
        },
    },
    {
        element: '[data-tour="liveresults-list"]',
        popover: {
            title: 'Progreso por estudiante',
            description: 'Sigue el avance pregunta por pregunta de cada alumno.',
            side: 'top',
        },
    },
];

const SETTINGS_STEPS: DriveStep[] = [
    {
        element: '[data-tour="settings-form"]',
        popover: {
            title: 'Configuración',
            description: 'Ajusta los datos y preferencias principales de tu institución.',
            side: 'bottom',
        },
    },
];

const UPGRADE_STEPS: DriveStep[] = [
    {
        element: '[data-tour="upgrade-plans"]',
        popover: {
            title: 'Planes y facturación',
            description: 'Revisa y mejora tu plan para acceder a más características.',
            side: 'bottom',
        },
    },
];

export const PAGE_TOUR_STEPS: Record<string, DriveStep[]> = {
    dashboard: DASHBOARD_STEPS,
    exams: EXAMS_STEPS,
    students: STUDENTS_STEPS,
    groups: GROUPS_STEPS,
    results: RESULTS_STEPS,
    courses: COURSES_STEPS,
    professors: PROFESSORS_STEPS,
    programs: PROGRAMS_STEPS,
    periods: PERIODS_STEPS,
    questions: QUESTIONS_STEPS,
    liveresults: LIVERESULTS_STEPS,
    settings: SETTINGS_STEPS,
    upgrade: UPGRADE_STEPS,
};

export function getPageKey(pathname: string, slug: string): string | null {
    const base = `/${slug}`;
    if (pathname === base || pathname === `${base}/`) return 'dashboard';
    if (pathname.startsWith(`${base}/exams`)) return 'exams';
    if (pathname.startsWith(`${base}/students`)) return 'students';
    if (pathname.startsWith(`${base}/groups`)) return 'groups';
    if (pathname.startsWith(`${base}/results`)) return 'results';
    if (pathname.startsWith(`${base}/courses`)) return 'courses';
    if (pathname.startsWith(`${base}/professors`)) return 'professors';
    if (pathname.startsWith(`${base}/programs`)) return 'programs';
    if (pathname.startsWith(`${base}/periods`)) return 'periods';
    if (pathname.startsWith(`${base}/questions`)) return 'questions';
    if (pathname.startsWith(`${base}/liveresults`)) return 'liveresults';
    if (pathname.startsWith(`${base}/settings`)) return 'settings';
    if (pathname.startsWith(`${base}/upgrade`)) return 'upgrade';
    return null;
}
