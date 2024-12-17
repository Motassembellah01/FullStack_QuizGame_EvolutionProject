import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Match } from '@app/core/classes/match/match';
import { Question } from '@app/core/classes/question/question';
import { QUESTION_TYPE, SocketsOnEvents } from '@app/core/constants/constants';
import { OPTIONS, QUESTIONS } from '@app/core/data/data';
import { Choice } from '@app/core/interfaces/choice';
import { Player } from '@app/core/interfaces/player';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { Chart } from 'chart.js/auto';
import { HistogramService } from './histogram.service';

describe('HistogramService', () => {
    let service: HistogramService;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let chartSpy: jasmine.SpyObj<Chart>;
    let matchSpy: jasmine.SpyObj<Match> = jasmine.createSpyObj({ destroy: null });
    const qcmMock: Question = QUESTIONS.map((obj) => ({ ...obj }))[0] as Question;
    const mockChoices: Choice[] = OPTIONS.map((obj) => ({ ...obj }));
    const firstPlayerAnswers: PlayerAnswers = {
        name: 'firstPlayer',
        lastAnswerTime: 'hh:mm',
        final: false,
        questionId: '0',
        obtainedPoints: 0,
        qcmAnswers: [mockChoices[0]],
        qrlAnswer: '',
        isTypingQrl: false,
        isFirstAttempt: true,
    };
    const secondPlayerAnswers: PlayerAnswers = {
        name: 'secondPlayer',
        lastAnswerTime: 'hh:mm',
        final: false,
        questionId: '1',
        obtainedPoints: 0,
        qcmAnswers: [mockChoices[0]],
        qrlAnswer: '',
        isTypingQrl: true,
        isFirstAttempt: false,
    };
    const mockPlayersAnswers: PlayerAnswers[] = [firstPlayerAnswers, secondPlayerAnswers];
    const mockPlayer: Player = { name: 'firstPlayer', isActive: true } as Player;

    beforeEach(() => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['on']);
        chartSpy = jasmine.createSpyObj('Chart', ['destroy']);
        matchSpy = jasmine.createSpyObj('Match', ['playerAnswers', 'players', 'findPlayerIndexByName']);
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', ['currentQuestion']);
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: Chart, useValue: chartSpy },
                { provide: Match, useValue: matchSpy },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(HistogramService);
        matchPlayerServiceSpy.socketService = socketServiceSpy;
        matchSpy.players = [mockPlayer];
        matchPlayerServiceSpy.match = matchSpy;
        service.choicesCount = [{ choice: mockChoices[0], nSelected: 0 }];
        service.chart = chartSpy;
    });

    describe('creation', () => {
        it('should be created', () => {
            expect(service).toBeTruthy();
        });
    });

    describe('getCurrentQuestionAnswers', () => {
        it('should return players answers to the current question only ', () => {
            matchPlayerServiceSpy.currentQuestion = qcmMock;
            matchSpy.playerAnswers = mockPlayersAnswers;
            matchPlayerServiceSpy.match = matchSpy;
            const currentQuestionAnswers = service.getCurrentQuestionAnswers();
            expect(currentQuestionAnswers).toEqual([firstPlayerAnswers]);
        });
    });

    describe('countQcmSelectedChoices', () => {
        it('should call getCurrentQuestionAnswers and findPlayerIndexByName', () => {
            matchSpy.playerAnswers = mockPlayersAnswers;
            spyOn(service, 'getCurrentQuestionAnswers').and.returnValue(mockPlayersAnswers);
            matchSpy.findPlayerIndexByName.and.returnValue(0);
            service.countQcmSelectedChoices();
            expect(service.getCurrentQuestionAnswers).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.match.findPlayerIndexByName).toHaveBeenCalled();
        });
    });

    describe('countQrlInteractions', () => {
        it('should call getCurrentQuestionAnswers and findPlayerIndexByName', () => {
            matchSpy.playerAnswers = mockPlayersAnswers;
            spyOn(service, 'getCurrentQuestionAnswers').and.returnValue(mockPlayersAnswers);
            service.countQrlInteractions();
            expect(service.getCurrentQuestionAnswers).toHaveBeenCalled();
        });
    });

    describe('initializeMatchChartChoices', () => {
        it('should return text depending on the number of choices and wether the choice is true or not', () => {
            matchPlayerServiceSpy.currentQuestion = qcmMock;
            const expectedReturnArray: string[] = ['Choix 1 ✘', 'Choix 2 ✘', 'Choix 3 ✔', 'Choix 4 ✘'];
            const returnArray = service.initializeMatchChartChoices();
            expect(returnArray).toEqual(expectedReturnArray);
        });

        it('should call countQrlInteractions if question type is qrl', () => {
            matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qrl;
            spyOn(service, 'countQrlInteractions');
            const expectedReturnArray: string[] = ['Ont interagi', "N'ont pas interagi"];
            const returnArray = service.initializeMatchChartChoices();
            expect(returnArray).toEqual(expectedReturnArray);
            expect(service.countQrlInteractions).toHaveBeenCalled();
        });
    });

    describe('initializeResultsChartData', () => {
        it('should set chartData and labelList', () => {
            service.questionsChartData = [{ labelList: [], chartData: [], chartColor: '', xLineText: '' }];
            service.initializeResultsChartData();
            expect(service.labelList).toEqual([]);
            expect(service.chartData).toEqual([]);
        });
    });

    describe('setupChart', () => {
        it('should show qrl results factors if isShowingQuestionResults and question type is qrl', () => {
            matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qrl;
            matchPlayerServiceSpy.currentQuestion.id = '0';
            service.isShowingQuestionResults = true;
            service.questionsStats = new Map<string, number[]>();
            service.questionsStats.set('0', [1, 1]);
            const expectedLabels: string[] = ['0%', '50%', '100%'];
            const expectedData: number[] = [0, 0, 2];
            service.setupChart();
            expect(service.labelList).toEqual(expectedLabels);
            expect(service.chartData).toEqual(expectedData);
        });

        it('should call initializeResultsChartData if isShowingMatchResults', () => {
            service.isShowingQuestionResults = false;
            service.isShowingMatchResults = true;
            spyOn(service, 'initializeResultsChartData');
            service.setupChart();
            expect(service.initializeResultsChartData).toHaveBeenCalled();
        });

        it('should call initializeMatchChartChoices and countQcmSelectedChoices if !isShowingMatchResults and question type is qcm', () => {
            service.isShowingQuestionResults = false;
            service.isShowingMatchResults = false;
            matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qcm;
            spyOn(service, 'getCurrentQuestionAnswers').and.returnValue(mockPlayersAnswers);
            spyOn(service, 'initializeMatchChartChoices').and.stub();
            spyOn(service, 'countQcmSelectedChoices').and.stub();
            service.setupChart();
            expect(service.initializeMatchChartChoices).toHaveBeenCalled();
            expect(service.countQcmSelectedChoices).toHaveBeenCalled();
        });

        it('should call initializeMatchChartChoices and countQcmSelectedChoices if !isShowingMatchResults and question type is qcm', () => {
            service.isShowingQuestionResults = false;
            service.isShowingMatchResults = false;
            matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qrl;
            spyOn(service, 'getCurrentQuestionAnswers').and.returnValue(mockPlayersAnswers);
            spyOn(service, 'initializeMatchChartChoices').and.stub();
            spyOn(service, 'countQrlInteractions').and.stub();
            service.setupChart();
            expect(service.initializeMatchChartChoices).toHaveBeenCalled();
            expect(service.countQrlInteractions).toHaveBeenCalled();
        });
    });

    describe('createChart', () => {
        it('should call setupChart and create chart with actual data', () => {
            spyOn(service, 'setupChart');
            service.createChart();
            expect(service.setupChart).toHaveBeenCalled();
            service.chart.destroy();
        });
    });

    describe('updatePlayerAnswersList', () => {
        it('should update player answers list', () => {
            service.playersAnswered = [];
            matchSpy.playerAnswers = mockPlayersAnswers;
            mockPlayersAnswers[1].isFirstAttempt = true;
            service.updatePlayerAnswersList(mockPlayersAnswers);
            expect(service.playersAnswered.length).toEqual(2);
        });
    });

    describe('setupListeners', () => {
        it('should add an event listener to update player answers', () => {
            mockPlayersAnswers[1].isFirstAttempt = false;
            service.isShowingQuestionResults = false;
            spyOn(service, 'createChart');
            spyOn(service, 'updatePlayerAnswersList').and.stub();

            service.setupListeners();
            expect(socketServiceSpy.on).toHaveBeenCalledWith(SocketsOnEvents.AnswerUpdated, jasmine.any(Function));

            const newCallback = socketServiceSpy.on.calls.argsFor(0)[1];
            newCallback(mockPlayersAnswers);
            expect(chartSpy.destroy).toHaveBeenCalled();
            expect(service.createChart).toHaveBeenCalled();
            expect(service.updatePlayerAnswersList).toHaveBeenCalled();
        });
    });
});
