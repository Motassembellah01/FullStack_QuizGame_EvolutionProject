import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Match } from '@app/core/classes/match/match';
import { Team } from '@app/core/classes/match/team';
import { Question } from '@app/core/classes/question/question';
import {
    ERRORS,
    FACTORS,
    FEEDBACK_MESSAGES_EN,
    FEEDBACK_MESSAGES_FR,
    QRL_TIME,
    QUESTION_TYPE,
    SocketsOnEvents,
    SocketsSendEvents
} from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { MatchCommunicationService } from '@app/core/http/services/match-communication/match-communication.service';
import { Choice } from '@app/core/interfaces/choice';
import { Player } from '@app/core/interfaces/player';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { PlayerRequest } from '@app/core/interfaces/player-request';
import { QuestionRequest } from '@app/core/interfaces/question-request';
import { UpdateAnswerRequest } from '@app/core/interfaces/update-answer-request';
import { ChatService } from '@app/core/websocket/services/chat-service/chat.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})

/**
 * Service that contains the logic of a current match on the player's side:
 * starting and stopping timer, selecting and deselecting choices, evaluating
 * answers and updating score and showing the results.
 * If it's the last question, the player will be redirected to the creation
 * view (on a test match) after displaying the results.
 * Currently we only take into consideration the QCM questions type
 */
export class MatchPlayerService {
    dataSource: MatTableDataSource<Player>;
    dataSourceTeam: MatTableDataSource<Team>;
    player: Player;
    showingResults: boolean = false;
    hasJoinMatch: boolean = false;
    questionResultConnected: boolean = false;
    isTyping: boolean = false;
    nextQuestionEventEmitter: Subject<void> = new Subject<void>();
    matchFinishedEventEmitter: Subject<void> = new Subject<void>();
    match: Match = new Match();
    feedBackMessages: string[] = [
        this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.wrongAnswer : FEEDBACK_MESSAGES_EN.wrongAnswer,
        this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.sameScore : FEEDBACK_MESSAGES_EN.sameScore,
    ];
    currentQuestion: Question = new Question();
    questionScore: number = 0;
    isTypingQrl: boolean = false;
    qrlAnswer: string = '';
    qreAnswer: number = 0;
    hasQuestionEvaluationBegun: boolean = false;
    showBonusMessage: boolean = false;
    private currentQuestionIndex: number = 0;

    // eslint-disable-next-line max-params
    constructor(
        public router: Router,
        public timeService: TimeService,
        public socketService: SocketService,
        public chatService: ChatService,
        private readonly communicationSrv: MatchCommunicationService,
        private accountService: AccountService,
        private translateService: TranslateService,
    ) {}

    get getCurrentQuestion(): Question {
        return this.currentQuestion;
    }

    get getCurrentQuestionIndex(): number {
        return this.currentQuestionIndex;
    }

    getMaxTime(): number {
        if (this.currentQuestion.type === QUESTION_TYPE.qrl) return QRL_TIME;
        else return this.match.game.duration;
    }

    initializePlayersList(): void {
        this.dataSource = new MatTableDataSource(this.match.players);
    }

    initializeQuestion(): void {
        this.currentQuestion = this.match.game.questions[this.currentQuestionIndex];
        //this.match.setTimerValue();
    }

    initializeObserverQuestion(): void {
        this.currentQuestionIndex = this.match.currentQuestionIndex
        this.initializeQuestion();
    }

    setCurrentMatch(match: Match, player: Player): void {
        this.match = match;
        this.player = player;
    }

    updateCurrentAnswer(choice: Choice = {} as Choice): void {
        console.log(choice)
        let answersIndex = this.getCurrentAnswersIndex();
        console.log(answersIndex)

        if (answersIndex !== ERRORS.noIndexFound) {
            if (this.isChoiceSelected(choice)) {
                this.match.playerAnswers[answersIndex].qcmAnswers.splice(this.match.getAnswerIndex(this.player, this.currentQuestion.id, choice), 1);
            } else {
                this.match.playerAnswers[answersIndex].qcmAnswers.push(choice);
            }
        } else {
            this.match.playerAnswers.push({
                name: this.accountService.account.pseudonym,
                lastAnswerTime: '',
                final: false,
                questionId: this.currentQuestion.id,
                obtainedPoints: 0,
                qcmAnswers: [choice],
                qrlAnswer: '',
                qreAnswer: this.qreAnswer,
                isTypingQrl: false,
            });
        }
        answersIndex = this.getCurrentAnswersIndex();
        if (!this.match.testing && answersIndex !== ERRORS.noIndexFound) {
            this.socketService.send<UpdateAnswerRequest>(SocketsSendEvents.UpdateAnswer, {
                matchAccessCode: this.match.accessCode,
                playerAnswers: this.match.playerAnswers[answersIndex],
            });
        }
    }

    updateTypingState(isFirstAttempt: boolean = false): void {
        const answersIndex = this.getCurrentAnswersIndex();
        if (answersIndex !== ERRORS.noIndexFound) {
            this.match.playerAnswers[answersIndex].isTypingQrl = this.isTypingQrl;
            this.match.playerAnswers[answersIndex].qrlAnswer = this.qrlAnswer;
            this.match.playerAnswers[answersIndex].qreAnswer = this.qreAnswer;
        } else {
            this.match.playerAnswers.push({
                name: this.accountService.account.pseudonym,
                lastAnswerTime: '',
                final: false,
                questionId: this.currentQuestion.id,
                obtainedPoints: 0,
                qcmAnswers: [],
                qrlAnswer: this.qrlAnswer,
                qreAnswer: this.qreAnswer,
                isTypingQrl: this.isTypingQrl,
            });
        }
        this.sendUpdateAnswerEvent(isFirstAttempt);
    }

    sendUpdateAnswerEvent(isFirstAttempt: boolean = false): void {
        const answersIndex = this.getCurrentAnswersIndex();
        if (answersIndex !== ERRORS.noIndexFound) {
            this.match.playerAnswers[answersIndex].qrlAnswer = this.qrlAnswer;
            this.match.playerAnswers[answersIndex].qreAnswer = this.qreAnswer;
            this.match.playerAnswers[answersIndex].isFirstAttempt = isFirstAttempt;
            this.socketService.send<UpdateAnswerRequest>(SocketsSendEvents.UpdateAnswer, {
                matchAccessCode: this.match.accessCode,
                playerAnswers: this.match.playerAnswers[answersIndex],
            });
        }
    }

    getCurrentAnswersIndex(): number {
        return this.match.getPlayerAnswersIndex(this.player, this.currentQuestion.id);
    }

    isChoiceSelected(choice: Choice): boolean {
        return this.match.didPlayerAnswer(this.player, choice, this.currentQuestion.id);
    }

    getQrlAnswer() {
        return this.match.getQrlAnswer(this.player, this.currentQuestion.id);
    }

    getQreAnswer() {
        return this.match.getQreAnswer(this.player, this.currentQuestion.id);
    }

    setCurrentAnswersAsFinal(final: boolean = true): void {
        this.match.setAnswersAsFinal(this.player, this.currentQuestion.id, final);
    }

    isFinalCurrentAnswer(): boolean {
        return this.match.isFinalAnswer(this.player, this.currentQuestion.id);
    }

    evaluateCurrentQuestion(): boolean {
        const answersIndex = this.getCurrentAnswersIndex();
        if (this.match.playerAnswers.length === 0 || answersIndex === ERRORS.noIndexFound) return false;
        if (this.match.playerAnswers[answersIndex] === undefined) return false;
        let gotRightAnswer = true;
        let correctChoicesCounter = 0;
        for (const choice of this.match.playerAnswers[answersIndex].qcmAnswers) {
            if (!choice.isCorrect) {
                gotRightAnswer = false;
                break;
            } else {
                correctChoicesCounter++;
            }
        }
        if (correctChoicesCounter !== this.currentQuestion.getRightChoicesNumber()) {
            gotRightAnswer = false;
        }
        return gotRightAnswer;
    }

    updateScore(): void {
        if (this.isObserver()) {
            this.router.navigateByUrl(`/play/question-result/${this.match.game.id}`);
            return;
        }
        if (this.match.testing) {
            this.player.score += this.currentQuestion.points * FACTORS.firstChoice;
        } else {
            this.player.score += this.currentQuestion.points;

            this.socketService.send<QuestionRequest>(SocketsSendEvents.UpdateScore, {
                matchAccessCode: this.match.accessCode,
                player: this.player,
                questionId: this.currentQuestion.id,
                hasQrlEvaluationBegun: this.hasQuestionEvaluationBegun,
            });
        }
    }

    initializeScore(): void {
        this.player.score = 0;
    }

    sendNextQuestion(): void {
        this.showingResults = false;
        this.currentQuestionIndex++;
    }

    showResults(): void {
        this.showingResults = true;
        this.timeService.stopTimer();
        if ((this.currentQuestion.type === QUESTION_TYPE.qcm && !this.evaluateCurrentQuestion()) || this.currentQuestion.type === QUESTION_TYPE.qrl) {
            this.showBonusMessage = false;
            this.router.navigateByUrl(`/play/question-result/${this.match.game.id}`);
        }

        if (this.currentQuestion.type === QUESTION_TYPE.qcm && this.evaluateCurrentQuestion()) {
            this.updateScore();
        } else if (!this.isObserver() && this.currentQuestion.type === QUESTION_TYPE.qre) {
            this.socketService.send<QuestionRequest>(SocketsSendEvents.UpdateScore, {
                matchAccessCode: this.match.accessCode,
                player: this.player,
                questionId: this.currentQuestion.id,
                hasQrlEvaluationBegun: this.hasQuestionEvaluationBegun,
            });
        }
    }

    cleanCurrentMatch(): void {
        this.accountService.isInGame = false;
        this.dataSource = new MatTableDataSource<Player>();
        this.dataSourceTeam = new MatTableDataSource<Team>();
        this.player = null as any;
        this.showingResults = false;
        this.hasJoinMatch = false;
        this.questionResultConnected = false;
        this.isTyping = false;
        this.nextQuestionEventEmitter = new Subject<void>();
        this.matchFinishedEventEmitter = new Subject<void>();
        this.match = new Match();
        this.feedBackMessages = [
            this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.wrongAnswer : FEEDBACK_MESSAGES_EN.wrongAnswer,
            this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.sameScore : FEEDBACK_MESSAGES_EN.sameScore,
        ];
        this.currentQuestion = new Question();
        this.questionScore = 0;
        this.isTypingQrl = false;
        this.qrlAnswer = '';
        this.qreAnswer = 0;
        this.hasQuestionEvaluationBegun = false;
        this.currentQuestionIndex = 0;
        this.showBonusMessage = false;

        this.chatService.isChatAccessible = true;
        this.timeService.joinMatchService.playerName = '';

        this.timeService.stopTimer();
        this.chatService.cleanMessages();
        this.cleanMatchListeners();
    }

    cleanMatchListeners() {
        const listeners: string[] = [
            SocketsOnEvents.NewPlayer,
            SocketsOnEvents.JoinBegunMatch,
            SocketsOnEvents.NewTime,
            SocketsOnEvents.NextQuestion,
            SocketsOnEvents.GameCanceled,
            SocketsOnEvents.AnswerUpdated,
            SocketsOnEvents.AllPlayersResponded,
            SocketsOnEvents.FinalAnswerSet,
            SocketsOnEvents.MatchFinished,
            SocketsOnEvents.UpdatedScore,
            SocketsOnEvents.UpdateChartDataList,
            SocketsOnEvents.TeamCreated,
            SocketsOnEvents.TeamJoined,
            SocketsOnEvents.TeamQuit,
            SocketsOnEvents.JoinedMatchObserver,
            SocketsOnEvents.ObserverRemoved
        ];

        listeners.forEach((event: string) => {
            this.socketService.removeListener(event);
        });
    }

    isCurrentQuestionTheLastOne(): boolean {
        return this.match.game.isLastQuestion(this.currentQuestion);
    }

    quitMatch(): void {
        if (this.match.testing) {
            this.timeService.stopServerTimer(this.match.accessCode);
            this.router.navigateByUrl('/create');
        } else {
            this.socketService.send<QuestionRequest>(SocketsSendEvents.PlayerLeftAfterMatchBegun, {
                matchAccessCode: this.match.accessCode,
                player: this.player,
                questionId: this.currentQuestion.id,
                hasQrlEvaluationBegun: this.hasQuestionEvaluationBegun,
            });
            this.router.navigateByUrl('/home');
        }
        this.timeService.joinMatchService.playerName = '';

        this.cleanCurrentMatch();
    }

    joinMatchRoom(accessCode: string): void {
        this.socketService.send<PlayerRequest>(SocketsSendEvents.JoinMatch, { roomId: accessCode, name: this.accountService.account.pseudonym });
    }

    validateAccessCode(accessCode: string): Observable<boolean> {
        return this.communicationSrv.isValidAccessCode(accessCode);
    }

    setAccessibility(): Observable<unknown> {
        return this.communicationSrv.setAccessibility(this.match.accessCode);
    }

    deleteMatchByAccessCode(accessCode: string): Observable<unknown> {
        return this.communicationSrv.deleteMatchByAccessCode(accessCode);
    }

    setupListenersPLayerView(): void {
        this.socketService.on<void>(SocketsOnEvents.MatchFinished, () => {
            this.quitMatch();
            this.matchFinishedEventEmitter.next();
        });
    }

    updatePlayerScore(updatedPlayer: Player): void {
        const previousScore = this.match.getScoreOfPlayerByName(updatedPlayer.name);
        console.log(previousScore)
        if (previousScore === null) return;
        else if (previousScore === 0) {
            this.questionScore = updatedPlayer.score;
        } else {
            this.questionScore = updatedPlayer.score - previousScore;
        }
        if (this.currentQuestion.type === QUESTION_TYPE.qcm || this.currentQuestion.type === QUESTION_TYPE.qre) {
            this.player.score = updatedPlayer.score;
            this.handleFeedBackMessages();
        }
    }

    handleFeedBackMessages(): void {
        const currentQuestionPoints = this.currentQuestion.points;

        // Player gets the bonus
        if (this.questionScore > currentQuestionPoints) {
            this.showBonusMessage = true;
        } else {
            this.showBonusMessage = false;
        }

        if (this.questionScore >= currentQuestionPoints) {
            this.feedBackMessages[0] =
                this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.rightAnswer : FEEDBACK_MESSAGES_EN.rightAnswer;
            this.feedBackMessages[1] = `${this.questionScore} ${this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.pointsAddedToScore : FEEDBACK_MESSAGES_EN.pointsAddedToScore}`;
        }

        if (this.getObservedName() === this.match.managerName || this.match.managerName === this.accountService.account.pseudonym) {
            return;
        }
        this.router.navigateByUrl(`/play/question-result/${this.match.game.id}`);
    }

    getPlayersNotInTeam(): Player[] {
        const playersInTeams = new Set(
            this.match.teams.reduce<string[]>((allPlayers, team) => allPlayers.concat(team.players), [])
        );

        return this.match.players.filter(player => !playersInTeams.has(player.name));
    }

    getTeamByPlayerName(playerName: string): Team | null {
        return this.match.teams.find(team => team.players.some(player => player === playerName)) || null;
    }

    getTeammate(playerName: string): Player | null {
        const team = this.getTeamByPlayerName(playerName);

        if (team) {
            const teammateName = team.players.find(player => player !== playerName);
            return this.match.players.find(player => player.name === teammateName) || null;
        }

        return null;
    }

    calculateTeamScore(team: Team | null): number {
        if (!team) return 0;
        const match = this.match;
        const players = team.players
            .map(playerName => {
                const index = match.findPlayerIndexByName(playerName);
                return index !== -1 ? match.players[index] : null;
            })
            .filter(player => player !== null);
        return players.reduce((totalBonus, player) => {
            return totalBonus + (player?.score || 0);
        }, 0);
    }


    isObserver(): boolean {
        return this.match.observers.some(
            observer => observer.name === this.accountService.account.pseudonym
        );
    }

    isObservingManager(): boolean {
        const { pseudonym } = this.accountService.account;

        const observer = this.match.observers.find(observer => observer.name === pseudonym);
        if (!observer) return false;

        return observer.observedName === this.match.managerName;
    }

    updateObserver(observerName: string, newObservedName: string): void {
        const observer = this.match.observers.find(
            (obs) => obs.name === observerName
        );
        if (observer) {
            observer.observedName = newObservedName;
        }
    }

    getObservedName(): string {
        const { pseudonym } = this.accountService.account;

        const observer = this.match.observers.find(observer => observer.name === pseudonym);
        if (!observer) {
            return '';
        }

        return observer.observedName;
    }

    setUpAnswerUpdatedListener() {
        this.socketService.on<PlayerAnswers[]>(SocketsOnEvents.AnswerUpdated, (answers: PlayerAnswers[]) => {
            this.match.playerAnswers = answers;
        });
    }


}
