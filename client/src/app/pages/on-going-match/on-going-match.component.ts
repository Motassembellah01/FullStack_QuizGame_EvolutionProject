import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ObserverQuitRequest } from '@app/core/classes/match/dto/observer-quit-request';
import {
    DIALOG_MESSAGE_EN,
    DIALOG_MESSAGE_FR,
    DURATIONS,
    FEEDBACK_MESSAGES_EN,
    FEEDBACK_MESSAGES_FR,
    SocketsOnEvents,
    SocketsSendEvents,
} from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { ChatAccessibilityRequest } from '@app/core/interfaces/chat-accessibility-request';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { ListenerManagerService } from '@app/core/websocket/services/listener-manager/listener-manager.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { AlertDialogComponent } from '@app/shared/alert-dialog/alert-dialog.component';
import { ChatComponent } from '@app/shared/components/chat/chat.component';
import { QuestionAnswerComponent } from '@app/shared/components/question-answer/question-answer.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-on-going-match',
    templateUrl: './on-going-match.component.html',
    styleUrls: ['./on-going-match.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, QuestionAnswerComponent, ChatComponent, CommonModule, TranslateModule],
})

/**
 * Component that includes all the elements on the player's match view :
 * current question, score, timer, and a chat zone.
 * The player can click on the button 'Abandonner' to quit the match
 */
export class OnGoingMatchComponent implements OnInit, OnDestroy {
    @Output() sendEvent: EventEmitter<void> = new EventEmitter<void>();
    @ViewChild('audioZone') audioZone: ElementRef;
    maxTime: number;
    matchFinishedSubscription: Subscription;
    isPanicMode: boolean;
    selectedPlayer: string = '';

    // eslint-disable-next-line max-params
    constructor(
        public matchSrv: MatchPlayerService,
        private listenerSrv: ListenerManagerService,
        private snackBar: MatSnackBar,
        private confirmationService: CancelConfirmationService,
        public accountService: AccountService,
        private translateService: TranslateService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        if (this.matchSrv.isObserver()) {
            this.listenerSrv.histogramSrv.isShowingMatchResults = false;
            this.isPanicMode = false;
            this.matchSrv.hasQuestionEvaluationBegun = false;
            this.maxTime = this.matchSrv.getMaxTime();
            this.setPanicMode();
            this.matchSrv.timeService.setUpTimer(() => {}, this.onTimerFinish.bind(this));
            this.listenerSrv.showResultsOnAllPlayersResponded();
            this.matchSrv.initializeQuestion();
            this.matchFinishedSubscription = this.matchSrv.matchFinishedEventEmitter.subscribe(this.redirectToHome.bind(this));
        } else {
            this.listenerSrv.histogramSrv.isShowingMatchResults = false;
            this.listenerSrv.histogramSrv.currentChartIndex = 0;
            this.isPanicMode = false;
            this.matchSrv.initializeQuestion();
            window.history.replaceState({}, '', '');
            this.maxTime = this.matchSrv.getMaxTime();
            this.matchFinishedSubscription = this.matchSrv.matchFinishedEventEmitter.subscribe(this.redirectToHome.bind(this));
            if (this.matchSrv.match.testing) {
                this.connect();
                this.matchSrv.joinMatchRoom(this.matchSrv.match.accessCode);
            }

            this.matchSrv.timeService.timer = this.maxTime;
            this.matchSrv.timeService.startTimer(this.maxTime, this.matchSrv.match.accessCode, this.onTimerFinish.bind(this));
            this.setUpListeners();
            window.onbeforeunload = () => {
                this.handleQuitMatchActionsWithoutConfirmation();
            };
            window.onpopstate = () => {
                this.handleQuitMatchActionsWithoutConfirmation();
            };

            this.matchSrv.hasQuestionEvaluationBegun = false;
        }
    }

    setUpListeners(): void {
        this.listenerSrv.setOnGoingMatchListeners();
        this.setPanicMode();
        this.modifyChatAccessibility();
    }

    notifyChatBlocked(): void {
        const snackBarRef = this.snackBar.open(
            this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.chatBlocked : FEEDBACK_MESSAGES_EN.chatBlocked,
        );
        // eslint-disable-next-line no-underscore-dangle
        snackBarRef._dismissAfter(DURATIONS.notifyChatAccessibility);
    }

    notifyChatUnblocked(): void {
        const snackBarRef = this.snackBar.open(
            this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.chatUnblocked : FEEDBACK_MESSAGES_EN.chatUnblocked,
        );
        // eslint-disable-next-line no-underscore-dangle
        snackBarRef._dismissAfter(DURATIONS.notifyChatAccessibility);
    }

    ngOnDestroy(): void {
        window.onbeforeunload = () => {
            return;
        };
        window.onpopstate = () => {
            return;
        };

        try {
            this.matchSrv.socketService.removeListener(SocketsOnEvents.FinalAnswerSet);
            this.matchSrv.socketService.removeListener(SocketsOnEvents.AllPlayersResponded);
            this.matchSrv.socketService.removeListener(SocketsOnEvents.PlayerDisabled);
            this.matchSrv.socketService.removeListener(SocketsOnEvents.HistogramTime);
        } catch (error) {
            this.dialog.open(AlertDialogComponent, {
                data: {
                    title: "GENERAL.ERROR",
                    messages: JSON.stringify(error)
                }
            })
        }
        this.matchSrv.timeService.stopServerTimer(this.matchSrv.match.accessCode, true);
    }

    onEnterKey(): void {
        this.sendEvent.emit();
    }

    getScore(): number {
        if (this.matchSrv.isObserver()) {
            return this.matchSrv.match.getScoreOfPlayerByName(this.matchSrv.getObservedName()) ?? 0;
        }
        return this.matchSrv.player.score;
    }

    redirectToHome(): void {
        this.confirmationService.dialogRef?.close();
        this.matchSrv.router.navigateByUrl('/home');
    }

    onTimerFinish(): void {
        this.matchSrv.showResults();
    }

    handleQuitMatchActionsWithoutConfirmation(): void {
        this.matchSrv.quitMatch();
        this.listenerSrv.evaluationSrv.cleanServiceAttributes();
    }

    handleQuitMatchActions(): void {
        if (this.matchSrv.isObserver()) {
            this.matchSrv.socketService.send<ObserverQuitRequest>(SocketsSendEvents.RemoveObserver, { observerName: this.accountService.account.pseudonym, accessCode: this.matchSrv.match.accessCode })
            return;
        }
        let dialogMessage;
        if (this.translateService.currentLang === 'fr') {
            dialogMessage = DIALOG_MESSAGE_FR.quitMatch;
        } else {
            dialogMessage = DIALOG_MESSAGE_EN.quitMatch;
        }

        this.confirmationService.askConfirmation(this.handleQuitMatchActionsWithoutConfirmation.bind(this), dialogMessage);
    }

    restartAudio(): void {
        const audioElement = this.audioZone.nativeElement;
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play();
        }
    }

    modifyChatAccessibility(): void {
        this.matchSrv.socketService.on<ChatAccessibilityRequest>(SocketsOnEvents.ChatAccessibilityChanged, (data) => {
            this.matchSrv.match.players = data.players;
            if (this.accountService.account.pseudonym === data.name) {
                const playerUpdated = this.matchSrv.match.players.find((player) => player.name === data.name);
                if (playerUpdated) this.matchSrv.player = playerUpdated;
                if (this.matchSrv.player.chatBlocked) this.notifyChatBlocked();
                else this.notifyChatUnblocked();
            }
        });
    }

    private setPanicMode(): void {
        this.matchSrv.socketService.on<void>(SocketsOnEvents.PanicModeActivated, () => {
            this.isPanicMode = true;
        });
    }

    private connect(): void {
        this.matchSrv.socketService.connect();
        this.listenerSrv.chatSrv.setupListeners();
    }


    onPlayerSelect(playerName: string): void {
        const pseudonym = this.accountService.account.pseudonym;
        this.matchSrv.updateObserver(pseudonym, playerName);
        this.matchSrv.player.name = playerName;
        if (playerName !== this.matchSrv.match.managerName) {
            this.matchSrv.router.navigateByUrl(`/play/match/${this.matchSrv.match.game.id}`)
        } else {
            this.matchSrv.router.navigateByUrl(`/play/manager/match/${this.matchSrv.match.game.id}`);
        }
    }
}
