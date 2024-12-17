import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ObserverQuitRequest } from '@app/core/classes/match/dto/observer-quit-request';
import { Observer } from '@app/core/classes/match/observer';
import { Question } from '@app/core/classes/question/question';
import {
    DIALOG,
    DIALOG_MESSAGE_EN,
    DIALOG_MESSAGE_FR,
    MAX_PANIC_TIME_FOR,
    QUESTION_TYPE,
    SocketsOnEvents,
    SocketsSendEvents,
    TRANSITIONS_DURATIONS,
    TRANSITIONS_MESSAGES_EN,
    TRANSITIONS_MESSAGES_FR,
} from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { Room } from '@app/core/interfaces/room';
import { UpdateChartDataRequest } from '@app/core/interfaces/update-chart-data-request';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/core/services/dialog-transition-service/dialog-transition.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { ListenerManagerService } from '@app/core/websocket/services/listener-manager/listener-manager.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatComponent } from '@app/shared/components/chat/chat.component';
import { HistogramComponent } from '@app/shared/components/histogram/histogram.component';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { PlayersListComponent } from '@app/shared/components/players-list/players-list.component';
import { QrlEvaluationComponent } from '@app/shared/components/qrl-evaluation/qrl-evaluation.component';
import { QuestionDisplayComponent } from '@app/shared/components/question-display/question-display.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';

/**
 * Component that includes all the elements on the manager's match view :
 * current question,timer, player's list, histogram for current question's statistics and a chat zone.
 * It allows the manager to manage the match by deciding to send the next question to players and
 * navigate to the results view at the end of the match
 * The manager can click on the button 'Quitter' to finish the match
 */
@Component({
    selector: 'app-match-managers-side',
    templateUrl: './match-managers-side.component.html',
    styleUrls: ['./match-managers-side.component.scss'],
    standalone: true,
    imports: [
        AppMaterialModule,
        LogoComponent,
        ChatComponent,
        QrlEvaluationComponent,
        HistogramComponent,
        PlayersListComponent,
        QuestionDisplayComponent,
        CommonModule,
        TranslateModule,
    ],
})
export class MatchManagersSideComponent implements OnInit, OnDestroy {
    @ViewChild('audioZone') audioZone: ElementRef;
    question: Question;
    maxTime: number;
    isLastQuestion: boolean = false;
    isPaused: boolean = false;
    wasMessageShowed: boolean = false;
    isPanicMode: boolean;
    allPlayersLeft: boolean = false;
    nextQuestionSubscription: Subscription;
    selectedPlayer: string = '';
    matchFinishedSubscription: Subscription;

    // eslint-disable-next-line max-params
    constructor(
        public matchService: MatchPlayerService,
        public listenerSrv: ListenerManagerService,
        private confirmationService: CancelConfirmationService,
        private dialogTransitionService: DialogTransitionService,
        private translateService: TranslateService,
        public accountService: AccountService,
    ) {}

    isObserver(): boolean {
        return this.matchService.match.observers.some(
            observer => observer.name === this.accountService.account.pseudonym
        );
    }

    setShowingResultToFalse() {
        this.listenerSrv.histogramSrv.isShowingQuestionResults = false;
    }

    ngOnInit(): void {
        if (this.isObserver()) {
            this.connect();
            this.matchService.setupListenersPLayerView();
            this.listenerSrv.setUpNextQuestionListener();
            this.nextQuestionSubscription = this.matchService.nextQuestionEventEmitter.subscribe(this.onNextQuestion.bind(this));
            this.matchFinishedSubscription = this.matchService.matchFinishedEventEmitter.subscribe(() => {
                this.matchService.cleanCurrentMatch();
                this.matchService.router.navigateByUrl('/home');
            });
            this.listenerSrv.evaluationSrv.setPlayersNamesList();
            if (this.listenerSrv.playerLeftEmitter.closed) {
                // Create a new instance of playerLeftEmitter in case we already unsubscribe
                this.listenerSrv.playerLeftEmitter = new Subject<void>();
            }
            this.listenerSrv.playerLeftEmitter.subscribe(() => {
                this.manageAllPlayersLeftCase();
            });
            this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions = false;
            this.isPanicMode = false;
            this.matchService.initializeObserverQuestion();
            this.question = this.matchService.currentQuestion;
            if (this.matchService.isCurrentQuestionTheLastOne()) {
                this.isLastQuestion = true;
            }
            this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions = this.matchService.match.isEvaluatingQrl;
            this.maxTime = this.matchService.getMaxTime();
            this.matchService.timeService.timer = this.matchService.match.timer;
            this.isPanicMode = this.matchService.match.panicMode;
            this.listenerSrv.histogramSrv.isShowingQuestionResults = this.matchService.match.timer === 0;

            this.matchService.timeService.setUpTimer(this.setShowingResultToFalse.bind(this), () => {
                if (this.matchService.currentQuestion.type === QUESTION_TYPE.qrl) this.evaluateQrlAnswers();
                else this.listenerSrv.histogramSrv.isShowingQuestionResults = true;
            });

        } else {
            this.listenerSrv.histogramSrv.isShowingMatchResults = false;
            this.listenerSrv.histogramSrv.currentChartIndex = 0;
            this.isPanicMode = false;
            this.newQuestion();
            this.connect();
            this.maxTime = this.matchService.getMaxTime();
            window.onbeforeunload = () => {
                this.finishMatchWithoutConfirmation();
            };
            window.onpopstate = () => {
                this.finishMatchWithoutConfirmation();
            };
            this.listenerSrv.evaluationSrv.setPlayersNamesList();

            if (this.listenerSrv.playerLeftEmitter.closed) {
                // Create a new instance of playerLeftEmitter in case we already unsubscribe
                this.listenerSrv.playerLeftEmitter = new Subject<void>();
            }
            this.listenerSrv.playerLeftEmitter.subscribe(() => {
                this.manageAllPlayersLeftCase();
            });
        }

    }

    ngOnDestroy(): void {
        if (!this.listenerSrv.playerLeftEmitter?.closed) {
            this.listenerSrv.playerLeftEmitter?.unsubscribe();
        }
        if (!this.nextQuestionSubscription?.closed) {
            this.nextQuestionSubscription?.unsubscribe();
        }
        if (!this.matchFinishedSubscription?.closed) {
            this.matchFinishedSubscription?.unsubscribe();
        }
        window.onbeforeunload = () => {
            return;
        };
        window.onpopstate = () => {
            return;
        };
    }

    newQuestion(): void {
        this.listenerSrv.histogramSrv.isShowingQuestionResults = false;
        this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions = false;
        this.isPanicMode = false;
        this.matchService.timeService.timer = this.matchService.match.game.duration;
        this.matchService.initializeQuestion();
        this.question = this.matchService.currentQuestion;
        this.maxTime = this.matchService.getMaxTime();
        this.matchService.timeService.startTimer(this.maxTime, this.matchService.match.accessCode, () => {
            if (this.matchService.currentQuestion.type === QUESTION_TYPE.qrl) this.evaluateQrlAnswers();
            else this.listenerSrv.histogramSrv.isShowingQuestionResults = true;
        });

        if (this.matchService.isCurrentQuestionTheLastOne()) {
            this.isLastQuestion = true;
        }
    }

    finishMatchWithoutConfirmation(): void {
        this.listenerSrv.histogramSrv.playersAnswered = [];
        this.listenerSrv.histogramSrv.playersWithFinalAnswers = [];
        this.listenerSrv.histogramSrv.quittedPlayers = [];
        this.matchService.socketService.send<Room>(SocketsSendEvents.FinishMatch, {
            id: this.matchService.match.accessCode,
        });
        this.matchService.timeService.stopServerTimer(this.matchService.match.accessCode);
        this.listenerSrv.evaluationSrv.cleanServiceAttributes();
        this.matchService.deleteMatchByAccessCode(this.matchService.match.accessCode).subscribe();
        this.matchService.cleanCurrentMatch();
        this.matchService.chatService.cleanMessages();
        this.matchService.router.navigateByUrl('/home');
    }

    finishMatch(): void {
        if (this.isObserver()) {
            this.matchService.socketService.send<ObserverQuitRequest>(SocketsSendEvents.RemoveObserver, { observerName: this.accountService.account.pseudonym, accessCode: this.matchService.match.accessCode })
            return;
        }
        let dialogMessage;
        if (this.translateService.currentLang === 'fr') {
            dialogMessage = DIALOG_MESSAGE_FR.finishMatch;
        } else {
            dialogMessage = DIALOG_MESSAGE_EN.finishMatch;
        }

        this.confirmationService.askConfirmation(this.finishMatchWithoutConfirmation.bind(this), dialogMessage);
    }

    connect(): void {
        this.matchService.socketService.connect();
        this.setupRealMatchListeners();
    }

    setupRealMatchListeners(): void {
        this.listenerSrv.setMatchManagerSideListeners();

        this.matchService.socketService.on<Observer[]>(SocketsOnEvents.ObserverRemoved, (observers: Observer[]) => {
            if (this.isObserver()) {
                this.matchService.cleanCurrentMatch();
                this.matchService.router.navigateByUrl('/home');
            } else {
                this.matchService.match.observers = observers;
            }
        });

        this.matchService.socketService.on<PlayerAnswers>(SocketsOnEvents.AllPlayersResponded, () => {
            if (!this.haveAllPlayersLeft()) {
                this.matchService.timeService.stopServerTimer(this.matchService.match.accessCode, false)
                this.listenerSrv.histogramSrv.isShowingQuestionResults = true;
                if (this.matchService.currentQuestion.type === QUESTION_TYPE.qrl) {
                    this.listenerSrv.evaluationSrv.setQuestionPoints();
                    this.evaluateQrlAnswers();
                }
            }
        });
    }

    sendSwitchQuestion(): void {
        this.matchService.sendNextQuestion();
        if (!this.isObserver()) {
            this.matchService.socketService.send(SocketsSendEvents.SwitchQuestion, {
                accessCode: this.matchService.match.accessCode,
                currentQuestionIndex: this.matchService.getCurrentQuestionIndex
            });
        }

    }

    sendPanicModeActivated(): void {
        this.matchService.socketService.send<Room>(SocketsSendEvents.PanicModeActivated, {
            id: this.matchService.match.accessCode,
        });
    }

    onNextQuestion(): void {
        this.matchService.socketService.send<UpdateChartDataRequest>(SocketsSendEvents.SendChartData, {
            matchAccessCode: this.matchService.match.accessCode,
            questionChartData: {
                labelList: this.listenerSrv.histogramSrv.labelList,
                chartData: this.listenerSrv.histogramSrv.chartData,
                chartColor: this.listenerSrv.histogramSrv.chartColor,
                xLineText: this.listenerSrv.histogramSrv.xLineText,
            },
        });
        this.listenerSrv.histogramSrv.isShowingMatchResults = this.matchService.isCurrentQuestionTheLastOne();
        this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions = false;
        this.isPaused = false;
        let transitionText;
        if (this.translateService.currentLang === 'fr') {
            transitionText = this.matchService.isCurrentQuestionTheLastOne()
                ? TRANSITIONS_MESSAGES_FR.transitionToResultsView
                : TRANSITIONS_MESSAGES_FR.transitionToNextQuestion;
        } else {
            transitionText = this.matchService.isCurrentQuestionTheLastOne()
                ? TRANSITIONS_MESSAGES_EN.transitionToResultsView
                : TRANSITIONS_MESSAGES_EN.transitionToNextQuestion;
        }
        this.sendSwitchQuestion();
        this.matchService.hasQuestionEvaluationBegun = false;
        this.dialogTransitionService.openTransitionDialog(transitionText, TRANSITIONS_DURATIONS.betweenQuestions);
        this.matchService.timeService.startTimer(TRANSITIONS_DURATIONS.betweenQuestions, this.matchService.match.accessCode, () => {
            this.redirectToNextQuestion();
        });
    }

    timerPauseHandler(): void {
        if (this.isObserver()) {
            return;
        }
        if (this.isPaused) this.resumeTimer();
        else this.pauseTimer();
        this.isPaused = !this.isPaused;
    }

    startPanicModeTimer(): void {
        if (this.isObserver()) {
            return;
        }
        if (!this.isPaused) {
            this.isPanicMode = true;
            this.sendPanicModeActivated();
            this.matchService.timeService.startPanicModeTimer(this.matchService.match.accessCode);
        }
    }

    isPanicModeSettable(): boolean {
        if (this.matchService.currentQuestion.type === QUESTION_TYPE.qrl) return this.matchService.timeService.timer <= MAX_PANIC_TIME_FOR.qrl;
        else return this.matchService.timeService.timer <= MAX_PANIC_TIME_FOR.qcm;
    }

    redirectToNextQuestion(): void {
        this.dialogTransitionService.closeTransitionDialog();
        if (this.isLastQuestion) {
            this.listenerSrv.histogramSrv.isShowingQuestionResults = false;
            this.matchService.deleteMatchByAccessCode(this.matchService.match.accessCode).subscribe((response: any) => {
                this.matchService.socketService.send<{ id: string, winnerPlayerName: string }>(SocketsSendEvents.UpdateMoney, {
                    id: this.matchService.match.accessCode,
                    winnerPlayerName: response.winnerPlayerName,
                });
            });
            this.matchService.router.navigateByUrl(`/play/result/${this.matchService.match.game.id}`);
        } else {
            this.listenerSrv.histogramSrv.playersAnswered = [];
            this.listenerSrv.histogramSrv.playersWithFinalAnswers = [];
            this.newQuestion();
            if (this.listenerSrv.histogramSrv.chart && !this.listenerSrv.histogramSrv.isShowingQuestionResults) {
                this.listenerSrv.histogramSrv.chart.destroy();
            }
            this.listenerSrv.histogramSrv.createChart();
        }
    }

    evaluateQrlAnswers(): void {
        this.matchService.timeService.stopServerTimer(this.matchService.match.accessCode);
        this.listenerSrv.evaluationSrv.setPlayersNamesList();
        this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions = true;
        this.matchService.hasQuestionEvaluationBegun = true;
        if (!this.isObserver()) this.matchService.socketService.send<Room>(SocketsSendEvents.BeginQrlEvaluation, {
            id: this.matchService.match.accessCode,
        });
    }

    isCurrentQuestionOfTypeQRL(): boolean {
        return this.matchService.currentQuestion.type === QUESTION_TYPE.qrl;
    }

    canMoveToNextQuestion(): boolean {
        const showingResults = this.listenerSrv.histogramSrv.isShowingQuestionResults;
        const isQRLQuestion = this.isCurrentQuestionOfTypeQRL();
        const isEvaluatingQRL = this.listenerSrv.evaluationSrv.isEvaluatingQrlQuestions;

        if (showingResults) {
            if (!isQRLQuestion || (isQRLQuestion && !isEvaluatingQRL)) {
                return true;
            }
        }

        return false;
    }

    restartAudio(): void {
        const audioElement = this.audioZone.nativeElement;
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play();
        }
    }

    manageAllPlayersLeftCase(): void {
        if (this.haveAllPlayersLeft()) {
            this.allPlayersLeft = true;
            this.dialogTransitionService.closeTransitionDialog();
            this.dialogTransitionService.openTransitionDialog(
                this.translateService.currentLang === 'fr'
                    ? TRANSITIONS_MESSAGES_FR.endMatchAfterPlayersLeft
                    : TRANSITIONS_MESSAGES_EN.endMatchAfterPlayersLeft,
                TRANSITIONS_DURATIONS.endMatchAfterPlayersLeft,
                DIALOG.endMatchTransitionWidth,
                DIALOG.endMatchTransitionHeight,
            );

            this.matchService.timeService.startTimer(TRANSITIONS_DURATIONS.endMatchAfterPlayersLeft, this.matchService.match.accessCode, () => {
                this.dialogTransitionService.closeTransitionDialog();
                this.finishMatchWithoutConfirmation();
            });
        }
    }

    haveAllPlayersLeft(): boolean {
        return this.matchService.match.players.every((player) => !player.isActive);
    }

    getTranslationNextQuestion(): string {
        return this.isLastQuestion ? 'TITLES.PRESENT_ANSWERS' : 'TITLES.NEXT_QUESTION';
    }

    private pauseTimer(): void {
        if (this.isObserver()) {
            return;
        }
        this.matchService.timeService.stopServerTimer(this.matchService.match.accessCode);
    }

    private resumeTimer(): void {
        if (this.isObserver()) {
            return;
        }
        if (this.isPanicMode) {
            this.isPaused = false;
            this.startPanicModeTimer();
            this.isPaused = true;
        } else
            this.matchService.timeService.resumeTimer(this.matchService.match.accessCode, () => {
                this.listenerSrv.histogramSrv.isShowingQuestionResults = true;
            });
    }

    onPlayerSelect(playerName: string): void {
        const pseudonym = this.accountService.account.pseudonym;
        this.matchService.updateObserver(pseudonym, playerName);
        this.matchService.player.name = playerName;
        if (playerName !== this.matchService.match.managerName) {
            if (!this.listenerSrv.histogramSrv.isShowingQuestionResults) {
                this.matchService.router.navigateByUrl(`/play/match/${this.matchService.match.game.id}`)
            } else {
                this.matchService.router.navigateByUrl(`/play/question-result/${this.matchService.match.game.id}`);
            }
        }
    }
}
