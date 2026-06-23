export const AUDIT_ACTION = {
    AUTH_LOGIN_SUCCESS: 'auth.login.success',
    AUTH_LOGIN_FAILURE: 'auth.login.failure',
    AUTH_LOGOUT: 'auth.logout',

    STUDENT_LOGIN_SUCCESS: 'student.login.success',
    STUDENT_LOGIN_FAILURE: 'student.login.failure',

    STUDENT_CREATE: 'student.create',
    STUDENT_UPDATE: 'student.update',
    STUDENT_DELETE: 'student.delete',
    STUDENT_IMPORT: 'student.import',

    GROUP_CREATE: 'group.create',
    GROUP_UPDATE: 'group.update',
    GROUP_DELETE: 'group.delete',

    EXAM_CREATE: 'exam.create',
    EXAM_UPDATE: 'exam.update',
    EXAM_DELETE: 'exam.delete',
    EXAM_TOGGLE_ACTIVE: 'exam.toggle_active',

    QUESTION_UPSERT: 'question.upsert',
    QUESTION_DELETE: 'question.delete',
    QUESTIONS_IMPORT: 'questions.import',

    QUESTION_BANK_CREATE: 'question_bank.create',
    QUESTION_BANK_UPDATE: 'question_bank.update',
    QUESTION_BANK_DELETE: 'question_bank.delete',
    QUESTION_BANK_COPY: 'question_bank.copy',

    RESULT_DELETE: 'result.delete',
    RESULT_RECALCULATE: 'result.recalculate',

    INSTITUTION_CREATE: 'institution.create',
    INSTITUTION_UPDATE: 'institution.update',
    INSTITUTION_DELETE: 'institution.delete',
    SUBSCRIPTION_CREATE: 'subscription.create',

    ADMIN_USER_CREATE: 'admin_user.create',
    ADMIN_USER_UPDATE: 'admin_user.update',
    ADMIN_USER_DELETE: 'admin_user.delete',

    APP_CONFIG_SAVE: 'app_config.save',

    PROFESSOR_CREATE: 'professor.create',
    PROFESSOR_UPDATE: 'professor.update',
    PROFESSOR_DELETE: 'professor.delete',
} as const;

export type AuditActionKey = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

export const AUDIT_ACTION_LABEL: Record<AuditActionKey, string> = {
    'auth.login.success': 'Inicio de sesión exitoso',
    'auth.login.failure': 'Inicio de sesión fallido',
    'auth.logout': 'Cierre de sesión',
    'student.login.success': 'Login estudiante exitoso',
    'student.login.failure': 'Login estudiante fallido',
    'student.create': 'Alumno creado',
    'student.update': 'Alumno actualizado',
    'student.delete': 'Alumno eliminado',
    'student.import': 'Importación de alumnos',
    'group.create': 'Grupo creado',
    'group.update': 'Grupo actualizado',
    'group.delete': 'Grupo eliminado',
    'exam.create': 'Examen creado',
    'exam.update': 'Examen actualizado',
    'exam.delete': 'Examen eliminado',
    'exam.toggle_active': 'Examen activado/desactivado',
    'question.upsert': 'Pregunta guardada',
    'question.delete': 'Pregunta eliminada',
    'questions.import': 'Importación de preguntas',
    'question_bank.create': 'Pregunta de banco creada',
    'question_bank.update': 'Pregunta de banco actualizada',
    'question_bank.delete': 'Pregunta de banco eliminada',
    'question_bank.copy': 'Pregunta copiada del banco a un examen',
    'result.delete': 'Resultado eliminado',
    'result.recalculate': 'Resultado recalculado',
    'institution.create': 'Institución creada',
    'institution.update': 'Institución actualizada',
    'institution.delete': 'Institución eliminada',
    'subscription.create': 'Suscripción iniciada',
    'admin_user.create': 'Administrador creado',
    'admin_user.update': 'Administrador actualizado',
    'admin_user.delete': 'Administrador eliminado',
    'app_config.save': 'Configuración guardada',
    'professor.create': 'Profesor creado',
    'professor.update': 'Profesor actualizado',
    'professor.delete': 'Profesor eliminado',
};
