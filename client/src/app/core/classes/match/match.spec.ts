import { Game } from '@app/core/classes/game/game';
import { Question } from '@app/core/classes/question/question';
import { ERRORS } from '@app/core/constants/constants';
import { GAMES, OPTIONS, PLAYER, PLAYER_ANSWERS } from '@app/core/data/data';
import { Choice } from '@app/core/interfaces/choice';
import { Player } from '@app/core/interfaces/player';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { Match } from './match';

describe('Match', () => {
    const playerMock: Player = JSON.parse(JSON.stringify(PLAYER));
    const gameMock: Game = JSON.parse(JSON.stringify(GAMES[0]));
    const playerAnswerMock: PlayerAnswers = JSON.parse(JSON.stringify(PLAYER_ANSWERS));
    const matchInstance: Match = new Match({
        game: new Game(gameMock),
        begin: '',
        end: '',
        bestScore: 0,
        accessCode: '',
        testing: false,
        players: [],
        managerName: '',
        isAccessible: true,
        bannedNames: [],
        playerAnswers: [],
        panicMode: false,
        timer: 0,
        timing: true,
    });

    it('should create an instance', () => {
        expect(new Match()).toBeTruthy();
    });

    it('should return an instance', () => {
        const matchParsedInstance = Match.parseMatch(matchInstance);
        expect(matchParsedInstance).toBeTruthy();
    });

    it('should set match timer', () => {
        const match = new Match({
            game: new Game(gameMock),
            begin: '',
            end: '',
            bestScore: 0,
            accessCode: '',
            testing: false,
            players: [],
            managerName: '',
            isAccessible: true,
            bannedNames: [],
            playerAnswers: [],
            panicMode: false,
            timer: 0,
            timing: true,
        });
        match.setTimerValue();
        expect(match.timer).toEqual(GAMES[0].duration);
    });

    it('should return the right players answers index', () => {
        playerAnswerMock.questionId = matchInstance.game.questions[0].id;
        playerMock.name = playerAnswerMock.name;
        matchInstance.playerAnswers = [playerAnswerMock];

        const result = matchInstance.getPlayerAnswersIndex(playerMock, playerAnswerMock.questionId);
        expect(result).toEqual(0);
    });

    it('should return the index of the answer if found getAnswerIndex', () => {
        playerAnswerMock.questionId = matchInstance.game.questions[0].id;
        playerMock.name = playerAnswerMock.name;
        matchInstance.playerAnswers = [playerAnswerMock];
        const result = matchInstance.getAnswerIndex(playerMock, playerAnswerMock.questionId, playerAnswerMock.qcmAnswers[0]);
        expect(result).toBe(0);
    });

    it("should return false when a player didn't answer", () => {
        playerAnswerMock.questionId = matchInstance.game.questions[0].id;
        playerMock.name = playerAnswerMock.name;
        matchInstance.playerAnswers = [playerAnswerMock];
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(ERRORS.noIndexFound);
        const result = matchInstance.didPlayerAnswer(playerMock, playerAnswerMock.qcmAnswers[0], playerAnswerMock.questionId);

        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toBe(false);
    });
    it('should return true when a player did answer', () => {
        matchInstance.playerAnswers = [playerAnswerMock];
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        const result = matchInstance.didPlayerAnswer(playerMock, playerAnswerMock.qcmAnswers[0], playerAnswerMock.questionId);

        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toEqual(true);
    });

    it('should set an answer final to true when calling setAnswersAsFinal', () => {
        playerAnswerMock.questionId = matchInstance.game.questions[0].id;
        playerMock.name = playerAnswerMock.name;
        matchInstance.playerAnswers = [playerAnswerMock];
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        matchInstance.setAnswersAsFinal(playerMock, playerAnswerMock.questionId);

        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(matchInstance.playerAnswers[0].final).toBe(true);
    });

    it('should return true if an answer is final isFinalAnswer', () => {
        playerAnswerMock.questionId = matchInstance.game.questions[0].id;
        playerMock.name = playerAnswerMock.name;
        matchInstance.playerAnswers = [playerAnswerMock];
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        const result = matchInstance.isFinalAnswer(playerMock, playerAnswerMock.questionId);

        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toEqual(matchInstance.playerAnswers[0].final);
    });

    it('should return false if an answer is final isFinalAnswer', () => {
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(ERRORS.noIndexFound);
        const result = matchInstance.isFinalAnswer(playerMock, playerAnswerMock.questionId);
        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toEqual(false);
    });

    it('should return false if player did not answer', () => {
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        matchInstance.playerAnswers = [];
        const result = matchInstance.evaluateQuestion(playerMock, new Question(matchInstance.game.questions[0]));

        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toBe(false);
    });
    it('should return false if answer index is invalid', () => {
        matchInstance.playerAnswers = [playerAnswerMock];
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(2);
        const result = matchInstance.evaluateQuestion(playerMock, new Question(matchInstance.game.questions[0]));
        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toBe(false);
    });
    it('should return false if answer is badly respond', () => {
        playerAnswerMock.questionId = matchInstance.game.questions[0].id;
        playerMock.name = playerAnswerMock.name;
        matchInstance.playerAnswers = [playerAnswerMock];
        playerAnswerMock.qcmAnswers.forEach((answer) => {
            answer.isCorrect = false;
        });
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        const result = matchInstance.evaluateQuestion(playerMock, new Question(matchInstance.game.questions[0]));
        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toBe(false);
    });
    it('should return false if right number of choices are not made', () => {
        matchInstance.playerAnswers = [playerAnswerMock];
        matchInstance.playerAnswers[0].qcmAnswers = OPTIONS.map((obj) => Object.assign({ ...obj }));
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        const questionMock: Question = new Question(matchInstance.game.questions[0]);
        const N_RIGHT_CHOICES = 5;
        spyOn(questionMock, 'getRightChoicesNumber').and.returnValue(N_RIGHT_CHOICES);
        matchInstance.playerAnswers[0].qcmAnswers.forEach((answer) => {
            answer.isCorrect = true;
        });

        const result = matchInstance.evaluateQuestion(playerMock, questionMock);
        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toBe(false);
    });
    it('should return true if right number of choices are made correctly', () => {
        matchInstance.playerAnswers = [playerAnswerMock];
        matchInstance.playerAnswers[0].qcmAnswers = OPTIONS.map((obj) => Object.assign({ ...obj }));
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        const questionMock: Question = new Question(matchInstance.game.questions[0]);
        const N_RIGHT_CHOICES = 4;
        spyOn(questionMock, 'getRightChoicesNumber').and.returnValue(N_RIGHT_CHOICES);
        matchInstance.playerAnswers[0].qcmAnswers.forEach((answer) => {
            answer.isCorrect = true;
        });

        const result = matchInstance.evaluateQuestion(playerMock, questionMock);
        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should remove answer when updating answer', () => {
        playerAnswerMock.qcmAnswers = OPTIONS.map((obj) => Object.assign({ ...obj }));
        const previousLength = playerAnswerMock.qcmAnswers.length;
        matchInstance.playerAnswers = [playerAnswerMock];
        const choiceMock: Choice = { text: 'TestChoice', isCorrect: true };
        const questionMock: Question = new Question(matchInstance.game.questions[0]);
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        spyOn(matchInstance, 'getAnswerIndex').and.returnValue(0);
        spyOn(matchInstance, 'didPlayerAnswer').and.returnValue(true);
        matchInstance.updateAnswer(playerMock, questionMock, choiceMock);
        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(matchInstance.didPlayerAnswer).toHaveBeenCalled();
        expect(matchInstance.getAnswerIndex).toHaveBeenCalled();
        expect(matchInstance.playerAnswers.length).toBe(1);
        expect(matchInstance.playerAnswers[0].qcmAnswers.length).toBe(previousLength - 1);
    });
    it('should fail updating when answer does not exist', () => {
        matchInstance.playerAnswers = [playerAnswerMock];
        matchInstance.playerAnswers[0].qcmAnswers = OPTIONS.map((obj) => Object.assign({ ...obj }));
        const NEW_LENGTH = 5;
        const choiceMock: Choice = { text: 'TestChoice', isCorrect: true };
        const questionMock: Question = new Question(matchInstance.game.questions[0]);
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(0);
        spyOn(matchInstance, 'didPlayerAnswer').and.returnValue(false);
        spyOn(matchInstance, 'getAnswerIndex').and.returnValue(0);
        matchInstance.updateAnswer(playerMock, questionMock, choiceMock);
        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(matchInstance.didPlayerAnswer).toHaveBeenCalled();
        expect(matchInstance.playerAnswers[0].qcmAnswers.length).toBe(NEW_LENGTH);
    });
    it('should fail updating when answer index does not exist', () => {
        matchInstance.playerAnswers = [playerAnswerMock];
        const choiceMock: Choice = { text: 'TestChoice', isCorrect: true };
        spyOn(matchInstance, 'getPlayerAnswersIndex').and.returnValue(ERRORS.noIndexFound);
        matchInstance.updateAnswer(playerMock, new Question(), choiceMock);
        expect(matchInstance.getPlayerAnswersIndex).toHaveBeenCalled();
        expect(matchInstance.playerAnswers.length).toBe(2);
    });

    it('should return right player index', () => {
        const N_PLAYERS = 3;
        const playersMock: Player[] = [];
        for (let index = 0; index < N_PLAYERS; index++) {
            const newPlayer: Player = {
                name: index.toString(),
                isActive: false,
                score: 0,
                nBonusObtained: 0,
                chatBlocked: false,
            };
            playersMock.push(newPlayer);
        }
        matchInstance.players = playersMock;
        const result = matchInstance.findPlayerIndexByName('1');
        expect(result).toBe(1);
    });

    it('should update score and nBonusObtained', () => {
        matchInstance.players = [playerMock];
        spyOn(matchInstance, 'findPlayerIndexByName').and.returnValue(0);
        const updatedPlayer: Player = {
            name: playerMock.name,
            isActive: false,
            score: 12,
            nBonusObtained: 2,
            chatBlocked: false,
        };
        matchInstance.updatePlayerStats(updatedPlayer);
        expect(matchInstance.players[0].score).toBe(updatedPlayer.score);
        expect(matchInstance.players[0].nBonusObtained).toBe(updatedPlayer.nBonusObtained);
    });

    it('should return player score if player found', () => {
        matchInstance.players = [playerMock];
        spyOn(matchInstance, 'findPlayerIndexByName').and.returnValue(0);
        const score = matchInstance.getScoreOfPlayerByName(playerMock.name);
        expect(score).toBe(playerMock.score);
    });

    it('should return null if player not found', () => {
        matchInstance.players = [playerMock];
        spyOn(matchInstance, 'findPlayerIndexByName').and.returnValue(ERRORS.noIndexFound);
        const score = matchInstance.getScoreOfPlayerByName(playerMock.name);
        expect(score).toBeNull();
    });
});
