import { Choice } from '@app/interfaces/choice';
import { Question } from './question';

describe('Question', () => {
    it('should be defined', () => {
        expect(new Question()).toBeDefined();
    });

    describe('getRightChoicesNumber', () => {
        it('should return the number of correct choices in the question', () => {
            const choices: Choice[] = [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
                { text: 'Choice 3', isCorrect: true },
            ];
            const question = new Question({ choices });

            const result = question.getRightChoicesNumber();

            expect(result).toBe(2);
        });
        it('should return 0 if there are no correct choices in the question', () => {
            const question = new Question();
            const choices: Choice[] = [
                { text: 'Choice 1', isCorrect: false },
                { text: 'Choice 2', isCorrect: false },
                { text: 'Choice 3', isCorrect: false },
            ];
            question.choices = choices;

            const result = question.getRightChoicesNumber();

            expect(result).toBe(0);
        });

        it('should return 0 if there are no choices in the question', () => {
            const question = new Question();

            const result = question.getRightChoicesNumber();

            expect(result).toBe(0);
        });
    });
});
