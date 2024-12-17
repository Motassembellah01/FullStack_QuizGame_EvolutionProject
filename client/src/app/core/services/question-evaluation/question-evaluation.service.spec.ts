import { TestBed } from '@angular/core/testing';

import { Match } from '@app/core/classes/match/match';
import { Question } from '@app/core/classes/question/question';
import { ERRORS, FACTORS, SocketsSendEvents } from '@app/core/constants/constants';
import { ACTIVE_PLAYERS, EVALUATION_ACTIVE_PLAYERS, EVALUATION_PLAYERS, EXAMPLES, GAMES, PLAYER_ANSWERS, QRL_QUESTIONS } from '@app/core/data/data';
import { IMatch } from '@app/core/interfaces/i-match';
import { Player } from '@app/core/interfaces/player';
import { QuestionRequest } from '@app/core/interfaces/question-request';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/core/services/question-evaluation/question-evaluation.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';

describe('QuestionEvaluationService', () => {
    let service: QuestionEvaluationService;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    const mockQuestion: Question = QRL_QUESTIONS.map((obj) => Object.assign({ ...obj }))[0];
    const mockPlayersNames: string[] = ['player 1', 'player 2'];
    const iMatchMock: IMatch = {
        game: Object.assign(GAMES[0]),
        begin: '',
        end: '',
        bestScore: 0,
        accessCode: '1234',
        testing: false,
        players: EVALUATION_PLAYERS.map((obj) => Object.assign({ ...obj })),
        managerName: 'organisateur',
        isAccessible: true,
        bannedNames: ['organisateur', 'système'],
        playerAnswers: [],
        panicMode: false,
        timer: 0,
        timing: true,
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: HistogramService, useValue: histogramServiceSpy },
            ],
        });
        service = TestBed.inject(QuestionEvaluationService);

        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', ['match', 'currentQuestion', 'hasQuestionEvaluationBegun']);
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['isShowingQuestionResults']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['send']);
        matchPlayerServiceSpy.match = new Match(iMatchMock);
        matchPlayerServiceSpy.currentQuestion = mockQuestion;
        matchPlayerServiceSpy.socketService = socketServiceSpy;
        service.matchPlayerService = matchPlayerServiceSpy;
        service.histogramService = histogramServiceSpy;
    });

    describe('creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('setPlayersNamesList', () => {
        it('should call setPlayerByIndex with right parameter', () => {
            const setPlayerByIndexSpy = spyOn(service, 'setPlayerByIndex');
            service.setPlayersNamesList();
            expect(setPlayerByIndexSpy).toHaveBeenCalledWith(0);
        });
        it('should set playersNames attribut with right value', () => {
            service.setPlayersNamesList();
            expect(service.playersNames).toEqual(mockPlayersNames);
        });
    });

    describe('setCurrentNoteFactor', () => {
        it('should set currentNoteFactor attribut with right value', () => {
            const note = EXAMPLES.qrlFullNote;
            const expectedFactor = note / FACTORS.percentage;
            service.setCurrentNoteFactor(note);
            expect(service.currentNoteFactor).toEqual(expectedFactor);
        });
    });

    describe('setQuestionPoints', () => {
        it('should set currentQuestionPoints and questionsStats attributes with right values', () => {
            histogramServiceSpy.questionsStats = new Map();
            service.setQuestionPoints();
            expect(service.currentQuestionPoints).toEqual(mockQuestion.points);
            expect(histogramServiceSpy.questionsStats.has(mockQuestion.id)).toBeTruthy();
        });
    });

    describe('updateScoreAfterQrlQuestion', () => {
        it('should set currentPlayer.score and questionsStats attributes with right values and call sendUpdateScoreEvent and setNextPlayer', () => {
            const sendUpdateScoreEventSpy = spyOn(service, 'sendUpdateScoreEvent').and.callFake(() => {
                return;
            });
            const setNextPlayerSpy = spyOn(service, 'setNextPlayer').and.callFake(() => {
                return;
            });
            histogramServiceSpy.questionsStats = new Map();
            service.setQuestionPoints();
            service.setPlayersNamesList();
            service.setCurrentNoteFactor(EXAMPLES.qrlHalfNote);
            const noteFactor = EXAMPLES.qrlHalfNote / FACTORS.percentage;
            let expectedScore = noteFactor * mockQuestion.points;
            expectedScore += EVALUATION_PLAYERS.map((obj) => Object.assign({ ...obj }))[0].score;
            const expectedNoteFactorsList = [noteFactor];

            service.updateScoreAfterQrlQuestion();

            expect(sendUpdateScoreEventSpy).toHaveBeenCalled();
            expect(setNextPlayerSpy).toHaveBeenCalled();
            expect(service.currentPlayer.score).toEqual(expectedScore);
            expect(histogramServiceSpy.questionsStats.get(mockQuestion.id)).toEqual(expectedNoteFactorsList);
        });
    });

    describe('sendUpdateScoreEvent', () => {
        it('should send UpdateScore event', () => {
            matchPlayerServiceSpy.hasQuestionEvaluationBegun = false;
            const config: QuestionRequest = {
                matchAccessCode: matchPlayerServiceSpy.match.accessCode,
                player: matchPlayerServiceSpy.match.players[0],
                questionId: matchPlayerServiceSpy.currentQuestion.id,
                hasQrlEvaluationBegun: false,
            };
            service.setPlayersNamesList();
            service.sendUpdateScoreEvent();
            expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.UpdateScore, config);
        });
    });

    describe('setNextPlayer', () => {
        it('should increment nPlayersEvaluated and call setPlayerByIndex, setPlayerAnswer and handleLastPlayerEvaluation', () => {
            service.nPlayersEvaluated = 0;
            const handleLastPlayerSpy = spyOn(service, 'handleLastPlayerEvaluation').and.callFake(() => {
                return;
            });
            const setPlayerByIndexSpy = spyOn(service, 'setPlayerByIndex').and.callFake(() => {
                return;
            });
            const setPlayerAnswerSpy = spyOn(service, 'setPlayerAnswer').and.callFake(() => {
                return;
            });
            service.setNextPlayer();
            expect(service.nPlayersEvaluated).toEqual(1);
            expect(handleLastPlayerSpy).toHaveBeenCalled();
            expect(setPlayerByIndexSpy).toHaveBeenCalledWith(service.nPlayersEvaluated);
            expect(setPlayerAnswerSpy).toHaveBeenCalled();
        });
    });

    describe('handleLastPlayerEvaluation', () => {
        it('should call cleanServiceAttributes and send FinishQrlEvaluation event if isLastPlayer', () => {
            spyOn(service, 'isLastPlayer').and.returnValue(true);
            const cleanSpy = spyOn(service, 'cleanServiceAttributes').and.callFake(() => {
                return;
            });
            const config = { id: matchPlayerServiceSpy.match.accessCode };
            service.handleLastPlayerEvaluation();
            expect(cleanSpy).toHaveBeenCalled();
            expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.FinishQrlEvaluation, config);
        });
        it('should not call cleanServiceAttributes and send FinishQrlEvaluation event if it is not LastPlayer', () => {
            spyOn(service, 'isLastPlayer').and.returnValue(false);
            const cleanSpy = spyOn(service, 'cleanServiceAttributes').and.callFake(() => {
                return;
            });
            const config = { id: matchPlayerServiceSpy.match.accessCode };
            service.handleLastPlayerEvaluation();
            expect(cleanSpy).not.toHaveBeenCalled();
            expect(socketServiceSpy.send).not.toHaveBeenCalledWith(SocketsSendEvents.FinishQrlEvaluation, config);
        });
    });

    describe('setPlayerByIndex', () => {
        it('should return if index < 0 or index >= this.playersNames.length', () => {
            service.playersNames = Object.assign(mockPlayersNames);
            service.currentPlayer = EVALUATION_ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }))[0];
            service.setPlayerByIndex(ERRORS.noIndexFound);
            expect(service.currentPlayer).toEqual(EVALUATION_ACTIVE_PLAYERS[0]);
            service.setPlayerByIndex(3);
            expect(service.currentPlayer).toEqual(EVALUATION_ACTIVE_PLAYERS[0]);
        });
        it('should not set currentPlayer to next Player if player is not found', () => {
            service.playersNames = [EXAMPLES.playerName];
            service.currentPlayer = EVALUATION_ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }))[0];
            service.setPlayerByIndex(0);
            expect(service.currentPlayer).toEqual(EVALUATION_ACTIVE_PLAYERS[0]);
        });
        it('should set currentPlayer to next Player if index has a right value', () => {
            service.playersNames = Object.assign(mockPlayersNames);
            service.currentPlayer = EVALUATION_ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }))[0];
            service.setPlayerByIndex(1);
            expect(service.currentPlayer).toEqual(EVALUATION_ACTIVE_PLAYERS[1]);
        });
    });

    describe('setPlayerAnswer', () => {
        it("should set currentPlayerAnswer to 'Le joueur n'a pas répondu' if the answer isn't valid", () => {
            matchPlayerServiceSpy.match.playerAnswers = [PLAYER_ANSWERS].map((obj) => Object.assign({ ...obj }));
            matchPlayerServiceSpy.match.playerAnswers[0].questionId = mockQuestion.id;
            service.currentPlayer = EVALUATION_ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }))[0];
            matchPlayerServiceSpy.match.playerAnswers[0].name = service.currentPlayer.name;
            matchPlayerServiceSpy.match.playerAnswers[0].qrlAnswer = '';
            service.setPlayerAnswer();
            expect(service.currentPlayerAnswer).toBeUndefined();
        });
        it("should set currentPlayerAnswer to player's answer if the answer is valid", () => {
            matchPlayerServiceSpy.match.playerAnswers = [PLAYER_ANSWERS].map((obj) => Object.assign({ ...obj }));
            matchPlayerServiceSpy.match.playerAnswers[0].questionId = mockQuestion.id;
            service.currentPlayer = EVALUATION_ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }))[0];
            matchPlayerServiceSpy.match.playerAnswers[0].name = service.currentPlayer.name;
            matchPlayerServiceSpy.match.playerAnswers[0].qrlAnswer = EXAMPLES.playerAnswer;
            service.setPlayerAnswer();
            expect(service.currentPlayerAnswer).toEqual(EXAMPLES.playerAnswer);
        });
    });

    describe('hasPlayerResponded', () => {
        it('should return true if currentPlayerAnswer is defined', () => {
            service.currentPlayerAnswer = 'test';
            const result = service.hasPlayerResponded();
            expect(result).toBe(true);
        });

        it('should return false if currentPlayerAnswer is undefined', () => {
            service.currentPlayerAnswer = undefined as unknown as string;
            const result = service.hasPlayerResponded();
            expect(result).toBe(false);
        });
    });

    describe('isLastPlayer', () => {
        it('should return true if nPlayersEvaluated >= playersNames.length', () => {
            service.nPlayersEvaluated = 2;
            service.playersNames = mockPlayersNames;
            const returnValue = service.isLastPlayer();
            expect(returnValue).toBeTrue();
        });
        it('should return false if nPlayersEvaluated >= playersNames.length', () => {
            service.nPlayersEvaluated = 1;
            service.playersNames = mockPlayersNames;
            const returnValue = service.isLastPlayer();
            expect(returnValue).toBeFalse();
        });
    });

    describe('cleanServiceAttributes', () => {
        it('should set service attributes to specified values', () => {
            service.currentPlayer = ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }))[0];
            service.playersNames = mockPlayersNames;
            service.currentPlayerAnswer = EXAMPLES.playerAnswer;
            service.currentNoteFactor = EXAMPLES.qrlFullNote / FACTORS.percentage;
            service.nPlayersEvaluated = EXAMPLES.validNumber;
            service.currentQuestionPoints = EXAMPLES.validNumber;
            service.isEvaluatingQrlQuestions = true;
            histogramServiceSpy.isShowingQuestionResults = false;

            service.cleanServiceAttributes();

            expect(service.currentPlayer).toEqual({} as Player);
            expect(service.playersNames.length).toBe(0);
            expect(service.currentPlayerAnswer).toEqual('');
            expect(service.currentNoteFactor).toEqual(0);
            expect(service.nPlayersEvaluated).toEqual(0);
            expect(service.currentQuestionPoints).toEqual(0);
            expect(service.isEvaluatingQrlQuestions).toBeFalse();
            expect(histogramServiceSpy.isShowingQuestionResults).toBeTrue();
        });
    });
});
