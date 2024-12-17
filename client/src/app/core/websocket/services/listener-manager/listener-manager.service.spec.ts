/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Match } from '@app/core/classes/match/match';
import { Question } from '@app/core/classes/question/question';
import { FEEDBACK_MESSAGES, NAMES, QUESTION_TYPE, SocketsOnEvents } from '@app/core/constants/constants';
import { Player } from '@app/core/interfaces/player';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { QuestionChartData } from '@app/core/interfaces/questions-chart-data';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/core/services/question-evaluation/question-evaluation.service';
import { ChatService } from '@app/core/websocket/services/chat-service/chat.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { Chart } from 'chart.js/auto';
import { Subject } from 'rxjs';
import { ListenerManagerService } from './listener-manager.service';

describe('ListenerManagerService', () => {
    let service: ListenerManagerService;
    let spySocketService: jasmine.SpyObj<SocketService>;
    let spyRouter: jasmine.SpyObj<Router>;
    let spyMatchPlayerService: jasmine.SpyObj<MatchPlayerService>;
    let spyChatService: jasmine.SpyObj<ChatService>;
    let spyTimeService: jasmine.SpyObj<TimeService>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let questionEvaluationService: jasmine.SpyObj<QuestionEvaluationService>;
    let chartSpy: jasmine.SpyObj<Chart>;

    beforeEach(() => {
        spySocketService = jasmine.createSpyObj('SocketService', ['on', 'disconnect', 'send']);
        spyRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
        spyMatchPlayerService = jasmine.createSpyObj(
            'MatchPlayerService',
            ['showResults', 'cleanCurrentMatch', 'getCurrentQuestion', 'currentQuestion', 'getCurrentQuestionIndex', 'sendNextQuestion'],
            {
                getCurrentQuestionIndex: 0,
            },
        );
        spyChatService = jasmine.createSpyObj('ChatService', ['setupListeners', 'send']);
        spyTimeService = jasmine.createSpyObj('TimeService', ['getCurrentTime']);
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['questionsChartData', 'createChart']);
        questionEvaluationService = jasmine.createSpyObj('QuestionEvaluationService', ['setPlayerAnswer', 'handleLastPlayerEvaluation']);
        chartSpy = jasmine.createSpyObj('Chart', ['destroy']);
        histogramServiceSpy.chart = chartSpy;
        spyMatchPlayerService.socketService = spySocketService;
        spyMatchPlayerService.timeService = spyTimeService;
        spyMatchPlayerService.router = spyRouter;

        TestBed.configureTestingModule({
            providers: [
                { provide: MatchPlayerService, useValue: spyMatchPlayerService },
                { provide: ChatService, useValue: spyChatService },
                { provide: TimeService, useValue: spyTimeService },
                { provide: HistogramService, useValue: histogramServiceSpy },
                { provide: QuestionEvaluationService, useValue: questionEvaluationService },
                { provide: Chart, useValue: chartSpy },
            ],
        });
        service = TestBed.inject(ListenerManagerService);
        histogramServiceSpy.playersWithFinalAnswers = [];
        questionEvaluationService.playersNames = [];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('setupQuestionResultListeners should call updatePlayerOnDisabledEvent and setUpNextQuestionListener', () => {
        const updateSpy = spyOn<any>(service, 'updatePlayerOnDisabledEvent');
        const setSpy = spyOn<any>(service, 'setUpNextQuestionListener');
        service.setupQuestionResultListeners();
        expect(updateSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalled();
    });

    it('setOnGoingMatchListeners should call setFinalAnswerOnEvent, showResultsOnAllPlayersResponded and updatePlayerOnDisabledEvent', () => {
        const setSpy = spyOn<any>(service, 'setFinalAnswerOnEvent');
        const showSpy = spyOn<any>(service, 'showResultsOnAllPlayersResponded');
        const updateSpy = spyOn<any>(service, 'updatePlayerOnDisabledEvent');
        service.setOnGoingMatchListeners();
        expect(updateSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalled();
        expect(showSpy).toHaveBeenCalled();
    });

    it('setMatchManagerSideListeners should call updatePlayerScoreOnEvent, updatePlayerOnDisabledEvent and setFinalAnswerOnEvent', () => {
        const updatePlayerScoreSpy = spyOn<any>(service, 'updatePlayerScoreOnEvent');
        const updatePlayerSpy = spyOn<any>(service, 'updatePlayerOnDisabledEvent');
        const setSpy = spyOn<any>(service, 'setFinalAnswerOnEvent');
        service.setMatchManagerSideListeners();
        expect(updatePlayerScoreSpy).toHaveBeenCalled();
        expect(updatePlayerSpy).toHaveBeenCalled();
        expect(setSpy).toHaveBeenCalled();
    });

    it('setWaitingRoomListeners should call updatePlayersListOnNewPlayers and updatePlayersListOnPlayerRemoved', () => {
        const updateOnNewSpy = spyOn<any>(service, 'updatePlayersListOnNewPlayers');
        const updateOnRemovedSpy = spyOn<any>(service, 'updatePlayersListOnPlayerRemoved');
        service.setWaitingRoomListeners();
        expect(updateOnNewSpy).toHaveBeenCalled();
        expect(updateOnRemovedSpy).toHaveBeenCalled();
        expect(spyChatService.setupListeners).toHaveBeenCalled();
    });

    it('setManagerWaitingRoomListeners should call setWaitingRoomListeners', () => {
        const updateOnNewSpy = spyOn<any>(service, 'setWaitingRoomListeners');
        service.setManagerWaitingRoomListeners();
        expect(updateOnNewSpy).toHaveBeenCalled();
    });

    it('setUpNextQuestionListener should spread an event', () => {
        spyMatchPlayerService.nextQuestionEventEmitter = new Subject<void>();
        spyOn<any>(service, 'updatePlayerOnDisabledEvent');
        const spyEvent = spyOn(spyMatchPlayerService.nextQuestionEventEmitter, 'next');
        service.setupQuestionResultListeners();
        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.NextQuestion, jasmine.any(Function));
        const callback = spySocketService.on.calls.argsFor(0)[1];
        callback({});
        expect(spyEvent).toHaveBeenCalled();
    });

    it('setFinalAnswerOnEvent should update last answer time and add the answer in the array answer', () => {
        spyMatchPlayerService.match = new Match();
        const testDate = new Date().toISOString();
        const testPlayerAnswer = { name: 'test', answers: [], lastAnswerTime: testDate, final: true, questionId: 'xxxx', obtainedPoints: 0 };
        spyMatchPlayerService.match.playerAnswers = [
            {
                name: 'test',
                lastAnswerTime: '',
                final: false,
                questionId: 'xxxx',
                obtainedPoints: 0,
                qcmAnswers: [],
                qrlAnswer: '',
                isTypingQrl: false,
            },
        ];
        spyOn<any>(service, 'showResultsOnAllPlayersResponded');
        spyOn<any>(service, 'updatePlayerOnDisabledEvent');
        service.setOnGoingMatchListeners();
        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.FinalAnswerSet, jasmine.any(Function));
        let callback = spySocketService.on.calls.argsFor(0)[1];
        callback(testPlayerAnswer);
        expect(spyMatchPlayerService.match.playerAnswers[0].final).toEqual(testPlayerAnswer.final);
        expect(spyMatchPlayerService.match.playerAnswers[0].lastAnswerTime).toEqual(testPlayerAnswer.lastAnswerTime);

        // if there are no answer the object is pushed to the answer array
        spyMatchPlayerService.match.playerAnswers = [];
        service.setOnGoingMatchListeners();
        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.FinalAnswerSet, jasmine.any(Function));
        callback = spySocketService.on.calls.argsFor(0)[1];
        callback(testPlayerAnswer);
        expect(spyMatchPlayerService.match.playerAnswers[0].final).toEqual(testPlayerAnswer.final);
        expect(spyMatchPlayerService.match.playerAnswers[0].lastAnswerTime).toEqual(testPlayerAnswer.lastAnswerTime);
    });

    it('should update playersWithFinalAnswers for QCM type', () => {
        spyMatchPlayerService.match = new Match();
        const updatedPlayerAnswers = {
            name: 'testPlayer',
            questionId: 'testQuestionId',
            final: true,
            lastAnswerTime: '2023-01-01T00:00:00Z',
        };
        spyMatchPlayerService.match.playerAnswers = [
            {
                name: 'test',
                lastAnswerTime: '',
                final: false,
                questionId: 'xxxx',
                obtainedPoints: 0,
                qcmAnswers: [],
                qrlAnswer: '',
                isTypingQrl: false,
            },
        ];
        spyMatchPlayerService.currentQuestion.type = QUESTION_TYPE.qcm;

        const callback = spyOn<any>(service, 'setFinalAnswerOnEvent').and.callThrough();
        service['setFinalAnswerOnEvent']();

        const eventCallback = spySocketService.on.calls.argsFor(0)[1];
        eventCallback(updatedPlayerAnswers);

        expect(callback).toHaveBeenCalled();
        expect(histogramServiceSpy.playersWithFinalAnswers).toContain(updatedPlayerAnswers.name);
    });

    it('should update playersWithFinalAnswers for QRL type', () => {
        spyMatchPlayerService.match = new Match();
        const updatedPlayerAnswers = {
            name: 'testPlayer',
            questionId: 'testQuestionId',
            final: true,
            lastAnswerTime: '2023-01-01T00:00:00Z',
        };
        spyMatchPlayerService.match.playerAnswers = [
            {
                name: 'test',
                lastAnswerTime: '',
                final: false,
                questionId: 'xxxx',
                obtainedPoints: 0,
                qcmAnswers: [],
                qrlAnswer: '',
                isTypingQrl: false,
            },
        ];
        spyMatchPlayerService.player = { name: NAMES.manager } as Player;

        spyMatchPlayerService.currentQuestion.type = QUESTION_TYPE.qrl;

        const callback = spyOn<any>(service, 'setFinalAnswerOnEvent').and.callThrough();
        service['setFinalAnswerOnEvent']();

        const eventCallback = spySocketService.on.calls.argsFor(0)[1];
        eventCallback(updatedPlayerAnswers);

        expect(callback).toHaveBeenCalled();
        if (updatedPlayerAnswers.final) {
            expect(histogramServiceSpy.playersWithFinalAnswers).toContain(updatedPlayerAnswers.name);
        } else {
            expect(histogramServiceSpy.playersWithFinalAnswers).not.toContain(updatedPlayerAnswers.name);
        }
    });

    it('should update qrlAnswer and call setPlayerAnswer for QRL type and manager player', () => {
        spyMatchPlayerService.match = new Match();
        const updatedPlayerAnswers = {
            name: 'testPlayer',
            questionId: 'testQuestionId',
            final: false,
            qrlAnswer: 'testQrl',
            lastAnswerTime: '0',
        } as PlayerAnswers;
        spyMatchPlayerService.match.playerAnswers = [
            {
                name: 'testPlayer',
                lastAnswerTime: '',
                final: false,
                questionId: 'testQuestionId',
                obtainedPoints: 0,
                qcmAnswers: [],
                qrlAnswer: '',
                isTypingQrl: false,
            } as PlayerAnswers,
        ];

        spyMatchPlayerService.currentQuestion = new Question();
        spyMatchPlayerService.currentQuestion.type = QUESTION_TYPE.qrl;

        spyMatchPlayerService.player = {
            name: NAMES.manager,
            isActive: true,
        } as Player;

        const callback = spyOn<any>(service, 'setFinalAnswerOnEvent').and.callThrough();
        service['setFinalAnswerOnEvent']();

        const eventCallback = spySocketService.on.calls.argsFor(0)[1];
        eventCallback(updatedPlayerAnswers);

        expect(callback).toHaveBeenCalled();
        expect(spyMatchPlayerService.match.playerAnswers[0].qrlAnswer).toEqual(updatedPlayerAnswers.qrlAnswer);
        expect(questionEvaluationService.setPlayerAnswer).toHaveBeenCalled();

        spyMatchPlayerService.match.playerAnswers = [];
        service['setFinalAnswerOnEvent']();

        const secondCall = spySocketService.on.calls.argsFor(0)[1];
        secondCall(updatedPlayerAnswers);
        expect(questionEvaluationService.setPlayerAnswer).toHaveBeenCalled();
    });

    it('updatePlayerScoreOnEvent should call update the score', () => {
        spyMatchPlayerService.match = new Match();
        const testPlayer = { name: 'test', score: 10 };
        spyMatchPlayerService.dataSource = new MatTableDataSource([{ name: 'test', score: 0 } as Player]);
        spyMatchPlayerService.dataSource.data = [];
        spyMatchPlayerService.match.players = [{ name: 'test', score: 0 } as Player];
        spyMatchPlayerService.getCurrentQuestion.type = QUESTION_TYPE.qcm;

        spyOn<any>(service, 'updatePlayerOnDisabledEvent');
        spyOn<any>(service, 'setFinalAnswerOnEvent');
        const dataSpy = spyOn<any>(spyMatchPlayerService.dataSource, '_updateChangeSubscription');

        service.setMatchManagerSideListeners();

        const callback = spySocketService.on.calls.argsFor(0)[1];
        callback(testPlayer);

        expect(spyMatchPlayerService.match.players[0]).toEqual(testPlayer as Player);
        expect(spyMatchPlayerService.dataSource.data[0]).toEqual(testPlayer as Player);
        expect(dataSpy).toHaveBeenCalled();
    });

    it('updatePlayersListOnNewPlayers should add a new player', () => {
        spyMatchPlayerService.match = new Match();
        spyOn<any>(service, 'updatePlayersListOnPlayerRemoved');
        service.setWaitingRoomListeners();
        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.NewPlayer, jasmine.any(Function));
        const newPlayerCallback = spySocketService.on.calls.argsFor(0)[1];
        const newPlayers = [{ name: 'newPlayerName', isActive: false, score: 0, nBonusObtained: 0, chatBlocked: false }];
        newPlayerCallback(newPlayers);
        expect(spyMatchPlayerService.match.players).toEqual(newPlayers);
    });

    it('updatePlayersListOnPlayerRemoved should remove a player player and navigate to home', () => {
        spyMatchPlayerService.match = new Match();
        spyMatchPlayerService.player = { name: 'test' } as Player;
        const newPlayers = [{ name: 'newPlayerName', isActive: false, score: 0, nBonusObtained: 0, chatBlocked: false }];
        spyOn<any>(service, 'updatePlayersListOnNewPlayers');
        service.setWaitingRoomListeners();
        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.PlayerRemoved, jasmine.any(Function));
        const playerRemovedCallback = spySocketService.on.calls.argsFor(0)[1];
        playerRemovedCallback(newPlayers);
        expect(spyMatchPlayerService.cleanCurrentMatch).toHaveBeenCalled();
        expect(spyRouter.navigateByUrl).toHaveBeenCalledWith('/home');
        expect(spyMatchPlayerService.match.players).toEqual(newPlayers);
    });

    it('showResultsOnAllPlayersResponded should call showResults', () => {
        spyOn<any>(service, 'setFinalAnswerOnEvent');
        spyOn<any>(service, 'updatePlayerOnDisabledEvent');
        service.setOnGoingMatchListeners();
        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.AllPlayersResponded, jasmine.any(Function));
        const showResultCallback = spySocketService.on.calls.argsFor(0)[1];
        showResultCallback({});
        expect(spyMatchPlayerService.showResults).toHaveBeenCalled();
    });

    it('updatePlayerOnDisabledEvent should modify is active attribut of player to false', () => {
        spyMatchPlayerService.match = new Match();
        const testPlayer: Player = { name: NAMES.manager, score: 0 } as Player;
        spyMatchPlayerService.dataSource = new MatTableDataSource([testPlayer]);
        spyMatchPlayerService.dataSource.data = [testPlayer];
        spyMatchPlayerService.player = testPlayer;
        spyMatchPlayerService.match.players = [testPlayer];
        histogramServiceSpy.quittedPlayers = [];
        spyOn<any>(service, 'setUpNextQuestionListener');
        const dataSpy = spyOn<any>(spyMatchPlayerService.dataSource, '_updateChangeSubscription');
        service.setupQuestionResultListeners();
        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.PlayerDisabled, jasmine.any(Function));
        const filterSpy = spyOn(Array.prototype, 'filter').and.callThrough();
        const disablePlayerCallback = spySocketService.on.calls.argsFor(0)[1];
        disablePlayerCallback(testPlayer);
        const filterPredicate = filterSpy.calls.mostRecent().args[0];
        const result = filterPredicate('other name', 0, []);
        expect(result).toBe(true);
        expect(filterSpy).toHaveBeenCalled();
        expect(spySocketService.disconnect).toHaveBeenCalled();
        expect(dataSpy).toHaveBeenCalled();
    });
    it('should update questionsChartData when current question index is 0', () => {
        const answer: QuestionChartData = {
            labelList: ['A', 'B', 'C'],
            chartData: [10, 20, 30],
            chartColor: '',
            xLineText: '',
        };
        histogramServiceSpy.questionsChartData = [];
        spyOn<any>(service, 'updateSelectedChoices').and.callThrough();
        service['updateSelectedChoices']();

        const callback = spySocketService.on.calls.argsFor(0)[1];
        callback(answer);
        expect(spySocketService.on).toHaveBeenCalled();
        expect(histogramServiceSpy.questionsChartData[0]).toEqual(answer);
    });

    it('should not update questionsChartData when current question index is not 0', () => {
        const answer: QuestionChartData = {
            labelList: ['A', 'B', 'C'],
            chartData: [10, 20, 30],
            chartColor: '',
            xLineText: '',
        };
        Object.defineProperty(spyMatchPlayerService, 'getCurrentQuestionIndex', {
            get: jasmine.createSpy().and.returnValue(5),
            enumerable: true,
            configurable: true,
        });
        histogramServiceSpy.questionsChartData = [answer];
        spyOn<any>(service, 'updateSelectedChoices').and.callThrough();
        service['updateSelectedChoices']();

        expect(spySocketService.on).not.toHaveBeenCalled();
        expect(histogramServiceSpy.questionsChartData[0]).toEqual(answer);
        expect(histogramServiceSpy.questionsChartData.length).toEqual(1);
    });

    it('should handle player and manager updates after QRL evaluation', () => {
        const player1: Player = { name: 'Player1', score: 0 } as Player;
        const player2: Player = { name: 'Player2', score: 0 } as Player;
        const manager: Player = { name: NAMES.manager, score: 0 } as Player;

        spyMatchPlayerService.match = new Match();
        spyMatchPlayerService.match.players = [player1, player2, manager];
        spyMatchPlayerService.player = player1;
        spyMatchPlayerService.currentQuestion.type = QUESTION_TYPE.qrl;

        spyOn<any>(service, 'handleManagerUpdatesAfterQrlEvaluation');
        spyOn<any>(service, 'handlePlayerUpdatesAfterQrlEvaluation');

        spyOn<any>(service, 'updatePlayerScoreOnQrlEvaluation').and.callThrough();
        service['updatePlayerScoreOnQrlEvaluation']();

        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.QrlEvaluationFinished, jasmine.any(Function));

        const eventCallback = spySocketService.on.calls.argsFor(0)[1];
        eventCallback({});

        expect(service['handleManagerUpdatesAfterQrlEvaluation']).not.toHaveBeenCalled();

        expect(service['handlePlayerUpdatesAfterQrlEvaluation']).toHaveBeenCalledWith(player1);

        spyMatchPlayerService.player = manager;
        eventCallback({});

        expect(service['handleManagerUpdatesAfterQrlEvaluation']).toHaveBeenCalledWith(manager);
        expect(histogramServiceSpy.createChart).toHaveBeenCalled();
        expect(histogramServiceSpy.chart.destroy).toHaveBeenCalled();
    });

    it('should update manager data in data source and trigger change subscription', () => {
        const manager: Player = { name: NAMES.manager, score: 0 } as Player;
        spyMatchPlayerService.dataSource = new MatTableDataSource([manager]);

        spyOn<any>(service.matchPlayerService.dataSource, '_updateChangeSubscription').and.callThrough();

        service['handleManagerUpdatesAfterQrlEvaluation'](manager);

        expect(service.matchPlayerService.dataSource.data[0]).toEqual(manager);
        expect(service.matchPlayerService.dataSource._updateChangeSubscription).toHaveBeenCalled();
    });

    it('should update player score and call setFeedBackMessages', () => {
        const player: Player = { name: 'Player1', score: 10 } as Player;
        spyMatchPlayerService.player = { name: 'Player1', score: 0 } as Player;

        spyOn<any>(service, 'setFeedBackMessages');

        service['handlePlayerUpdatesAfterQrlEvaluation'](player);

        expect(service.matchPlayerService.player.score).toEqual(player.score);
        expect(service['setFeedBackMessages']).toHaveBeenCalled();
    });

    it('should set feedback messages based on question score', () => {
        const currentQuestionPoints = 20;
        spyMatchPlayerService.currentQuestion.points = currentQuestionPoints;
        spyMatchPlayerService.questionScore = currentQuestionPoints / 2;
        spyMatchPlayerService.feedBackMessages = ['', ''];

        service['setFeedBackMessages']();

        expect(service.matchPlayerService.feedBackMessages[0]).toEqual(FEEDBACK_MESSAGES.halfPoints);
        expect(service.matchPlayerService.feedBackMessages[1]).toEqual(
            `${service.matchPlayerService.questionScore} ${FEEDBACK_MESSAGES.pointsAddedToScore}`,
        );

        spyMatchPlayerService.questionScore = currentQuestionPoints;

        service['setFeedBackMessages']();

        expect(service.matchPlayerService.feedBackMessages[0]).toEqual(FEEDBACK_MESSAGES.rightAnswer);
        expect(service.matchPlayerService.feedBackMessages[1]).toEqual(
            `${service.matchPlayerService.questionScore} ${FEEDBACK_MESSAGES.pointsAddedToScore}`,
        );

        spyMatchPlayerService.questionScore = 0;

        service['setFeedBackMessages']();

        expect(service.matchPlayerService.feedBackMessages[0]).toEqual(FEEDBACK_MESSAGES.wrongAnswer);
        expect(service.matchPlayerService.feedBackMessages[1]).toEqual(FEEDBACK_MESSAGES.sameScore);
    });
});
