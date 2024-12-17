/* eslint-disable max-lines */
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { Match } from '@app/core/classes/match/match';
import { Question } from '@app/core/classes/question/question';
import { DURATIONS, FEEDBACK_MESSAGES, NAMES, QUESTION_TYPE, TRANSITIONS_DURATIONS, TRANSITIONS_MESSAGES } from '@app/core/constants/constants';
import { EXAMPLES, GAMES, PLAYER } from '@app/core/data/data';
import { Player } from '@app/core/interfaces/player';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/core/services/dialog-transition-service/dialog-transition.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/core/services/question-evaluation/question-evaluation.service';
import { ListenerManagerService } from '@app/core/websocket/services/listener-manager/listener-manager.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatComponent } from '@app/shared/components/chat/chat.component';
import { QuestionAnswerComponent } from '@app/shared/components/question-answer/question-answer.component';
import { TransitionDialogComponent } from '@app/shared/components/transition-dialog/transition-dialog.component';
import { Subscription } from 'rxjs';
import { QuestionResultComponent } from './question-result.component';

describe('QuestionResultComponent', () => {
    let component: QuestionResultComponent;
    let fixture: ComponentFixture<QuestionResultComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let listenerManagerSpy: jasmine.SpyObj<ListenerManagerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let timeServiceSpy: jasmine.SpyObj<TimeService>;
    let spySnackBar: unknown;
    let nextQuestionSubscriptionSpy: jasmine.SpyObj<Subscription>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<TransitionDialogComponent>>;
    const mockSnackBarRef = jasmine.createSpyObj<MatSnackBarRef<SimpleSnackBar>>('MatSnackBarRef', [
        'onAction',
        'afterDismissed',
        'dismiss',
        'dismissWithAction',
        '_dismissAfter',
    ]);
    const mockMatches = new Match();
    let questionEvaluationServiceSpy: jasmine.SpyObj<QuestionEvaluationService>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    let spyDialogService: jasmine.SpyObj<DialogTransitionService>;

    beforeEach(() => {
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerServiceSpy', [
            'isCurrentQuestionTheLastOne',
            'cleanCurrentMatch',
            'sendNextQuestion',
            'evaluateCurrentQuestion',
            'getCurrentQuestion',
            'quitMatch',
            'setupListenersQuestionResult',
            'setupListenersPLayerView',
            'setupQuestionResultListeners',
            'feedBackMessages',
            'questionScore',
            'hasQuestionEvaluationBegun',
            'currentQuestion',
        ]);
        matchPlayerServiceSpy.nextQuestionEventEmitter = jasmine.createSpyObj('Subject', ['next', 'subscribe']);
        matchPlayerServiceSpy.matchFinishedEventEmitter = jasmine.createSpyObj('Subject', ['next', 'subscribe']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['isSocketAlive', 'connect', 'disconnect', 'on', 'socket', 'send']);
        listenerManagerSpy = jasmine.createSpyObj('ListenerManagerService', ['setupQuestionResultListeners']);
        nextQuestionSubscriptionSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer']);
        questionEvaluationServiceSpy = jasmine.createSpyObj('QuestionEvaluationService', ['cleanServiceAttributes']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);
        spyDialogService = jasmine.createSpyObj('DialogTransitionService', ['closeTransitionDialog', 'openTransitionDialog']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [
                AppMaterialModule,
                FormsModule,
                QuestionResultComponent,
                ChatComponent,
                QuestionAnswerComponent,
                BrowserAnimationsModule,
                CommonModule,
            ],
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: ListenerManagerService, useValue: listenerManagerSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'testID' } } } },
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: Subscription, useValue: nextQuestionSubscriptionSpy },
                { provide: QuestionEvaluationService, useValue: questionEvaluationServiceSpy },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
                { provide: DialogTransitionService, useValue: spyDialogService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        fixture = TestBed.createComponent(QuestionResultComponent);
        matchPlayerServiceSpy.match = mockMatches;
        matchPlayerServiceSpy.player = { name: 'test', isActive: true, score: 1, nBonusObtained: 0, chatBlocked: false };
        matchPlayerServiceSpy.router = routerSpy;
        matchPlayerServiceSpy.socketService = socketServiceSpy;
        matchPlayerServiceSpy.timeService = timeServiceSpy;
        listenerManagerSpy.evaluationSrv = questionEvaluationServiceSpy;
        component = fixture.componentInstance;
        component.dialogRef = matDialogRefSpy;
        component.nextQuestionSubscription = nextQuestionSubscriptionSpy;
        spyOn(window, 'alert').and.stub();
        spySnackBar = spyOn(component['snackBar'], 'open').and.returnValue(mockSnackBarRef);
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should set hasQuestionEvaluationBegun to true if it is a qrl question in ngOnInit', () => {
        matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qrl;
        matchPlayerServiceSpy.hasQuestionEvaluationBegun = false;
        component.ngOnInit();
        expect(matchPlayerServiceSpy.hasQuestionEvaluationBegun).toBeTrue();
    });
    it('transitionText should be equal to Fin de la partie if it is the last question', () => {
        matchPlayerServiceSpy.isCurrentQuestionTheLastOne.and.returnValue(true);
        matchPlayerServiceSpy.match.testing = true;
        spyOn(component, 'backToMatchInTesting').and.returnValue();
        spyOn(component, 'showResultMessage').and.returnValue();
        component.ngOnInit();
        expect(matchPlayerServiceSpy.isCurrentQuestionTheLastOne).toHaveBeenCalled();
        expect(component.transitionText).toEqual('Fin de la partie');
        expect(component.backToMatchInTesting).toHaveBeenCalled();
        expect(component.showResultMessage).toHaveBeenCalled();
    });
    it('transitionText should be equal to Prochaine question if it is not the last question', () => {
        matchPlayerServiceSpy.isCurrentQuestionTheLastOne.and.returnValue(false);
        matchPlayerServiceSpy.match.testing = true;
        spyOn(component, 'backToMatchInTesting').and.returnValue();
        spyOn(component, 'showResultMessage').and.returnValue();
        component.ngOnInit();
        expect(matchPlayerServiceSpy.isCurrentQuestionTheLastOne).toHaveBeenCalled();
        expect(component.transitionText).toEqual('Prochaine question');
        expect(component.backToMatchInTesting).toHaveBeenCalled();
        expect(component.showResultMessage).toHaveBeenCalled();
    });
    it('should be call setupListeners if not a test match', () => {
        matchPlayerServiceSpy.isCurrentQuestionTheLastOne.and.returnValue(false);
        matchPlayerServiceSpy.match.testing = false;
        const spy = spyOn(component, 'setupListeners').and.returnValue();
        component.ngOnInit();
        expect(spy).toHaveBeenCalled();
    });
    it('should call quitMatchWithoutConfirmation on onbeforeunload event', () => {
        spyOn(component, 'quitMatchWithoutConfirmation').and.stub();
        spyOn(component, 'setupListeners').and.returnValue();
        component.ngOnInit();
        window.dispatchEvent(new Event('beforeunload'));
        expect(component.quitMatchWithoutConfirmation).toHaveBeenCalled();
    });
    it('should not call quitMatchWithoutConfirmation on onbeforeunload event after component destruction', () => {
        spyOn(component, 'quitMatchWithoutConfirmation').and.stub();
        component.ngOnDestroy();
        window.dispatchEvent(new Event('beforeunload'));
        expect(component.quitMatchWithoutConfirmation).not.toHaveBeenCalled();
    });
    it('should call quitMatchWithoutConfirmation on onpopstate event', () => {
        spyOn(component, 'quitMatchWithoutConfirmation').and.stub();
        spyOn(component, 'setupListeners').and.returnValue();
        component.ngOnInit();
        window.dispatchEvent(new Event('popstate'));
        expect(component.quitMatchWithoutConfirmation).toHaveBeenCalled();
    });
    it('should not call quitMatchWithoutConfirmation on onpopstate event after component destruction', () => {
        spyOn(component, 'quitMatchWithoutConfirmation').and.stub();
        component.ngOnDestroy();
        window.dispatchEvent(new Event('popstate'));
        expect(component.quitMatchWithoutConfirmation).not.toHaveBeenCalled();
    });
    it('should reset state and go to home if match finished', () => {
        component.onMatchFinished();
        expect(timeServiceSpy.stopTimer).toHaveBeenCalled();
        expect(nextQuestionSubscriptionSpy.unsubscribe).toHaveBeenCalled();
        expect(matchPlayerServiceSpy.router.navigateByUrl).toHaveBeenCalledWith('/home');
    });
    it('backToMatchInTesting should call setInterval', () => {
        const spy = spyOn(window, 'setInterval');
        component.backToMatchInTesting();
        expect(spy).toHaveBeenCalled();
    });
    it('interval should reduce time by 1 every second ', fakeAsync(() => {
        const MS_SECOND = 1000;
        component.timer = 2;
        component.backToMatchInTesting();
        tick(MS_SECOND);
        expect(component.timer).toEqual(1);
        discardPeriodicTasks();
    }));
    it('should navigate to /create if it is the last question ', fakeAsync(() => {
        const TIMEOUT = 5;
        const MS_SECOND = 1000;
        matchPlayerServiceSpy.match = new Match();
        matchPlayerServiceSpy.cleanCurrentMatch.and.returnValue();
        component.timer = TIMEOUT;
        matchPlayerServiceSpy.isCurrentQuestionTheLastOne.and.returnValue(true);
        matchPlayerServiceSpy.match.testing = true;
        component.backToMatchInTesting();
        tick((TIMEOUT + 2) * MS_SECOND);
        expect(component.timer).toEqual(0);
        discardPeriodicTasks();
        expect(matchPlayerServiceSpy.isCurrentQuestionTheLastOne).toHaveBeenCalled();
        expect(matchPlayerServiceSpy.cleanCurrentMatch).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/create');
    }));
    it('should navigate to /play/match/id if it is not the last question ', fakeAsync(() => {
        const TIMEOUT = 5;
        const MS_SECOND = 1000;
        matchPlayerServiceSpy.match = new Match();
        matchPlayerServiceSpy.match.game = new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0]);
        matchPlayerServiceSpy.cleanCurrentMatch.and.returnValue();
        component.timer = TIMEOUT;
        matchPlayerServiceSpy.isCurrentQuestionTheLastOne.and.returnValue(false);
        matchPlayerServiceSpy.sendNextQuestion.and.returnValue();
        component.backToMatchInTesting();
        tick((TIMEOUT + 2) * MS_SECOND);
        expect(component.timer).toEqual(0);
        discardPeriodicTasks();
        expect(matchPlayerServiceSpy.isCurrentQuestionTheLastOne).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/play/match/${component.matchSrv.match.game.id}`);
    }));
    it('should call showBonusMessage when showResultMessage is called', () => {
        matchPlayerServiceSpy.currentQuestion = new Question();
        matchPlayerServiceSpy.currentQuestion.points = 1;
        matchPlayerServiceSpy.match.testing = true;
        matchPlayerServiceSpy.evaluateCurrentQuestion.and.returnValue(true);
        const showBonusMessageSpy = spyOn(component, 'showBonusMessage').and.returnValue();
        component.showResultMessage();
        expect(showBonusMessageSpy).toHaveBeenCalled();
    });
    it('should open a snackBar when showBonusMessage is called', () => {
        component.showBonusMessage();
        // eslint-disable-next-line no-underscore-dangle
        mockSnackBarRef._dismissAfter.and.returnValue();
        // eslint-disable-next-line no-underscore-dangle
        expect(mockSnackBarRef._dismissAfter).toHaveBeenCalledWith(DURATIONS.bonusMessage);
    });
    it('should not open a snackBar when showBonusMessage is called for a qrl question', () => {
        matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qrl;
        component.showBonusMessage();
        // eslint-disable-next-line no-underscore-dangle
        expect(spySnackBar).not.toHaveBeenCalled();
    });
    it('quitMatchWithoutConfirmation should call PlayerMatchService.quitMatch', () => {
        const spy = spyOn(window, 'clearInterval');
        questionEvaluationServiceSpy.cleanServiceAttributes.and.callFake(() => {
            return;
        });
        matchPlayerServiceSpy.quitMatch.and.callFake(() => {
            return;
        });
        component.quitMatchWithoutConfirmation();
        expect(spy).toHaveBeenCalled();
        expect(questionEvaluationServiceSpy.cleanServiceAttributes).toHaveBeenCalled();
        expect(matchPlayerServiceSpy.quitMatch).toHaveBeenCalled();
    });
    it('should setup listener for updatedPlayerScore event', () => {
        matchPlayerServiceSpy.questionResultConnected = false;
        matchPlayerServiceSpy.player = JSON.parse(JSON.stringify(PLAYER));
        const updatePlayerMock: Player = JSON.parse(JSON.stringify(PLAYER));
        matchPlayerServiceSpy.match = new Match();
        component.setupListeners();
        expect(listenerManagerSpy.setupQuestionResultListeners).toHaveBeenCalled();
        expect(socketServiceSpy.on).toHaveBeenCalledWith('updatedPlayerScore', jasmine.any(Function));
        const callCount = socketServiceSpy.on.calls.count();
        for (let i = 0; i < callCount; i++) {
            const args = socketServiceSpy.on.calls.argsFor(i);
            const eventName = args[0];
            const callback = args[1];
            if (eventName === 'updatedPlayerScore') {
                const spy = spyOn(component, 'updatePlayerScore').and.returnValue();
                callback(updatePlayerMock);
                expect(spy).toHaveBeenCalled();
                break;
            }
        }
    });
    it('should return if player does not exist when updating score', () => {
        matchPlayerServiceSpy.match = new Match();
        const result = component.updatePlayerScore(JSON.parse(JSON.stringify(PLAYER)));
        expect(result).toBe();
    });
    it('should add score if previous score is 0', () => {
        matchPlayerServiceSpy.match = new Match();
        const playerMock: Player = JSON.parse(JSON.stringify(PLAYER));
        playerMock.score = 0;
        matchPlayerServiceSpy.match.players = [playerMock];
        spyOn(matchPlayerServiceSpy.match, 'getScoreOfPlayerByName').and.returnValue(playerMock.score);
        spyOn(component, 'handleFeedBackMessages').and.returnValue();
        component.updatePlayerScore(playerMock);
        expect(matchPlayerServiceSpy.questionScore).toBe(playerMock.score);
    });
    it('should calculate new score if previous score is not 0', () => {
        matchPlayerServiceSpy.match = new Match();
        const playerMock: Player = JSON.parse(JSON.stringify(PLAYER));
        playerMock.score = 5;
        const PREVIOUS_SCORE = 4;
        matchPlayerServiceSpy.match.players = [playerMock];
        spyOn(matchPlayerServiceSpy.match, 'getScoreOfPlayerByName').and.returnValue(PREVIOUS_SCORE);
        spyOn(component, 'handleFeedBackMessages').and.returnValue();
        component.updatePlayerScore(playerMock);
        expect(matchPlayerServiceSpy.questionScore).toBe(playerMock.score - PREVIOUS_SCORE);
    });
    it('should set matchPlayerService.player.score if it is a qcm question', () => {
        matchPlayerServiceSpy.match = new Match();
        const playerMock: Player = JSON.parse(JSON.stringify(PLAYER));
        playerMock.score = 5;
        const PREVIOUS_SCORE = 4;
        matchPlayerServiceSpy.match.players = [playerMock];
        matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qcm;
        spyOn(matchPlayerServiceSpy.match, 'getScoreOfPlayerByName').and.returnValue(PREVIOUS_SCORE);
        spyOn(component, 'handleFeedBackMessages').and.returnValue();
        component.updatePlayerScore(playerMock);
        expect(matchPlayerServiceSpy.player.score).toEqual(playerMock.score);
    });
    it('should call openTransitionDialog with right parameters', () => {
        spyDialogService.openTransitionDialog.and.stub();
        timeServiceSpy.startTimer.and.stub();
        matchPlayerServiceSpy.isCurrentQuestionTheLastOne.and.returnValue(true);
        component.nextQuestion();

        expect(spyDialogService.openTransitionDialog).toHaveBeenCalledWith(
            TRANSITIONS_MESSAGES.transitionToResultsView,
            TRANSITIONS_DURATIONS.betweenQuestions,
        );

        matchPlayerServiceSpy.isCurrentQuestionTheLastOne.and.returnValue(false);
        component.nextQuestion();

        expect(spyDialogService.openTransitionDialog).toHaveBeenCalledWith(
            TRANSITIONS_MESSAGES.transitionToNextQuestion,
            TRANSITIONS_DURATIONS.betweenQuestions,
        );
    });
    it('should close dialog, unsubscribe for next questions, and call backToMatch when timer finish', () => {
        const backToMatchSpy = spyOn(component, 'backToMatch');
        component.onTimerFinished();
        expect(nextQuestionSubscriptionSpy.unsubscribe).toHaveBeenCalled();
        expect(backToMatchSpy).toHaveBeenCalled();
    });
    it('should navigate to right path if it is the last answer and is not a test match', () => {
        matchPlayerServiceSpy.isCurrentQuestionTheLastOne.and.returnValue(true);
        matchPlayerServiceSpy.match = new Match();
        matchPlayerServiceSpy.match.game = new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0]);
        matchPlayerServiceSpy.match.testing = false;
        component.backToMatch();
        expect(matchPlayerServiceSpy.router.navigateByUrl).toHaveBeenCalledWith(`/play/result/${matchPlayerServiceSpy.match.game.id}`);
    });
    it('should call showBonusMessage if player gets the bonus', () => {
        matchPlayerServiceSpy.currentQuestion = new Question();
        matchPlayerServiceSpy.currentQuestion.points = 0;
        matchPlayerServiceSpy.questionScore = 1;
        const showBonusMessageSpy = spyOn(component, 'showBonusMessage').and.returnValue();
        component.handleFeedBackMessages();
        expect(showBonusMessageSpy).toHaveBeenCalled();
    });

    it('abandonGame should call abandonGameWithoutConfirmation', () => {
        spyCancelConfirmationService.askConfirmation.and.stub();
        component.quitMatch();
        expect(spyCancelConfirmationService.askConfirmation).toHaveBeenCalled();
    });

    it('should initializeFeedBackMessages to answer and score added messages if the question type is qrl and it is the the testing view', () => {
        matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qrl;
        matchPlayerServiceSpy.player.name = NAMES.tester;
        const expectedMessages = [
            FEEDBACK_MESSAGES.rightAnswer,
            `${matchPlayerServiceSpy.currentQuestion.points} ${FEEDBACK_MESSAGES.pointsAddedToScore}`,
        ];
        component.initializeFeedBackMessages();
        expect(matchPlayerServiceSpy.feedBackMessages).toEqual(expectedMessages);
    });
    it('should initializeFeedBackMessages to evaluation messages if the question type is qrl and it is the the match view', () => {
        matchPlayerServiceSpy.currentQuestion.type = QUESTION_TYPE.qrl;
        matchPlayerServiceSpy.player.name = EXAMPLES.playerName;
        component.initializeFeedBackMessages();
        expect(matchPlayerServiceSpy.feedBackMessages[0]).toEqual(FEEDBACK_MESSAGES.waiting);
        expect(matchPlayerServiceSpy.feedBackMessages[1]).toEqual(FEEDBACK_MESSAGES.duringEvaluation);
    });
});
