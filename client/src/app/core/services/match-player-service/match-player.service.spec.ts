/* eslint-disable max-lines */
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { Match } from '@app/core/classes/match/match';
import { ERRORS, FACTORS, NAMES, QRL_TIME, QUESTION_TYPE, SocketsOnEvents, SocketsSendEvents } from '@app/core/constants/constants';
import { CORRECT_OPTIONS, EXAMPLES, GAMES, OPTIONS, PLAYER, PLAYER_ANSWERS, QRL_QUESTIONS } from '@app/core/data/data';
import { MatchCommunicationService } from '@app/core/http/services/match-communication/match-communication.service';
import { Choice } from '@app/core/interfaces/choice';
import { IGame } from '@app/core/interfaces/game';
import { IMatch } from '@app/core/interfaces/i-match';
import { Player } from '@app/core/interfaces/player';
import { QuestionRequest } from '@app/core/interfaces/question-request';
import { JoinMatchService } from '@app/core/services/join-match/join-match.service';
import { ChatService } from '@app/core/websocket/services/chat-service/chat.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { of } from 'rxjs';
import { MatchPlayerService } from './match-player.service';
describe('MatchPlayerService', () => {
    const mockOptions: Choice[] = OPTIONS.map((obj) => Object.assign({ ...obj }));
    const mockGames: Game[] = GAMES.map((obj) => Object.assign({ ...obj }));
    let service: MatchPlayerService;
    let routerSpy: jasmine.SpyObj<Router>;
    let matchSpy: jasmine.SpyObj<Match>;
    let timeServiceSpy: jasmine.SpyObj<TimeService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;
    let matchCommunicationServiceSpy: jasmine.SpyObj<MatchCommunicationService>;
    let joinMatchServiceSpy: jasmine.SpyObj<JoinMatchService>;
    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        matchSpy = jasmine.createSpyObj('Match', [
            'setTimerValue',
            'getAnswerIndex',
            'didPlayerAnswer',
            'getPlayerAnswersIndex',
            'setAnswersAsFinal',
            'isFinalAnswer',
        ]);
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['getResultsEvent', 'startTimer', 'stopTimer', 'stopServerTimer']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['disconnect', 'send', 'on']);
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['cleanMessages']);
        joinMatchServiceSpy = jasmine.createSpyObj('JoinMatchService', ['containsOnlySpaces']);
        matchCommunicationServiceSpy = jasmine.createSpyObj('MatchCommunicationService', [
            'isValidAccessCode',
            'createMatch',
            'setAccessibility',
            'deleteMatchByAccessCode',
        ]);
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: Match, useValue: matchSpy },
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: JoinMatchService, useValue: joinMatchServiceSpy },
                { provide: MatchCommunicationService, useValue: matchCommunicationServiceSpy },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(MatchPlayerService);
        service.player = { name: 'test', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };
        matchSpy.players = [{ name: 'test', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false }];
        matchSpy.game = new Game(mockGames[0] as IGame);
        matchSpy.playerAnswers = [PLAYER_ANSWERS].map((obj) => Object.assign({ ...obj }));
        matchSpy.playerAnswers[0].qcmAnswers = mockOptions.map((obj) => Object.assign({ ...obj }));
        service.match = matchSpy;
        service.initializeQuestion();
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should initialize the current question', () => {
        service.initializeQuestion();
        expect(matchSpy.setTimerValue).toHaveBeenCalled();
        expect(service.getCurrentQuestion).toEqual(matchSpy.game.questions[0]);
    });
    it('currentQuestionIndex should be initialized to 0', () => {
        expect(service.getCurrentQuestionIndex).toEqual(0);
    });
    it('getMaxTime should return game time if the question is a QCM', () => {
        service.currentQuestion.type = QUESTION_TYPE.qcm;
        service.getMaxTime();
        expect(service.getMaxTime()).toEqual(service.match.game.duration);
    });
    it('getMaxTime should return question time if the question is a QRL', () => {
        service.currentQuestion.type = QUESTION_TYPE.qrl;
        service.getMaxTime();
        expect(service.getMaxTime()).toEqual(QRL_TIME);
    });
    it('initializePlayersList should initialized data source', () => {
        service.initializePlayersList();
        expect(service.dataSource.data).toEqual(service.match.players);
    });
    it('setCurrentMatch should initialized match and player attributes', () => {
        const testPlayer = { name: NAMES.manager, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };
        const testMatch = new Match(matchSpy as IMatch);
        testMatch.testing = false;
        testMatch.accessCode = 'I test';
        const createMatchSpy = spyOn(service, 'createMatch').and.returnValue(of({}));
        service.setCurrentMatch(testMatch, testPlayer);
        expect(service.match).toEqual(testMatch);
        expect(service.player).toEqual(testPlayer);
        expect(createMatchSpy).toHaveBeenCalled();
    });
    it('updateCurrentAnswer should add or remove an answer from the answer array', () => {
        const testChoice = matchSpy.game.questions[0].choices[0];
        const getCurrentAnswersIndexSpy = spyOn(service, 'getCurrentAnswersIndex').and.returnValue(0);
        const isChoiceSelectedSpy = spyOn(service, 'isChoiceSelected').and.returnValue(true);
        service.updateCurrentAnswer(testChoice);
        expect(service.match.playerAnswers[0]).toEqual(matchSpy.playerAnswers[0]);
        const sendAnswer = {
            matchAccessCode: service.match.accessCode,
            playerAnswers: service.match.playerAnswers[0],
        };
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.UpdateAnswer, sendAnswer);
        isChoiceSelectedSpy.and.returnValue(false); // test add choice
        service.updateCurrentAnswer(testChoice);
        expect(service.match.playerAnswers[0].qcmAnswers[1]).toEqual(matchSpy.playerAnswers[0].qcmAnswers[1]);
        getCurrentAnswersIndexSpy.and.returnValue(ERRORS.noIndexFound); // test add answer
        const expectedAnswer = {
            name: service.player.name,
            lastAnswerTime: '',
            final: false,
            questionId: service.currentQuestion.id,
            obtainedPoints: 0,
            qcmAnswers: [testChoice],
            qrlAnswer: '',
            isTypingQrl: false,
        };
        service.updateCurrentAnswer(testChoice);
        expect(service.match.playerAnswers[1]).toEqual(expectedAnswer);
        service.updateCurrentAnswer();
        expect(service.match.playerAnswers[1]).toEqual(expectedAnswer);
    });
    it('getCurrentAnswersIndex should should call match method', () => {
        service.getCurrentAnswersIndex();
        expect(matchSpy.getPlayerAnswersIndex).toHaveBeenCalledWith(service.player, service.currentQuestion.id);
    });
    it('isChoiceSelected should call match method', () => {
        service.isChoiceSelected({} as Choice);
        expect(matchSpy.didPlayerAnswer).toHaveBeenCalledWith(service.player, {} as Choice, service.currentQuestion.id);
    });
    it('setCurrentAnswersAsFinal should call match method', () => {
        service.setCurrentAnswersAsFinal();
        expect(matchSpy.setAnswersAsFinal).toHaveBeenCalledWith(service.player, service.currentQuestion.id, true);
    });
    it('isFinalCurrentAnswer should call match method', () => {
        service.isFinalCurrentAnswer();
        expect(matchSpy.isFinalAnswer).toHaveBeenCalledWith(service.player, service.currentQuestion.id);
    });
    it('evaluateCurrentQuestion should return false if player did not answer', () => {
        spyOn(service, 'getCurrentAnswersIndex').and.returnValue(ERRORS.noIndexFound);
        expect(service.evaluateCurrentQuestion()).toBe(false);
        matchSpy.playerAnswers = [];
        expect(service.evaluateCurrentQuestion()).toBe(false);
    });
    it('evaluateCurrentQuestion should return false if answer is undefined or not correct', () => {
        const answerIndexSpy = spyOn(service, 'getCurrentAnswersIndex').and.returnValue(1);
        expect(service.evaluateCurrentQuestion()).toBe(false);
        answerIndexSpy.and.returnValue(0);
        expect(service.evaluateCurrentQuestion()).toBe(false);
    });
    it('evaluateCurrentQuestion should return true if answer is correct', () => {
        spyOn(service, 'getCurrentAnswersIndex').and.returnValue(0);
        spyOn(service.currentQuestion, 'getRightChoicesNumber').and.returnValue(CORRECT_OPTIONS.length);
        matchSpy.playerAnswers[0].qcmAnswers = CORRECT_OPTIONS.map((obj) => Object.assign({ ...obj }));
        expect(service.evaluateCurrentQuestion()).toBe(true);
    });
    it('updateScore should update score', () => {
        const newScore: QuestionRequest = {
            matchAccessCode: service.match.accessCode,
            player: service.player,
            questionId: service.currentQuestion.id,
            hasQrlEvaluationBegun: false,
        };
        service.updateScore();
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.UpdateScore, newScore);
        matchSpy.testing = true;
        service.initializeScore();
        service.updateScore();
        expect(service.player.score).toEqual(service.currentQuestion.points * FACTORS.firstChoice);
    });
    it('initializeScore should set player score to 0', () => {
        service.initializeScore();
        expect(service.player.score).toEqual(0);
    });
    it('sendNextQuestion should update index question', () => {
        service.sendNextQuestion();
        expect(service.getCurrentQuestionIndex).toEqual(1);
        expect(service.showingResults).toEqual(false);
    });
    it('showResults should navigate to question result and call updateScore if it is a qcm question', () => {
        const evaluateSpy = spyOn(service, 'evaluateCurrentQuestion').and.returnValue(true);
        const updateScoreSpy = spyOn(service, 'updateScore').and.returnValue();
        service.currentQuestion.type = QUESTION_TYPE.qcm;
        service.showResults();
        expect(timeServiceSpy.stopTimer).toHaveBeenCalled();
        expect(evaluateSpy).toHaveBeenCalled();
        expect(updateScoreSpy).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/play/question-result/${matchSpy.game.id}`);
    });
    it('showResults should navigate to question result and update playerScore if it is qrl question in testing view', () => {
        spyOn(service, 'evaluateCurrentQuestion').and.returnValue(false);
        service.currentQuestion.type = QUESTION_TYPE.qrl;
        service.currentQuestion.points = EXAMPLES.validNumber;
        service.player.name = NAMES.tester;
        service.player.score = 0;
        service.showResults();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/play/question-result/${matchSpy.game.id}`);
        expect(service.player.score).toEqual(EXAMPLES.validNumber);
    });
    it('cleanCurrentMatch should update index question', () => {
        service['timeService'].joinMatchService = joinMatchServiceSpy;
        service.cleanCurrentMatch();
        expect(service.showingResults).toEqual(false);
        expect(service.hasJoinMatch).toEqual(false);
        expect(service.questionResultConnected).toEqual(false);
        expect(service.getCurrentQuestionIndex).toEqual(0);
        expect(service.player).toEqual({} as Player);
        expect(joinMatchServiceSpy.playerName).toEqual('');
        expect(timeServiceSpy.stopTimer).toHaveBeenCalled();
        expect(socketServiceSpy.disconnect).toHaveBeenCalled();
        expect(chatServiceSpy.cleanMessages).toHaveBeenCalled();
    });
    it('isCurrentQuestionTheLastOne should call game method', () => {
        const istLastQuestionSpy = spyOn(service.match.game, 'isLastQuestion').and.returnValue(true);
        service.isCurrentQuestionTheLastOne();
        expect(istLastQuestionSpy).toHaveBeenCalledWith(service.currentQuestion);
    });

    it('quitMatch should send an event if it is not a testing match and clean the match', () => {
        const playerLeftBody: QuestionRequest = {
            matchAccessCode: matchSpy.accessCode,
            player: service.player,
            questionId: service.currentQuestion.id,
            hasQrlEvaluationBegun: false,
        };
        const quitMatchSpy = spyOn(service, 'cleanCurrentMatch').and.stub();
        service['timeService'].joinMatchService = joinMatchServiceSpy;
        service.quitMatch();
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.PlayerLeftAfterMatchBegun, playerLeftBody);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
        expect(joinMatchServiceSpy.playerName).toEqual('');
        expect(quitMatchSpy).toHaveBeenCalled();
    });
    it('quitMatch should navigate to create if it is a testing match and clean the match', () => {
        matchSpy.testing = true;
        const quitMatchSpy = spyOn(service, 'cleanCurrentMatch').and.stub();
        service['timeService'].joinMatchService = joinMatchServiceSpy;
        service.quitMatch();
        expect(timeServiceSpy.stopServerTimer).toHaveBeenCalledWith(matchSpy.accessCode);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/create');
        expect(joinMatchServiceSpy.playerName).toEqual('');
        expect(quitMatchSpy).toHaveBeenCalled();
    });
    it('joinMatchRoom should send and event', () => {
        service.joinMatchRoom(matchSpy.accessCode);
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.JoinMatch, { roomId: matchSpy.accessCode, name: service.player.name });
    });
    it('validateAccessCode should call method of communication service', () => {
        matchCommunicationServiceSpy.isValidAccessCode.and.returnValue(of(true));
        service.validateAccessCode(matchSpy.accessCode).subscribe((result) => {
            expect(result).toBe(true);
        });
        expect(matchCommunicationServiceSpy.isValidAccessCode).toHaveBeenCalledWith(matchSpy.accessCode);
    });
    it('createMatch should call method of communication service', () => {
        matchCommunicationServiceSpy.createMatch.and.returnValue(of());
        service.createMatch().subscribe((result) => {
            expect(result).toBeTruthy();
        });
        expect(matchCommunicationServiceSpy.createMatch).toHaveBeenCalledWith(matchSpy);
    });
    it('setAccessibility should call method of communication service', () => {
        matchCommunicationServiceSpy.setAccessibility.and.returnValue(of(true));
        service.setAccessibility().subscribe((result) => {
            expect(result).toBeTruthy();
        });
        expect(matchCommunicationServiceSpy.setAccessibility).toHaveBeenCalledWith(matchSpy.accessCode);
    });
    it('deleteMatchByAccessCode should call method of communication service', () => {
        matchCommunicationServiceSpy.deleteMatchByAccessCode.and.returnValue(of());
        service.deleteMatchByAccessCode(matchSpy.accessCode).subscribe((result) => {
            expect(result).toBeTruthy();
        });
        expect(matchCommunicationServiceSpy.deleteMatchByAccessCode).toHaveBeenCalledWith(matchSpy.accessCode);
    });
    it('setupListenersPLayerView should add a new event handle', () => {
        service.setupListenersPLayerView();
        const quitMatchSpy = spyOn(service, 'quitMatch').and.stub();
        const matchFinishedEventEmitterSpy = jasmine.createSpyObj('Subject', ['next', 'subscribe']);
        service.matchFinishedEventEmitter = matchFinishedEventEmitterSpy;
        expect(socketServiceSpy.on).toHaveBeenCalledWith(SocketsOnEvents.MatchFinished, jasmine.any(Function));
        const matchFinishedCallback = socketServiceSpy.on.calls.argsFor(0)[1];
        matchFinishedCallback({});
        expect(quitMatchSpy).toHaveBeenCalled();
        expect(matchFinishedEventEmitterSpy.next).toHaveBeenCalled();
    });
    it('updateTypingState should call sendUpdateAnswerEvent, set isTypingQrl to false and push answers if index is not found', () => {
        const getIndexSpy = spyOn(service, 'getCurrentAnswersIndex').and.returnValue(ERRORS.noIndexFound);
        const sendSpy = spyOn(service, 'sendUpdateAnswerEvent').and.stub();
        service.isTypingQrl = true;
        service.player = Object.assign(PLAYER);
        service.match.playerAnswers = [];
        service.qrlAnswer = EXAMPLES.playerAnswer;
        service.currentQuestion = Object.assign(QRL_QUESTIONS[0]);
        service.updateTypingState();
        const playerAnswerPush = service.match.playerAnswers[0];
        expect(getIndexSpy).toHaveBeenCalled();
        expect(sendSpy).toHaveBeenCalled();
        expect(playerAnswerPush.name).toEqual(PLAYER.name);
        expect(playerAnswerPush.final).toBeFalse();
        expect(playerAnswerPush.questionId).toEqual(QRL_QUESTIONS[0].id);
        expect(playerAnswerPush.qrlAnswer).toEqual(EXAMPLES.playerAnswer);
        expect(playerAnswerPush.isTypingQrl).toBeTrue();
    });
    it('updateTypingState should return if index is valid and answer is final', () => {
        spyOn(service, 'getCurrentAnswersIndex').and.returnValue(0);
        const sendSpy = spyOn(service, 'sendUpdateAnswerEvent').and.stub();
        service.player = Object.assign(PLAYER);
        service.currentQuestion = Object.assign(QRL_QUESTIONS[0]);
        service.match.playerAnswers = [Object.assign(PLAYER_ANSWERS)];
        service.match.playerAnswers[0].name = PLAYER.name;
        service.match.playerAnswers[0].final = true;
        service.match.playerAnswers[0].questionId = service.currentQuestion.id;
        service.qrlAnswer = EXAMPLES.playerAnswer;
        service.currentQuestion = Object.assign(QRL_QUESTIONS[0]);
        service.updateTypingState();
        expect(sendSpy).toHaveBeenCalled();
    });
    it('updateTypingState should set isTypingQrl if index is valid and answer is not final', () => {
        spyOn(service, 'getCurrentAnswersIndex').and.returnValue(0);
        spyOn(service, 'sendUpdateAnswerEvent').and.stub();
        service.player = Object.assign(PLAYER);
        service.currentQuestion = Object.assign(QRL_QUESTIONS[0]);
        service.match.playerAnswers = [Object.assign(PLAYER_ANSWERS)];
        service.match.playerAnswers[0].final = false;
        service.isTypingQrl = true;
        service.currentQuestion = Object.assign(QRL_QUESTIONS[0]);
        service.updateTypingState();
        expect(service.match.playerAnswers[0].isTypingQrl).toBeTrue();
    });
    it('sendUpdateAnswerEvent should send update answer event if index is valid', () => {
        spyOn(service, 'getCurrentAnswersIndex').and.returnValue(0);
        service.match.playerAnswers = [Object.assign(PLAYER_ANSWERS)];
        service.match.accessCode = EXAMPLES.accessCode;
        service.sendUpdateAnswerEvent();
        const expectedData = {
            matchAccessCode: EXAMPLES.accessCode,
            playerAnswers: Object.assign(PLAYER_ANSWERS),
        };
        expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.UpdateAnswer, expectedData);
    });
});
