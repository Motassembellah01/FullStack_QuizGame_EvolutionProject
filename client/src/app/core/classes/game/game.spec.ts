import { Question } from '@app/core/classes/question/question';
import { ERROR_MESSAGE_FOR, QCM_TIME } from '@app/core/constants/constants';
import { QUESTIONS } from '@app/core/data/data';
import { Game } from './game';

describe('Game', () => {
    let mockedGame: Game;
    const questionsMock: Question[] = QUESTIONS.map((obj) => new Question(obj));
    beforeEach(() => {
        mockedGame = new Game({
            id: 'testId',
            title: 'TestTitle',
            description: 'TestDescription',
            duration: 0,
            lastModification: '',
            questions: questionsMock,
            isVisible: false,
        });
    });

    it('should create an instance', () => {
        expect(new Game()).toBeTruthy();
    });

    it('should return an instance', () => {
        const gameInstance = Game.parseGame(new Game());
        expect(gameInstance).toBeTruthy();
    });

    it('should return many instances', () => {
        const gameInstances = Game.parseGames([new Game()]);
        gameInstances.forEach((gameInstance) => {
            expect(gameInstance).toBeTruthy();
        });
    });

    it('should be last question', () => {
        const result = mockedGame.isLastQuestion(questionsMock[questionsMock.length - 1]);
        expect(result).toBeTrue();
    });

    it('validateGame should return add an error to the list if game does not exist', () => {
        spyOn(mockedGame, 'validateOtherAttributes').and.returnValue([ERROR_MESSAGE_FOR.existingName]);
        expect(mockedGame.validateGame(true)).toContain(ERROR_MESSAGE_FOR.existingName);
    });
    it('validateGame should not change error list if name exist', () => {
        spyOn(mockedGame, 'validateOtherAttributes').and.returnValue([]);
        expect(mockedGame.validateGame(false)).toEqual([]);
    });
    it('validateOtherAttributes should add an error', () => {
        spyOn(mockedGame, 'validateTextField').and.returnValue(false);
        spyOn(mockedGame, 'validateQcmTime').and.returnValue(false);
        spyOn(mockedGame, 'hasAtLeastOneQuestion').and.returnValue(false);
        expect(mockedGame.validateOtherAttributes()).toEqual([
            ERROR_MESSAGE_FOR.name,
            ERROR_MESSAGE_FOR.description,
            ERROR_MESSAGE_FOR.qcmTime,
            ERROR_MESSAGE_FOR.questions,
        ]);
    });
    it('validateOtherAttributes should not add an error il all field are filled', () => {
        spyOn(mockedGame, 'validateTextField').and.returnValue(true);
        spyOn(mockedGame, 'validateQcmTime').and.returnValue(true);
        spyOn(mockedGame, 'hasAtLeastOneQuestion').and.returnValue(true);
        expect(mockedGame.validateOtherAttributes()).toEqual([]);
    });

    it('validateAttributesTypes should return an error if attribute are not filled ', () => {
        spyOn(Game, 'validateNameType').and.returnValue(ERROR_MESSAGE_FOR.nameType);
        spyOn(Game, 'validateDescriptionType').and.returnValue(ERROR_MESSAGE_FOR.descriptionType);
        spyOn(Game, 'validateQcmTimeType').and.returnValue(ERROR_MESSAGE_FOR.qcmTimeType);
        spyOn(Game, 'validateQuestionsArray').and.returnValue(ERROR_MESSAGE_FOR.questionsType);

        expect(Game.validateAttributesTypes(mockedGame)).toEqual([
            ERROR_MESSAGE_FOR.nameType,
            ERROR_MESSAGE_FOR.descriptionType,
            ERROR_MESSAGE_FOR.qcmTimeType,
            ERROR_MESSAGE_FOR.questionsType,
        ]);
    });
    it('validateAttributesTypes should return an empty list if all attributes are correct', () => {
        spyOn(Game, 'validateNameType').and.returnValue('');
        spyOn(Game, 'validateDescriptionType').and.returnValue('');
        spyOn(Game, 'validateQcmTimeType').and.returnValue('');
        spyOn(Game, 'validateQuestionsArray').and.returnValue('');
        expect(Game.validateAttributesTypes(mockedGame)).toEqual([]);
    });

    it('validateNameType should return empty string if name is defined', () => {
        mockedGame.title = 'testTitle';
        const returnValue: string = Game.validateNameType(mockedGame);
        expect(returnValue).toEqual('');
    });
    it('validateNameType should return an error message if name is undefined', () => {
        mockedGame.title = undefined as unknown as string;
        const returnValue: string = Game.validateNameType(mockedGame);
        expect(returnValue).toEqual(ERROR_MESSAGE_FOR.nameType);
    });

    it('validateDescriptionType should return empty string if name is defined', () => {
        mockedGame.description = 'testDescription';
        const returnValue: string = Game.validateDescriptionType(mockedGame);
        expect(returnValue).toEqual('');
    });
    it('validateDescriptionType should return an error message if name is undefined', () => {
        mockedGame.description = undefined as unknown as string;
        const returnValue: string = Game.validateDescriptionType(mockedGame);
        expect(returnValue).toEqual(ERROR_MESSAGE_FOR.descriptionType);
    });

    it('validateQcmTimeType should return empty string if name is defined', () => {
        mockedGame.duration = 1;
        const returnValue: string = Game.validateQcmTimeType(mockedGame);
        expect(returnValue).toEqual('');
    });
    it('validateQcmTimeType should return an error message if name is undefined', () => {
        mockedGame.duration = undefined as unknown as number;
        const returnValue: string = Game.validateQcmTimeType(mockedGame);
        expect(returnValue).toEqual(ERROR_MESSAGE_FOR.qcmTimeType);
    });

    it('validateQuestionsArray should return empty string if name is defined', () => {
        const returnValue: string = Game.validateQuestionsArray(mockedGame);
        expect(returnValue).toEqual('');
    });
    it('validateQuestionsArray should return an error message if name is undefined', () => {
        mockedGame.questions = undefined as unknown as [];
        const returnValue: string = Game.validateQuestionsArray(mockedGame);
        expect(returnValue).toEqual(ERROR_MESSAGE_FOR.questionsType);
    });

    it('hasAtLeastOneQuestion should return true if there is at least one question', () => {
        const returnValue: boolean = mockedGame.hasAtLeastOneQuestion();
        expect(returnValue).toEqual(true);
    });
    it('validateQcmTimeType should return true when time is valid', () => {
        mockedGame.questions = [];
        const returnValue: boolean = mockedGame.validateQcmTime(QCM_TIME.min);
        expect(returnValue).toEqual(true);
    });
    it('validateTextField should return true when text is valid', () => {
        const returnValue: boolean = mockedGame.validateTextField('test');
        expect(returnValue).toEqual(true);
    });
});
