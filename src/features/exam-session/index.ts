export { submitAnswer, finishExam, autoSubmit } from './actions/mutations';
export { submitAnswerSchema, type SubmitAnswerInput } from './schemas/exam-session.schemas';
export {
    createStudentSession,
    getStudentSession,
    deleteStudentSession,
    createResultSession,
    getResultSession,
    type StudentSessionPayload,
    type ResultSessionPayload,
} from './lib/session';
export type { SafeOption, SafeQuestion, SafeExam } from './types/exam.types';
export { ExamCarousel } from './components/ExamCarousel';
