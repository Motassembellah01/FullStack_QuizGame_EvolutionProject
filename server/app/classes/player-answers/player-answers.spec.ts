import { PlayerAnswers } from './player-answers';

describe('PlayerAnswers', () => {
    it('should create an instance', () => {
        expect(new PlayerAnswers()).toBeTruthy();
    });

    describe('arePlayerAnswersEqual', () => {
        it('should return true for equal player answers', () => {
            const playerAnswers1 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
                isFirstAttempt: true,
            });

            const playerAnswers2 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
                isFirstAttempt: false,
            });

            expect(playerAnswers1.arePlayerAnswersEqual(playerAnswers2)).toBeTruthy();
        });

        it('should return false for different number of answers', () => {
            const playerAnswers1 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
            });

            const playerAnswers2 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                qcmAnswers: [{ text: 'Choice 1', isCorrect: true }],
            });

            expect(playerAnswers1.arePlayerAnswersEqual(playerAnswers2)).toBeFalsy();
        });

        it('should return false for different player names', () => {
            const playerAnswers1 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
            });

            const playerAnswers2 = new PlayerAnswers({
                name: 'Player2',
                questionId: 'Q1',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
            });

            expect(playerAnswers1.arePlayerAnswersEqual(playerAnswers2)).toBeFalsy();
        });

        it('should return false for different question IDs', () => {
            const playerAnswers1 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
            });

            const playerAnswers2 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q2',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
            });

            expect(playerAnswers1.arePlayerAnswersEqual(playerAnswers2)).toBeFalsy();
        });

        it('should return false for different answers', () => {
            const playerAnswers1 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
            });

            const playerAnswers2 = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                qcmAnswers: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 3', isCorrect: false },
                ],
            });

            expect(playerAnswers1.arePlayerAnswersEqual(playerAnswers2)).toBeFalsy();
        });
    });
});
