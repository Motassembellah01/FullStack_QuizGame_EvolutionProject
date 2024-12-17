import { OPTIONS } from '@app/core/data/data';
import { Choice } from '@app/core/interfaces/choice';
import { Question } from './question';

describe('Question', () => {
    const choicesMock: Choice[] = OPTIONS.map((obj) => ({ ...obj }));

    it('should create an instance', () => {
        expect(new Question()).toBeTruthy();
    });

    it('getRightChoicesNumber should return the right number', () => {
        const questionMock = new Question({
            id: '',
            type: '',
            text: '',
            points: 0,
            choices: choicesMock,
            timeAllowed: 0,
        });

        const result = questionMock.getRightChoicesNumber();
        const expected = 1;
        expect(result).toEqual(expected);
    });
});
