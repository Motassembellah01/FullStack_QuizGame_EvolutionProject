import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ObserverQuitRequest } from '@app/core/classes/match/dto/observer-quit-request';
import {
    DIALOG_MESSAGE_EN,
    DIALOG_MESSAGE_FR,
    DURATIONS,
    FACTORS,
    FEEDBACK_MESSAGES_EN,
    FEEDBACK_MESSAGES_FR,
    NAMES,
    QUESTION_TYPE,
    SocketsOnEvents,
    SocketsSendEvents,
    TRANSITIONS_DURATIONS,
    TRANSITIONS_MESSAGES_EN,
    TRANSITIONS_MESSAGES_FR,
} from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { DialogTransitionService } from '@app/core/services/dialog-transition-service/dialog-transition.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { ListenerManagerService } from '@app/core/websocket/services/listener-manager/listener-manager.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatComponent } from '@app/shared/components/chat/chat.component';
import { QuestionAnswerComponent } from '@app/shared/components/question-answer/question-answer.component';
import { TransitionDialogComponent } from '@app/shared/components/transition-dialog/transition-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-question-result',
    templateUrl: './question-result.component.html',
    styleUrls: ['./question-result.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, QuestionAnswerComponent, ChatComponent, CommonModule, TranslateModule],
})

/**
 * Manages the result view while playing a game. It includes the right and wrong answers,
 * the result of the player and the points that will be added to the player's score
 */
export class QuestionResultComponent implements OnInit, OnDestroy {
    transitionText: string;
    isTestingMatch: boolean;
    matchFinishedSubscription: Subscription;
    counter: number = 0;
    timer: number = 3;
    dialogRef: MatDialogRef<TransitionDialogComponent>;
    nextQuestionSubscription: Subscription;
    isWinnerPlayerName: boolean = false;
    private backToMatchInterval: number | undefined;
    selectedPlayer: string = '';

    // eslint-disable-next-line max-params
    constructor(
        public matchSrv: MatchPlayerService,
        private snackBar: MatSnackBar,
        private listenerService: ListenerManagerService,
        private confirmationService: CancelConfirmationService,
        private dialogTransitionService: DialogTransitionService,
        public accountService: AccountService,
        private translateService: TranslateService,
    ) {}

    ngOnInit(): void {
        if (this.matchSrv.showBonusMessage) this.showBonusMessage();

        if (this.translateService.currentLang === 'fr') {
            this.transitionText = this.matchSrv.isCurrentQuestionTheLastOne()
                ? TRANSITIONS_MESSAGES_FR.matchEndTestView
                : TRANSITIONS_MESSAGES_FR.nextQuestionTestView;
        } else {
            this.transitionText = this.matchSrv.isCurrentQuestionTheLastOne()
                ? TRANSITIONS_MESSAGES_EN.matchEndTestView
                : TRANSITIONS_MESSAGES_EN.nextQuestionTestView;
        }

        if (this.matchSrv.match.testing) this.backToMatchInTesting();
        else this.setupListeners();

        this.showResultMessage();
        window.history.replaceState({}, '', '');
        this.nextQuestionSubscription = this.matchSrv.nextQuestionEventEmitter.subscribe(this.nextQuestion.bind(this));
        this.matchFinishedSubscription = this.matchSrv.matchFinishedEventEmitter.subscribe(this.onMatchFinished.bind(this));
        window.onbeforeunload = () => {
            this.quitMatchWithoutConfirmation();
        };
        window.onpopstate = () => {
            this.quitMatchWithoutConfirmation();
        };

        this.initializeFeedBackMessages();

        if (this.matchSrv.currentQuestion.type === QUESTION_TYPE.qrl) this.matchSrv.hasQuestionEvaluationBegun = true;
    }

    ngOnDestroy(): void {
        window.onbeforeunload = () => {
            return;
        };
        window.onpopstate = () => {
            return;
        };

        this.nextQuestionSubscription?.unsubscribe();

    }

    onMatchFinished(): void {
        this.confirmationService.dialogRef?.close();
        this.matchSrv.timeService.stopTimer();
        this.dialogTransitionService.closeTransitionDialog();
        this.nextQuestionSubscription.unsubscribe();
        this.matchSrv.router.navigateByUrl('/home');
    }

    quitMatchWithoutConfirmation(): void {
        clearInterval(this.backToMatchInterval);
        this.backToMatchInterval = undefined;

        this.listenerService.evaluationSrv.cleanServiceAttributes();
        this.matchSrv.quitMatch();
    }
    quitMatch(): void {
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

        this.confirmationService.askConfirmation(this.quitMatchWithoutConfirmation.bind(this), dialogMessage);
    }

    backToMatchInTesting(): void {
        this.backToMatchInterval = window.setInterval(() => {
            if (this.timer > 0) {
                this.timer--;
            } else {
                clearInterval(this.backToMatchInterval);
                this.backToMatchInterval = undefined;
                this.backToMatch();
            }
        }, DURATIONS.backToMatch);
    }

    showResultMessage(): void {
        if (this.matchSrv.match.testing && this.matchSrv.evaluateCurrentQuestion()) {
            this.matchSrv.questionScore = this.matchSrv.currentQuestion.points * FACTORS.firstChoice;
            this.showBonusMessage();
            this.matchSrv.feedBackMessages[0] =
                this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.rightAnswer : FEEDBACK_MESSAGES_EN.rightAnswer;

            this.matchSrv.feedBackMessages[1] = `${this.matchSrv.questionScore} ${this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.pointsAddedToScore : FEEDBACK_MESSAGES_EN.pointsAddedToScore
                }`;
        }
    }

    showBonusMessage(): void {
        if (this.matchSrv.currentQuestion.type === QUESTION_TYPE.qrl) return;
        const snackBarRef = this.snackBar.open(this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.bonus : FEEDBACK_MESSAGES_EN.bonus);

        // eslint-disable-next-line no-underscore-dangle
        snackBarRef._dismissAfter(DURATIONS.bonusMessage);
    }

    setupListeners(): void {
        if (!this.matchSrv.questionResultConnected) {
            this.matchSrv.questionResultConnected = true;
            this.listenerService.setupQuestionResultListeners();
            this.onMoneyUpdate();
        }
    }

    nextQuestion(): void {
        let transitionText;

        if (this.translateService.currentLang === 'fr') {
            transitionText = this.matchSrv.isCurrentQuestionTheLastOne()
                ? TRANSITIONS_MESSAGES_FR.transitionToResultsView
                : TRANSITIONS_MESSAGES_FR.transitionToNextQuestion;
        } else {
            transitionText = this.matchSrv.isCurrentQuestionTheLastOne()
                ? TRANSITIONS_MESSAGES_EN.transitionToResultsView
                : TRANSITIONS_MESSAGES_EN.transitionToNextQuestion;
        }
        this.dialogTransitionService.openTransitionDialog(transitionText, TRANSITIONS_DURATIONS.betweenQuestions);
        this.matchSrv.timeService.startTimer(TRANSITIONS_DURATIONS.betweenQuestions, this.matchSrv.match.accessCode, this.onTimerFinished.bind(this));
    }

    onTimerFinished(): void {
        this.dialogTransitionService.closeTransitionDialog();
        this.nextQuestionSubscription.unsubscribe();
        this.backToMatch();
    }

    backToMatch(): void {
        this.matchSrv.feedBackMessages = [
            this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.wrongAnswer : FEEDBACK_MESSAGES_EN.wrongAnswer,
            this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.sameScore : FEEDBACK_MESSAGES_EN.sameScore,
        ];

        if (this.matchSrv.isCurrentQuestionTheLastOne()) {
            if (this.matchSrv.match.testing) {
                this.matchSrv.cleanCurrentMatch();
                this.matchSrv.router.navigateByUrl('/create');
            } else {
                if (this.matchSrv.match.game) {
                    this.matchSrv.router.navigateByUrl(`/play/result/${this.matchSrv.match.game.id}`);
                }
            }
        } else {
            this.matchSrv.sendNextQuestion();
            if (this.matchSrv.match.game) this.matchSrv.router.navigateByUrl(`/play/match/${this.matchSrv.match.game.id}`);
        }
    }

    initializeFeedBackMessages(): void {
        if (this.matchSrv.currentQuestion.type === QUESTION_TYPE.qrl) {
            if (this.accountService.account.pseudonym === NAMES.tester) {
                this.matchSrv.feedBackMessages = [
                    this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.rightAnswer : FEEDBACK_MESSAGES_EN.rightAnswer,
                    `${this.matchSrv.currentQuestion.points} ${this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.pointsAddedToScore : FEEDBACK_MESSAGES_EN.pointsAddedToScore}`,
                ];
            } else {
                this.matchSrv.feedBackMessages[0] =
                    this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.waiting : FEEDBACK_MESSAGES_EN.waiting;
                this.matchSrv.feedBackMessages[1] =
                    this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.duringEvaluation : FEEDBACK_MESSAGES_EN.duringEvaluation;
            }
        }
    }

    onPlayerSelect(playerName: string): void {
        const pseudonym = this.accountService.account.pseudonym;
        this.matchSrv.updateObserver(pseudonym, playerName);
        this.matchSrv.player.name = playerName;
        if (playerName !== this.matchSrv.match.managerName) {
            this.matchSrv.router.navigateByUrl(`/play/question-result/${this.matchSrv.match.game.id}`);
        } else {
            this.matchSrv.router.navigateByUrl(`/play/manager/match/${this.matchSrv.match.game.id}`);
        }
    }
    onMoneyUpdate() {
        this.matchSrv.socketService.on<{ array: { userId: string; money: number }[], winnerPlayerName: string }>(SocketsOnEvents.UpdateMoney, (data: { array: { userId: string; money: number }[], winnerPlayerName: string }) => {
            const matchingAccount = data.array.find(account =>
                account.userId === this.accountService.account?.userId
            );
            if (matchingAccount) {
                this.accountService.money = matchingAccount.money;
            }
            this.accountService.isWinnerPlayerName = data.winnerPlayerName === this.accountService.account.pseudonym;
        })
    }
}
