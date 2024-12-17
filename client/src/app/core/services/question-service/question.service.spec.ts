import { TestBed } from '@angular/core/testing';
import { Game } from '@app/core/classes/game/game';
import { Question } from '@app/core/classes/question/question';
import { CHAR_SETS } from '@app/core/constants/constants';
import { BAD_CHOICES, GAMES, INVALID_QUESTIONS, NO_BAD_CHOICE, NO_GOOD_CHOICE, QUESTIONS, SAME_TEXT, UNIQUE_TEXTS } from '@app/core/data/data';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionService } from '@app/core/services/question-service/question.service';

describe('QuestionService', () => {
    let service: QuestionService;
    let alertSpy: jasmine.Spy;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    const mockQuestion: Question[] = Object.assign(QUESTIONS.map((obj) => ({ ...obj })));

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: MatchPlayerService, useValue: matchPlayerServiceSpy }],
        });
        service = TestBed.inject(QuestionService);
        alertSpy = spyOn(window, 'alert').and.stub();
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', ['match']);
        matchPlayerServiceSpy.match.game = new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0]);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    describe('resetQuestions', () => {
        it('should reset questions', () => {
            service.questions = Object.assign(QUESTIONS);
            expect(service.questions.length).toBe(QUESTIONS.length);
            service.resetQuestions();
            expect(service.questions.length).toBe(0);
        });
    });
    describe('getQuestionByIndex', () => {
        it('should return the correct question by index', () => {
            const indexToTest = 0;
            const expectedQuestion = mockQuestion[indexToTest];
            service.questions = mockQuestion;
            const result = service.getQuestionByIndex(indexToTest);
            expect(result).toEqual(expectedQuestion);
        });
        it('should return undefined for an invalid index', () => {
            const invalidIndex = mockQuestion.length + 1;
            service.questions = mockQuestion;
            const result = service.getQuestionByIndex(invalidIndex);
            expect(result).toBeUndefined();
        });
    });
    describe('addQuestion', () => {
        it('should add a question when valid', () => {
            const validQuestion = mockQuestion[0];
            spyOn(service, 'generateId');
            expect(service.addQuestion(validQuestion)).toBe(true);
            expect(service.questions.length).toBe(1);
            expect(service.generateId).toHaveBeenCalled();
        });
        it('should not add a question when invalid', () => {
            const invalidQuestion: Question = INVALID_QUESTIONS.map((obj) => Object.assign({ ...obj }))[0];
            spyOn(service, 'displayErrors');
            expect(service.addQuestion(invalidQuestion)).toBe(false);
            expect(service.questions.length).toBe(0);
            expect(service.displayErrors).toHaveBeenCalled();
        });
    });
    describe('displayErrors', () => {
        it('should display errors in an alert', () => {
            service.errorMessages = ['Error 1', 'Error 2', 'Error 3'];
            service.displayErrors();
            expect(alertSpy).toHaveBeenCalledWith(
                "L'enregistrement de la question a échoué à cause des erreurs suivantes : \nError 1\nError 2\nError 3",
            );
            expect(service.errorMessages.length).toBe(0);
        });
        it('should display no errors in an alert when errorMessages is empty', () => {
            service.errorMessages = [];
            service.displayErrors();
            expect(alertSpy).not.toHaveBeenCalled();
            expect(service.errorMessages.length).toBe(0);
        });
    });
    describe('cancelQuestionModification', () => {
        it('should cancel question modification and revert to previous question', () => {
            const originalQuestion: Question = mockQuestion[0];
            const modifiedQuestion: Question = new Question({ ...originalQuestion });
            modifiedQuestion.text = 'modifiedText';
            service.questions = [modifiedQuestion];
            expect(service.questions.length).toBe(1);
            service.cancelQuestionModification(originalQuestion, 0);
            expect(service.questions.length).toBe(1);
            expect(service.questions[0]).toEqual(originalQuestion);
        });
        it('should not modify questions when index is out of range', () => {
            const originalQuestion: Question = mockQuestion[0];
            const modifiedQuestion: Question = new Question({ ...originalQuestion });
            modifiedQuestion.text = 'modifiedText';
            service.questions = [modifiedQuestion];
            expect(service.questions.length).toBe(1);
            service.cancelQuestionModification(originalQuestion, 1);
            expect(service.questions.length).toBe(1);
            expect(service.questions[0]).toEqual(modifiedQuestion);
        });
    });
    describe('generateId', () => {
        it('should generate a string of the specified length using the given charset', () => {
            const length = 10;
            const generatedId = service.generateId(length);
            expect(generatedId.length).toBe(length);
            for (let i = 0; i < generatedId.length; i++) {
                const char = generatedId.charAt(i);
                expect(CHAR_SETS.id.includes(char)).toBe(true);
            }
        });
    });
    describe('validateTextField', () => {
        it('should return true for a non-empty string', () => {
            const nonEmptyString = 'Good Text';
            const isValid = service.validateTextField(nonEmptyString);
            expect(isValid).toBe(true);
        });

        it('should return false for an empty string', () => {
            const emptyString = '';
            const isValid = service.validateTextField(emptyString);
            expect(isValid).toBe(false);
        });
        it('should return false for a string with only spaces', () => {
            const spacesString = '    ';
            const isValid = service.validateTextField(spacesString);
            expect(isValid).toBe(false);
        });
    });
    describe('validateQuestionsInputs', () => {
        it('should validate a valid question', () => {
            const validQuestion = mockQuestion[0];
            const isValid = service.validateQuestionsInputs(validQuestion);
            expect(isValid).toBe(true);
            expect(service.errorMessages.length).toBe(0);
        });
        it('should not validate a question with invalid points', () => {
            const isValid = service.validateQuestionsInputs(INVALID_QUESTIONS.map((obj) => Object.assign({ ...obj }))[0]);
            expect(isValid).toBe(false);
            expect(service.errorMessages.length).toBe(1);
            expect(service.errorMessages).toContain('\n- Les points accordés à la question doivent être entre 10 et 100 points');
        });
        it('should not validate a question with invalid statement', () => {
            const isValid = service.validateQuestionsInputs(INVALID_QUESTIONS.map((obj) => Object.assign({ ...obj }))[1]);
            expect(isValid).toBe(false);
            expect(service.errorMessages.length).toBe(1);
            expect(service.errorMessages).toContain("\n- L'énoncé de la question est requis");
        });
        it('should not validate a question with invalid statement', () => {
            const isValid = service.validateQuestionsInputs(INVALID_QUESTIONS.map((obj) => Object.assign({ ...obj }))[2]);
            expect(isValid).toBe(false);
            expect(service.errorMessages.length).toBe(1);
            expect(service.errorMessages).toContain("\n- Le type de la question n'a pas été choisi");
        });
    });
    describe('validateQcmAnswers', () => {
        it('should validate when all choices are valid', () => {
            const isValid = service.validateQcmAnswers(mockQuestion[0].choices);
            expect(isValid).toBe(true);
            expect(service.errorMessages.length).toBe(0);
        });
        it('should not validate when there is no good choice', () => {
            const isValid = service.validateQcmAnswers(NO_GOOD_CHOICE.map((obj) => Object.assign({ ...obj })));
            expect(isValid).toBe(false);
            expect(service.errorMessages).toContain('\n- La question doit avoir au moins une bonne réponse parmi les choix');
        });
        it('should not validate when choices texts are not unique', () => {
            const isValid = service.validateQcmAnswers(SAME_TEXT.map((obj) => Object.assign({ ...obj })));
            expect(isValid).toBe(false);
            expect(service.errorMessages).toContain('\n- Chaque choix de réponse doit contenir une réponse unique');
        });
        it('should not validate when there is no bad choice', () => {
            const isValid = service.validateQcmAnswers(NO_BAD_CHOICE.map((obj) => Object.assign({ ...obj })));
            expect(isValid).toBe(false);
            expect(service.errorMessages).toContain('\n- La question doit avoir au moins une mauvaise réponse parmi les choix');
        });
        it('should not validate when choices text is empty', () => {
            const isValid = service.validateQcmAnswers(BAD_CHOICES.map((obj) => Object.assign({ ...obj })));
            expect(isValid).toBe(false);
            expect(service.errorMessages).toContain("\n- Le texte d'un ou plusieurs choix de réponse n'a pas été saisi");
        });
        it('should return false when choices array is empty', () => {
            const isValid = service.validateQcmAnswers([]);
            expect(isValid).toBe(false);
            expect(service.errorMessages).toContain('\n- La question doit contenir des choix de réponse');
        });
    });
    describe('hasGoodChoice', () => {
        it('should return true when at least one choice is correct', () => {
            const choicesWithGood = mockQuestion[0].choices;
            const result = service.hasGoodChoice(choicesWithGood);
            expect(result).toBe(true);
        });
        it('should return false when there are no correct choices', () => {
            const choicesWithoutGood = NO_GOOD_CHOICE.map((obj) => Object.assign({ ...obj }));
            const result = service.hasGoodChoice(choicesWithoutGood);
            expect(result).toBe(false);
        });
        it('should return false when choices array is empty', () => {
            const result = service.hasGoodChoice([]);
            expect(result).toBe(false);
        });
    });
    describe('hasBadChoice', () => {
        it('should return true when at least one choice is incorrect', () => {
            const choicesWithBad = mockQuestion[0].choices;
            const result = service.hasBadChoice(choicesWithBad);
            expect(result).toBe(true);
        });
        it('should return false when there are no incorrect choices', () => {
            const choicesWithoutBad = NO_BAD_CHOICE.map((obj) => Object.assign({ ...obj }));
            const result = service.hasBadChoice(choicesWithoutBad);
            expect(result).toBe(false);
        });
        it('should return false when choices array is empty', () => {
            const result = service.hasBadChoice([]);
            expect(result).toBe(false);
        });
    });
    describe('validateAllQuestions', () => {
        it('should return true when all questions are valid', () => {
            service.questions = mockQuestion;
            const isValid = service.validateAllQuestions();
            expect(isValid).toBe(true);
        });
        it('should return false when at least one question is invalid', () => {
            service.questions = [mockQuestion[0], INVALID_QUESTIONS[0]];
            const isValid = service.validateAllQuestions();
            expect(isValid).toBe(false);
        });
        it('should return false when all questions are invalid', () => {
            service.questions = INVALID_QUESTIONS;
            const isValid = service.validateAllQuestions();
            expect(isValid).toBe(false);
        });
        it('should return false when there are no questions', () => {
            service.questions = [];
            const isValid = service.validateAllQuestions();
            expect(isValid).toBe(false);
        });
    });
    describe('validateQuestion', () => {
        it('should validate a valid QCM question', () => {
            const isValid = service.validateQuestion(mockQuestion[0]);
            expect(isValid).toBe(true);
        });
        it('should validate a valid QRL question', () => {
            const isValid = service.validateQuestion(mockQuestion[5]);
            expect(isValid).toBe(true);
        });
        it('should not validate an invalid question', () => {
            INVALID_QUESTIONS.forEach((invalidQuestion) => {
                const isValid = service.validateQuestion(invalidQuestion);
                expect(isValid).toBe(false);
            });
        });
    });
    describe('validateUpdatedQuestion', () => {
        it('should return true when the updated question is valid', () => {
            spyOn(service, 'displayErrors');
            const isValid = service.validateUpdatedQuestion(mockQuestion[0]);
            expect(isValid).toBe(true);
            expect(service.displayErrors).not.toHaveBeenCalled();
        });
        it('should return false when the updated question is invalid', () => {
            spyOn(service, 'displayErrors');
            const isValid = service.validateUpdatedQuestion(INVALID_QUESTIONS[0]);
            expect(isValid).toBe(false);
            expect(service.displayErrors).toHaveBeenCalled();
        });
    });
    describe('validatePoints', () => {
        it('should return true for valid points within the range 10 to 100', () => {
            const validPoints = 50;
            const isValid = service.validatePoints(validPoints);
            expect(isValid).toBe(true);
        });
        it('should return false for points below the minimum value of 10', () => {
            const invalidPoints = 5;
            const isValid = service.validatePoints(invalidPoints);
            expect(isValid).toBe(false);
        });
        it('should return false for points above the maximum value of 100', () => {
            const invalidPoints = 105;
            const isValid = service.validatePoints(invalidPoints);
            expect(isValid).toBe(false);
        });
    });
    describe('validateChoicesTexts', () => {
        it('should return true for unique choices', () => {
            const isValid = service.validateChoicesTexts(UNIQUE_TEXTS.map((obj) => Object.assign({ ...obj })));
            expect(isValid).toBe(true);
        });
        it('should return false for same choices', () => {
            const isValid = service.validateChoicesTexts(SAME_TEXT.map((obj) => Object.assign({ ...obj })));
            expect(isValid).toBe(false);
        });
    });
});
