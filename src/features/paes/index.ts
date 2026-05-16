export { PaesLanding } from './components/PaesLanding';
export { PaesExamCarousel } from './components/PaesExamCarousel';
export { PaesResultsScreen } from './components/PaesResultsScreen';
export { PaesAviso } from './components/PaesAviso';
export { PAES_CATALOG, getSubjectMeta, formatDuration } from './lib/catalog';
export { computePaesResults, estimatePaesScore } from './lib/scoring';
export type {
    PaesSubject,
    PaesExam,
    PaesQuestion,
    PaesOption,
    PaesResult,
    PaesEjeResult,
    PaesQuestionResult,
} from './types/paes.types';
