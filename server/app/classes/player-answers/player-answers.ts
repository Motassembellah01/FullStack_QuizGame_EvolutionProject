import { Choice } from '@app/interfaces/choice';

/**
 * Represent how the answer of a player are stored in our server
 */
export class PlayerAnswers {
    name: string;
    lastAnswerTime: string;
    final: boolean;
    questionId: string;
    obtainedPoints: number;
    qcmAnswers: Choice[];
    qrlAnswer: string;
    qreAnswer: number;
    isTypingQrl: boolean;
    isFirstAttempt?: boolean;

    constructor(data: Partial<PlayerAnswers> = {}) {
        this.name = data.name || '';
        this.qcmAnswers = data.qcmAnswers || [];
        this.qrlAnswer = data.qrlAnswer || '';
        this.qreAnswer = data.qreAnswer || 0;
        this.lastAnswerTime = data.lastAnswerTime || '';
        this.final = data.final || false;
        this.questionId = data.questionId || '';
        this.obtainedPoints = data.obtainedPoints || 0;
        this.isTypingQrl = data.isTypingQrl || false;
        this.isFirstAttempt = !!data.isFirstAttempt;
    }

    arePlayerAnswersEqual(playerAnswers: PlayerAnswers): boolean {
        if (this.qcmAnswers.length !== playerAnswers.qcmAnswers.length) {
            return false;
        }

        if (this.name !== playerAnswers.name) {
            return false;
        }

        if (this.questionId !== playerAnswers.questionId) {
            return false;
        }

        for (let i = 0; i < this.qcmAnswers.length; i++) {
            const choice1: Choice = this.qcmAnswers[i];
            const choice2: Choice = playerAnswers.qcmAnswers[i];

            if (choice1.isCorrect !== choice2.isCorrect || choice1.text !== choice2.text) {
                return false;
            }
        }

        return true;
    }
}
