/* eslint-disable max-lines */
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Match } from '@app/core/classes/match/match';
import { Question } from '@app/core/classes/question/question';
import { QUESTION_TYPE, SocketsOnEvents, SocketsSendEvents, TRANSITIONS_DURATIONS, TRANSITIONS_MESSAGES } from '@app/core/constants/constants';
import { ACTIVE_PLAYERS, GAMES, QUESTIONS } from '@app/core/data/data';
import { IMatch } from '@app/core/interfaces/i-match';
import { Player } from '@app/core/interfaces/player';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/core/services/dialog-transition-service/dialog-transition.service';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/core/services/question-evaluation/question-evaluation.service';
import { ChatService } from '@app/core/websocket/services/chat-service/chat.service';
import { ListenerManagerService } from '@app/core/websocket/services/listener-manager/listener-manager.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { MatchManagersSideComponent } from '@app/pages/match-managers-side/match-managers-side.component';
import { ChatComponent } from '@app/shared/components/chat/chat.component';
import { HistogramComponent } from '@app/shared/components/histogram/histogram.component';
import { PlayersListComponent } from '@app/shared/components/players-list/players-list.component';
import { QuestionDisplayComponent } from '@app/shared/components/question-display/question-display.component';
import { Chart } from 'chart.js/auto';
import { Subject, of } from 'rxjs';

describe('MatchManagersSideComponent', () => {
    let component: MatchManagersSideComponent;
    let fixture: ComponentFixture<MatchManagersSideComponent>;
    let spyMatchPlayerService: jasmine.SpyObj<MatchPlayerService>;
    let spySocketService: jasmine.SpyObj<SocketService>;
    let spyTimeService: jasmine.SpyObj<TimeService>;
    let spyChatService: jasmine.SpyObj<ChatService>;
    let spyListenerManagerService: jasmine.SpyObj<ListenerManagerService>;
    let spyRouter: jasmine.SpyObj<Router>;
    let spyHistogramService: jasmine.SpyObj<HistogramService>;
    let spyChart: jasmine.SpyObj<Chart>;
    let spyQuestionEvaluationService: jasmine.SpyObj<QuestionEvaluationService>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    let spyDialogService: jasmine.SpyObj<DialogTransitionService>;

    const mockQuestion: Question = QUESTIONS.map((obj) => Object.assign({ ...obj }))[0];
    const iMatchMock: IMatch = {
        game: Object.assign(GAMES[0]),
        begin: '',
        end: '',
        bestScore: 0,
        accessCode: '1234',
        testing: false,
        players: [],
        managerName: 'organisateur',
        isAccessible: true,
        bannedNames: ['organisateur'],
        playerAnswers: [],
        panicMode: false,
        timer: 0,
        timing: true,
    };
    beforeEach(() => {
        spyChart = jasmine.createSpyObj('Chart', ['update', 'destroy', 'render']);
        spyMatchPlayerService = jasmine.createSpyObj('MatchPlayerService', [
            'initializeQuestion',
            'getCurrentQuestion',
            'sendNextQuestion',
            'currentQuestionIndex',
            'isLastQuestion',
            'match',
            'initializePlayersList',
            'sortPlayersList',
            'setCurrentMatch',
            'isCurrentQuestionTheLastOne',
            'dataSource',
            'cleanCurrentMatch',
            'deleteMatchByAccessCode',
            'getMaxTime',
        ]);
        spySocketService = jasmine.createSpyObj('SocketService', ['connect', 'isSocketAlive', 'on', 'send']);
        spyTimeService = jasmine.createSpyObj('TimeService', ['startTimer', 'stopServerTimer', 'resumeTimer', 'startPanicModeTimer']);
        spyChatService = jasmine.createSpyObj('ChatService', ['cleanMessages']);
        spyHistogramService = jasmine.createSpyObj('HistogramService', [
            'initializeChartChoices',
            'setupListeners',
            'createChart',
            'countSelectedChoices',
            'getCurrentQuestionAnswers',
        ]);
        spyDialogService = jasmine.createSpyObj('DialogTransitionService', ['closeTransitionDialog', 'openTransitionDialog']);
        spyListenerManagerService = jasmine.createSpyObj('ListenerManagerService', ['setMatchManagerSideListeners', 'playerLeftEmitter']);
        spyRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
        spyQuestionEvaluationService = jasmine.createSpyObj('QuestionEvaluationService', [
            'cleanServiceAttributes',
            'setPlayersNamesList',
            'setQuestionPoints',
            'isEvaluatingQrlQuestions',
        ]);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);

        TestBed.configureTestingModule({
            declarations: [],
            imports: [
                AppMaterialModule,
                FormsModule,
                MatchManagersSideComponent,
                ChatComponent,
                QuestionDisplayComponent,
                PlayersListComponent,
                HistogramComponent,
                CommonModule,
            ],
            providers: [
                { provide: MatchPlayerService, useValue: spyMatchPlayerService },
                { provide: SocketService, useValue: spySocketService },
                { provide: TimeService, useValue: spyTimeService },
                { provide: ListenerManagerService, useValue: spyListenerManagerService },
                { provide: Router, useValue: spyRouter },
                { provide: ChatService, useValue: spyChatService },
                { provide: HistogramService, useValue: spyHistogramService },
                { provide: Chart, useValue: spyChart },
                { provide: QuestionEvaluationService, useValue: spyQuestionEvaluationService },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
                { provide: DialogTransitionService, useValue: spyDialogService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        fixture = TestBed.createComponent(MatchManagersSideComponent);
        spyHistogramService.matchPlayerService = spyMatchPlayerService;
        component = fixture.componentInstance;
        component.question = mockQuestion;
        spyListenerManagerService.playerLeftEmitter = new Subject();
        spyMatchPlayerService.match.players = [{ name: 'test', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false }];
        spyMatchPlayerService.initializePlayersList.and.returnValue();
        spyMatchPlayerService.socketService = spySocketService;
        spyMatchPlayerService.timeService = spyTimeService;
        spyMatchPlayerService.router = spyRouter;
        spyMatchPlayerService.chatService = spyChatService;
        spyMatchPlayerService.currentQuestion = QUESTIONS.map((obj) => Object.assign({ ...obj }))[0];
        spyMatchPlayerService.match = new Match(iMatchMock);
        spyMatchPlayerService.player = ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }))[0];
        spyMatchPlayerService.dataSource = new MatTableDataSource<Player>();
        spyListenerManagerService.histogramSrv = spyHistogramService;
        spyListenerManagerService.evaluationSrv = spyQuestionEvaluationService;
        component.matchService = spyMatchPlayerService;
    });

    describe('creation', () => {
        it('should create', () => {
            const playerLeftSpy = spyOn(component, 'manageAllPlayersLeftCase').and.stub();
            spyListenerManagerService.playerLeftEmitter = new Subject();
            fixture.detectChanges();
            spyListenerManagerService.playerLeftEmitter.next();
            expect(component).toBeTruthy();
            expect(playerLeftSpy).toHaveBeenCalled();
        });
        it('should create a new instance of playerLeftEmitter if it was closed', () => {
            spyOn(component, 'manageAllPlayersLeftCase').and.stub();
            spyListenerManagerService.playerLeftEmitter = new Subject();
            component.listenerSrv.playerLeftEmitter.unsubscribe();
            component.ngOnInit();
            expect(component.listenerSrv.playerLeftEmitter instanceof Subject).toBe(true);
        });
    });
    describe('destruction', () => {
        it('finishMatch should call askConfirmation from confirmation service', () => {
            component.allPlayersLeft = false;
            spyCancelConfirmationService.askConfirmation.and.stub();
            component.finishMatch();
            expect(spyCancelConfirmationService.askConfirmation).toHaveBeenCalled();
        });

        it('should call finishMatchWithoutConfirmation on onbeforeunload event', () => {
            spyOn(component, 'finishMatchWithoutConfirmation').and.stub();
            fixture.detectChanges();
            window.dispatchEvent(new Event('beforeunload'));
            expect(component.finishMatchWithoutConfirmation).toHaveBeenCalled();
        });
        it('should not call finishMatchWithoutConfirmation on onbeforeunload event after component destruction', () => {
            spyOn(component, 'finishMatchWithoutConfirmation').and.stub();
            component.ngOnDestroy();
            window.dispatchEvent(new Event('beforeunload'));
            expect(component.finishMatchWithoutConfirmation).not.toHaveBeenCalled();
        });
        it('should call finishMatchWithoutConfirmation on onpopstate event', () => {
            spyOn(component, 'finishMatchWithoutConfirmation').and.stub();
            fixture.detectChanges();
            window.dispatchEvent(new Event('popstate'));
            expect(component.finishMatchWithoutConfirmation).toHaveBeenCalled();
        });
        it('should not call finishMatchWithoutConfirmation on onpopstate event after component destruction', () => {
            spyOn(component, 'finishMatchWithoutConfirmation').and.stub();
            component.ngOnDestroy();
            window.dispatchEvent(new Event('popstate'));
            expect(component.finishMatchWithoutConfirmation).not.toHaveBeenCalled();
        });
    });
    describe('newQuestion', () => {
        it('should set isShowingQuestionResults, timer and question and call initializeQuestion', () => {
            spyHistogramService.isShowingQuestionResults = true;
            spyMatchPlayerService.currentQuestion = new Question(QUESTIONS.map((obj) => Object.assign({ ...obj }))[0]);
            spyMatchPlayerService.match = new Match(iMatchMock);
            const initializeQuestionSpy = spyMatchPlayerService.initializeQuestion.and.stub();
            component.newQuestion();
            expect(spyHistogramService.isShowingQuestionResults).toBe(false);
            expect(component.question).toBeDefined();
            expect(spyTimeService.timer).toEqual(iMatchMock.game.duration);
            expect(initializeQuestionSpy).toHaveBeenCalled();
        });
        it('should call startTimer with right parameters', () => {
            spyMatchPlayerService.match = new Match(iMatchMock);
            spyMatchPlayerService.match.timer = iMatchMock.game.duration;
            spyMatchPlayerService.match.game.duration = iMatchMock.game.duration;
            spyMatchPlayerService.initializeQuestion.and.stub();
            spyMatchPlayerService.getMaxTime.and.returnValue(iMatchMock.game.duration);
            spyTimeService.startTimer.and.stub();
            component.newQuestion();
            const [time, accessCode, callback] = spyTimeService.startTimer.calls.mostRecent().args;

            expect(time).toEqual(iMatchMock.game.duration);
            expect(accessCode).toEqual(iMatchMock.accessCode);
            expect(typeof callback).toBe('function');
            spyMatchPlayerService.currentQuestion.type = QUESTION_TYPE.qrl;
            const spy = spyOn(component, 'evaluateQrlAnswers').and.stub();
            callback();
            expect(spy).toHaveBeenCalled();
            spyMatchPlayerService.currentQuestion.type = QUESTION_TYPE.qcm;
            callback();
            expect(spyHistogramService.isShowingQuestionResults).toBe(true);
        });
        it('should set isLastQuestion at true if isCurrentQuestionTheLastOne ', () => {
            spyMatchPlayerService.match = new Match(iMatchMock);
            spyMatchPlayerService.initializeQuestion.and.stub();
            spyTimeService.startTimer.and.stub();
            spyMatchPlayerService.isCurrentQuestionTheLastOne.and.returnValue(true);
            component.newQuestion();
            expect(component.isLastQuestion).toBe(true);
        });
    });
    describe('finishMatchWithoutConfirmation', () => {
        it('should send finishMatchWithoutConfirmation event with right parameters and call cleanMatch functions ', () => {
            spyMatchPlayerService.match = new Match(iMatchMock);
            spyTimeService.stopServerTimer.and.stub();
            spyMatchPlayerService.cleanCurrentMatch.and.stub();
            spyMatchPlayerService.deleteMatchByAccessCode.and.returnValue(of(true));
            spyChatService.cleanMessages.and.stub();
            spyRouter.navigateByUrl.and.stub();
            spySocketService.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.FinishMatch);
                expect(data).toEqual({ id: iMatchMock.accessCode });
            });
            component.finishMatchWithoutConfirmation();
            expect(spyTimeService.stopServerTimer).toHaveBeenCalledWith(iMatchMock.accessCode);
            expect(spyMatchPlayerService.deleteMatchByAccessCode).toHaveBeenCalledWith(iMatchMock.accessCode);
            expect(spyMatchPlayerService.cleanCurrentMatch).toHaveBeenCalled();
            expect(spyChatService.cleanMessages).toHaveBeenCalled();
            expect(spyRouter.navigateByUrl).toHaveBeenCalledWith('/home');
        });
    });
    describe('connect', () => {
        it('should call setupRealMatchListeners and connect method of socket service if socket is not alive', () => {
            spySocketService.isSocketAlive.and.returnValue(false);
            const setupListenersSpy = spyOn(component, 'setupRealMatchListeners').and.stub();
            component.connect();
            expect(spySocketService.connect).toHaveBeenCalled();
            expect(setupListenersSpy).toHaveBeenCalled();
        });
        it('should call setupRealMatchListeners but not connect method of socket service if socket is alive', () => {
            spySocketService.isSocketAlive.and.returnValue(true);
            const setupListenersSpy = spyOn(component, 'setupRealMatchListeners').and.stub();
            component.connect();
            expect(spySocketService.connect).not.toHaveBeenCalled();
            expect(setupListenersSpy).toHaveBeenCalled();
        });
    });
    describe('setupRealMatchListeners', () => {
        it('should call setMatchManagerSideListeners and on methods with right parameters', () => {
            spyOn(component, 'haveAllPlayersLeft').and.returnValue(false);
            component.setupRealMatchListeners();
            expect(spyListenerManagerService.setMatchManagerSideListeners).toHaveBeenCalled();
            const [event, callback] = spySocketService.on.calls.mostRecent().args;
            expect(event).toEqual(SocketsOnEvents.AllPlayersResponded);
            expect(typeof callback).toBe('function');
            callback({});
            expect(spyHistogramService.isShowingQuestionResults).toBe(true);
        });
        it('should call setQuestionPoints and evaluateQrlAnswers in on callback if it is a qrl question', () => {
            spyOn(component, 'haveAllPlayersLeft').and.returnValue(false);
            component.setupRealMatchListeners();
            const [event, callback] = spySocketService.on.calls.mostRecent().args;
            expect(event).toEqual(SocketsOnEvents.AllPlayersResponded);
            expect(typeof callback).toBe('function');
            spyMatchPlayerService.currentQuestion.type = QUESTION_TYPE.qrl;
            const questionPointsSpy = spyQuestionEvaluationService.setQuestionPoints.and.stub();
            const evaluateQrlSpy = spyOn(component, 'evaluateQrlAnswers').and.stub();
            callback({});
            expect(questionPointsSpy).toHaveBeenCalled();
            expect(evaluateQrlSpy).toHaveBeenCalled();
        });
    });
    describe('sendSwitchQuestion', () => {
        it('should send a switchQuestion event', () => {
            spySocketService.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.SwitchQuestion);
                expect(data).toEqual({ id: iMatchMock.accessCode });
            });
            component.sendSwitchQuestion();
        });
    });

    describe('sendPanicModeActivated', () => {
        it('should send a PanicModeActivated event', () => {
            spySocketService.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.PanicModeActivated);
                expect(data).toEqual({ id: iMatchMock.accessCode });
            });
            component.sendPanicModeActivated();
        });
    });
    describe('onNextQuestion', () => {
        it('should call sendSwitchQuestion of matchPlayer service', () => {
            spyTimeService.startTimer.and.stub();
            spyMatchPlayerService.isCurrentQuestionTheLastOne.and.stub();
            const spy = spyOn(component, 'sendSwitchQuestion').and.stub();
            component.onNextQuestion();
            expect(spy).toHaveBeenCalled();
        });
        it('should call openTransitionDialog with right parameters', () => {
            spyDialogService.openTransitionDialog.and.stub();
            spyTimeService.startTimer.and.stub();
            spyMatchPlayerService.isCurrentQuestionTheLastOne.and.returnValue(true);
            component.onNextQuestion();

            expect(spyDialogService.openTransitionDialog).toHaveBeenCalledWith(
                TRANSITIONS_MESSAGES.transitionToResultsView,
                TRANSITIONS_DURATIONS.betweenQuestions,
            );

            spyMatchPlayerService.isCurrentQuestionTheLastOne.and.returnValue(false);
            component.onNextQuestion();

            expect(spyDialogService.openTransitionDialog).toHaveBeenCalledWith(
                TRANSITIONS_MESSAGES.transitionToNextQuestion,
                TRANSITIONS_DURATIONS.betweenQuestions,
            );
        });
        it('should call startTimer with right parameters', () => {
            spyMatchPlayerService.isCurrentQuestionTheLastOne.and.stub();
            spyOn(component, 'sendSwitchQuestion').and.stub();
            spyMatchPlayerService.match = new Match(iMatchMock);
            spyTimeService.startTimer.and.callFake(() => {
                return;
            });
            const spy = spyOn(component, 'redirectToNextQuestion').and.stub();
            component.onNextQuestion();
            const [time, accessCode, callback] = spyTimeService.startTimer.calls.mostRecent().args;
            expect(time).toEqual(TRANSITIONS_DURATIONS.betweenQuestions);
            expect(accessCode).toEqual(iMatchMock.accessCode);
            expect(typeof callback).toBe('function');
            callback();
            expect(spy).toHaveBeenCalled();
        });
    });
    describe('redirectToNextQuestion', () => {
        it('should call deleteMatchByAccessCode and navigateByUrl if it is the last question', () => {
            spyMatchPlayerService.match = new Match(iMatchMock);
            component.isLastQuestion = true;
            spyMatchPlayerService.deleteMatchByAccessCode.and.returnValue(of(true));
            spyRouter.navigateByUrl.and.stub();
            component.redirectToNextQuestion();
            expect(spyMatchPlayerService.deleteMatchByAccessCode).toHaveBeenCalledWith(iMatchMock.accessCode);
            expect(spyRouter.navigateByUrl).toHaveBeenCalledWith(`/play/result/${iMatchMock.game.id}`);
        });
        it('should call sendNextQuestion and newQuestion and createChart', () => {
            spyMatchPlayerService.sendNextQuestion.and.stub();
            const spy = spyOn(component, 'newQuestion').and.stub();
            spyHistogramService.createChart.and.stub();
            component.redirectToNextQuestion();
            expect(spyMatchPlayerService.sendNextQuestion).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
            expect(spyHistogramService.createChart).toHaveBeenCalled();
        });
        it('should call destroy if histogramService.chart is defined and isShowingQuestionResults id true', () => {
            spyMatchPlayerService.sendNextQuestion.and.stub();
            spyOn(component, 'newQuestion').and.stub();
            spyHistogramService.createChart.and.stub();
            spyHistogramService.chart = spyChart;
            spyHistogramService.isShowingQuestionResults = false;
            spyChart.destroy.and.stub();
            component.redirectToNextQuestion();
            expect(spyChart.destroy).toHaveBeenCalled();
        });
    });

    describe('Timer methods', () => {
        // spyMatchPlayerService.match = new Match(iMatchMock);
        it('timerPauseHandler should pause the timer if it is running', () => {
            component.isPaused = false;
            spyTimeService.stopServerTimer.and.stub();
            component.timerPauseHandler();
            expect(spyTimeService.stopServerTimer).toHaveBeenCalled();
            expect(component.isPaused).toEqual(true);
        });

        it('timerPauseHandler should resume the timer if it is paused', () => {
            component.isPaused = true;
            component.isPanicMode = false;
            spyTimeService.stopServerTimer.and.stub();
            component.timerPauseHandler();
            expect(spyTimeService.resumeTimer).toHaveBeenCalled();
            expect(component.isPaused).toEqual(false);
        });

        it('startPanicModeTimer should call service method', () => {
            component.isPaused = false;
            spyTimeService.startPanicModeTimer.and.stub();
            const spySendPanicModeEvent = spyOn(component, 'sendPanicModeActivated').and.stub();
            component.startPanicModeTimer();
            expect(spyTimeService.startPanicModeTimer).toHaveBeenCalledWith(spyMatchPlayerService.match.accessCode);
            expect(spySendPanicModeEvent).toHaveBeenCalled();
        });

        it('isPanicModeSettable should be true when QCM and QRL are under the limit time', () => {
            spyMatchPlayerService.currentQuestion.type = 'QCM';
            spyTimeService.timer = 50;
            expect(component.isPanicModeSettable()).toEqual(false);
            spyTimeService.timer = 9;
            expect(component.isPanicModeSettable()).toEqual(true);

            spyMatchPlayerService.currentQuestion.type = 'QRL';
            spyTimeService.timer = 50;
            expect(component.isPanicModeSettable()).toEqual(false);
            spyTimeService.timer = 15;
            expect(component.isPanicModeSettable()).toEqual(true);
        });

        it('pauseTimer should call service method', () => {
            component.isPaused = false;
            spyTimeService.stopServerTimer.and.stub();
            component['pauseTimer']();
            expect(spyTimeService.stopServerTimer).toHaveBeenCalledWith(spyMatchPlayerService.match.accessCode);
        });

        it('resumeTimer should call startPanicModeTimer if it is panicMode', () => {
            component.isPanicMode = true;
            const spyStartPanicMode = spyOn(component, 'startPanicModeTimer').and.stub();
            component['resumeTimer']();
            expect(spyStartPanicMode).toHaveBeenCalled();
        });
        it('resumeTimer should call resumeTimer if it is not panicMode', () => {
            component.isPanicMode = false;
            spyTimeService.resumeTimer.and.stub();
            component['resumeTimer']();
            const [accessCode, callback] = spyTimeService.resumeTimer.calls.mostRecent().args;
            callback();
            expect(accessCode).toEqual(iMatchMock.accessCode);
            expect(spyTimeService.resumeTimer).toHaveBeenCalled();
        });
    });

    describe('evaluateQrlAnswers', () => {
        it('should call stopServerTimer, setPlayersNamesList, set isEvaluatingQrlQuestions and send BeginQrlEvaluation event', () => {
            spyTimeService.stopServerTimer.and.stub();
            spyQuestionEvaluationService.setPlayersNamesList.and.stub();
            component.evaluateQrlAnswers();
            expect(spyTimeService.stopServerTimer).toHaveBeenCalledWith(iMatchMock.accessCode);
            expect(spyQuestionEvaluationService.setPlayersNamesList).toHaveBeenCalled();
            expect(spyQuestionEvaluationService.isEvaluatingQrlQuestions).toBeTrue();
            expect(spySocketService.send).toHaveBeenCalledWith(SocketsSendEvents.BeginQrlEvaluation, { id: iMatchMock.accessCode });
        });
    });

    describe('canMoveToNextQuestion', () => {
        it('should return false if not showingResults ', () => {
            spyHistogramService.isShowingQuestionResults = false;
            const returnValue = component.canMoveToNextQuestion();
            spyOn(component, 'isCurrentQuestionOfTypeQRL').and.stub();
            expect(returnValue).toBeFalse();
        });
        it('should return true if showingResults and not isQRLQuestion', () => {
            spyHistogramService.isShowingQuestionResults = true;
            spyOn(component, 'isCurrentQuestionOfTypeQRL').and.returnValue(false);
            const returnValue = component.canMoveToNextQuestion();
            expect(returnValue).toBeTrue();
        });
        it('should return true if showingResults and isQRLQuestion and not isEvaluatingQRL', () => {
            spyHistogramService.isShowingQuestionResults = true;
            spyOn(component, 'isCurrentQuestionOfTypeQRL').and.returnValue(true);
            spyQuestionEvaluationService.isEvaluatingQrlQuestions = false;
            const returnValue = component.canMoveToNextQuestion();
            expect(returnValue).toBeTrue();
        });
    });

    describe('Audio', () => {
        it('restartAudio should relaunch the music by calling play ', () => {
            component.audioZone = {
                nativeElement: {
                    currentTime: 1,
                    play: () => {
                        return;
                    },
                },
            } as ElementRef;
            const playSpy = spyOn(component.audioZone.nativeElement, 'play');
            component.restartAudio();
            expect(playSpy).toHaveBeenCalled();
            expect(component.audioZone.nativeElement.currentTime).toEqual(0);
        });
    });

    describe('All players left', () => {
        it('haveAllPlayersLeft should return true if all Player Left ', () => {
            spyMatchPlayerService.match.players = [{ name: 'test', isActive: false, score: 0, nBonusObtained: 0, chatBlocked: false }];
            expect(component.haveAllPlayersLeft()).toBeTrue();
        });
        it('haveAllPlayersLeft should call finishMatchWithoutConfirmation ', () => {
            spyMatchPlayerService.match.players = [{ name: 'test', isActive: false, score: 0, nBonusObtained: 0, chatBlocked: false }];
            spyTimeService.startTimer.and.stub();
            const endMatchSpy = spyOn(component, 'finishMatchWithoutConfirmation').and.stub();
            component.manageAllPlayersLeftCase();

            const [time, accessCode, callback] = spyTimeService.startTimer.calls.mostRecent().args;
            expect(time).toEqual(TRANSITIONS_DURATIONS.endMatchAfterPlayersLeft);
            expect(accessCode).toEqual(iMatchMock.accessCode);
            expect(typeof callback).toBe('function');
            callback();
            expect(endMatchSpy).toHaveBeenCalled();
        });
    });
});
