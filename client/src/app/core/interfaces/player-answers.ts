import { Choice } from './choice';

/**
 * Interface to represent the answer
 * of a player at a specific question
 * and the details of the state of
 * the answer as the choices selected,
 * if the question is final and the
 * points obtained.
 */
export interface PlayerAnswers {
    name: string;
    lastAnswerTime: string;
    final: boolean;
    questionId: string;
    obtainedPoints: number;
    qcmAnswers: Choice[];
    qrlAnswer: string;
    isTypingQrl: boolean;
    qreAnswer: number;
    isFirstAttempt?: boolean;
}
