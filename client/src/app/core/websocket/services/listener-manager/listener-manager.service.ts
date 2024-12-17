import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { NewPlayerDto } from '@app/core/classes/match/dto/new-player.dto';
import { UpdateScoreDto } from '@app/core/classes/match/dto/update-score.dto';
import { Team } from '@app/core/classes/match/team';
import { ERRORS, FEEDBACK_MESSAGES_EN, FEEDBACK_MESSAGES_FR, NAMES, QUESTION_TYPE, SocketsOnEvents } from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { Player } from '@app/core/interfaces/player';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { QuestionChartData } from '@app/core/interfaces/questions-chart-data';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/core/services/question-evaluation/question-evaluation.service';
import { ChatService } from '@app/core/websocket/services/chat-service/chat.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

/**
 * This class allows to start and configure web socket event listeners in a centralized place.
 */
@Injectable({
    providedIn: 'root',
})
export class ListenerManagerService {
    playerLeftEmitter: Subject<void> = new Subject<void>();
    // eslint-disable-next-line max-params
    constructor(
        public matchPlayerService: MatchPlayerService,
        public chatSrv: ChatService,
        public histogramSrv: HistogramService,
        public evaluationSrv: QuestionEvaluationService,
        private accountService: AccountService,
        private translateService: TranslateService,
    ) {}

    setupQuestionResultListeners(): void {
        this.setUpNextQuestionListener();
        this.updatePlayerOnDisabledEvent();
    }

    setOnGoingMatchListeners(): void {
        this.setFinalAnswerOnEvent();
        this.showResultsOnAllPlayersResponded();
        this.updatePlayerOnDisabledEvent();
        this.updateSelectedChoices();
        this.updatePlayerScoreOnQrlEvaluation();
    }

    setMatchManagerSideListeners(): void {
        this.updatePlayerScoreOnEvent();
        this.updatePlayerOnDisabledEvent();
        this.setFinalAnswerOnEvent();
        this.updateSelectedChoices();
        this.updatePlayerScoreOnQrlEvaluation();
    }

    setWaitingRoomListeners(): void {
        this.chatSrv.setupListeners();
        this.updatePlayersListOnPlayerRemoved();
        if (this.matchPlayerService.match.isTeamMatch) {
            this.onTeamCreated();
            this.onTeamJoined();
            this.onTeamQuit();
        }
    }

    setManagerWaitingRoomListeners(): void {
        this.updatePlayersListOnNewPlayers();
        this.chatSrv.setupListeners();
        this.updatePlayersListOnPlayerRemoved();
        if (this.matchPlayerService.match.isTeamMatch) {
            this.onTeamCreated();
            this.onTeamJoined();
            this.onTeamQuit();
        }
    }

    setUpNextQuestionListener(): void {
        this.matchPlayerService.socketService.on(SocketsOnEvents.NextQuestion, (currentQuestionIndex: any) => {
            console.log('nexquestion')
            this.matchPlayerService.nextQuestionEventEmitter.next();
            this.matchPlayerService.match.currentQuestionIndex = currentQuestionIndex.currentQuestionIndex
        });
    }

    private setFinalAnswerOnEvent(): void {
        this.matchPlayerService.socketService.on<PlayerAnswers>(SocketsOnEvents.FinalAnswerSet, (updatedPlayerAnswers) => {
            const playerAnswerIndex = this.matchPlayerService.match.playerAnswers.findIndex(
                (playerAnswers) => playerAnswers.name === updatedPlayerAnswers.name && playerAnswers.questionId === updatedPlayerAnswers.questionId,
            );
            if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qcm)
                this.histogramSrv.playersWithFinalAnswers?.push(updatedPlayerAnswers.name);
            if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl && updatedPlayerAnswers.final)
                this.histogramSrv.playersWithFinalAnswers?.push(updatedPlayerAnswers.name);
            if (playerAnswerIndex !== ERRORS.noIndexFound) {
                this.matchPlayerService.match.playerAnswers[playerAnswerIndex].lastAnswerTime = updatedPlayerAnswers.lastAnswerTime;
                this.matchPlayerService.match.playerAnswers[playerAnswerIndex].final = updatedPlayerAnswers.final;
                if (
                    this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl &&
                    this.accountService.account.pseudonym === this.matchPlayerService.match.managerName
                ) {
                    this.matchPlayerService.match.playerAnswers[playerAnswerIndex].qrlAnswer = updatedPlayerAnswers.qrlAnswer;
                    this.evaluationSrv.setPlayerAnswer();
                }
            } else {
                this.matchPlayerService.match.playerAnswers.push(updatedPlayerAnswers);
                if (
                    this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl &&
                    this.accountService.account.pseudonym === this.matchPlayerService.match.managerName
                ) {
                    this.evaluationSrv.setPlayerAnswer();
                }
            }
        });
    }

    private updatePlayerScoreOnEvent(): void {
        this.matchPlayerService.socketService.on<UpdateScoreDto>(SocketsOnEvents.UpdatedScore, (updateScoreDto) => {
            console.log(updateScoreDto.player.name, updateScoreDto.player.score)


            this.matchPlayerService.match.teams = updateScoreDto.teams;
            const playerIndex = this.matchPlayerService.match.players.findIndex((player) => player.name === updateScoreDto.player.name);
            if (playerIndex !== ERRORS.noIndexFound) {
                if (this.matchPlayerService.isObserver()) {
                    this.matchPlayerService.updatePlayerScore(updateScoreDto.player)
                }
                console.log(updateScoreDto.player.name, updateScoreDto.player.score)
                this.matchPlayerService.match.players[playerIndex] = updateScoreDto.player;


                if (this.matchPlayerService.getCurrentQuestion.type === QUESTION_TYPE.qcm || this.matchPlayerService.getCurrentQuestion.type === QUESTION_TYPE.qre) {
                    this.matchPlayerService.dataSource.data[playerIndex] = updateScoreDto.player;
                    // eslint-disable-next-line no-underscore-dangle
                    this.matchPlayerService.dataSource._updateChangeSubscription();
                }
            }
            this.matchPlayerService.dataSourceTeam = new MatTableDataSource(this.matchPlayerService.match.teams);
            // eslint-disable-next-line no-underscore-dangle
            this.matchPlayerService.dataSourceTeam._updateChangeSubscription();


        });
    }

    private updatePlayerOnDisabledEvent(): void {
        this.matchPlayerService.socketService.on<Player>(SocketsOnEvents.PlayerDisabled, (player) => {
            const playerIndex: number = this.matchPlayerService.match.players.findIndex((p) => p.name === player.name);
            this.matchPlayerService.match.players[playerIndex].isActive = player.isActive;
            if (this.accountService.account.pseudonym === player.name) {
                this.matchPlayerService.cleanMatchListeners();
            }
            if (this.accountService.account.pseudonym === this.matchPlayerService.match.managerName) {
                const playerToDisable: Player = this.matchPlayerService.match.players[playerIndex];
                this.matchPlayerService.dataSource.data[playerIndex].isActive = playerToDisable.isActive;
                this.sendSystemMessage(player.name);

                // eslint-disable-next-line no-underscore-dangle
                this.matchPlayerService.dataSource._updateChangeSubscription();

                this.evaluationSrv.playersNames = this.evaluationSrv.playersNames.filter((name) => name !== playerToDisable.name);
                this.evaluationSrv.handleLastPlayerEvaluation();
            }
            // Put the player name in black
            this.histogramSrv.quittedPlayers.push(player.name);
            this.playerLeftEmitter.next();
        });
    }

    private sendSystemMessage(name: string): void {
        this.chatSrv.send({
            playerName: NAMES.system,
            matchAccessCode: this.matchPlayerService.match.accessCode,
            time: this.matchPlayerService.timeService.getCurrentTime(),
            data: `${name} ${this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.playerLeftMatch : FEEDBACK_MESSAGES_EN.playerLeftMatch}`,
        });
    }

    showResultsOnAllPlayersResponded(): void {
        this.matchPlayerService.socketService.on<PlayerAnswers>(SocketsOnEvents.AllPlayersResponded, () => {
            this.matchPlayerService.showResults();
        });
    }

    private updatePlayersListOnNewPlayers(): void {
        this.matchPlayerService.socketService.on<NewPlayerDto>(SocketsOnEvents.NewPlayer, (newPlayerDto) => {
            this.matchPlayerService.match.players = newPlayerDto.players;
        });
    }

    private updatePlayersListOnPlayerRemoved(): void {
        this.matchPlayerService.socketService.on<NewPlayerDto>(SocketsOnEvents.PlayerRemoved, (newPlayerDto) => {
            this.matchPlayerService.match.players = newPlayerDto.players;
            if (newPlayerDto.isTeamMatch) this.matchPlayerService.match.teams = newPlayerDto.teams;
            if (this.accountService.account.pseudonym !== this.matchPlayerService.match.managerName) {
                const isStillPlayer = this.matchPlayerService.match.players.find(
                    (player: Player) => player.name === this.accountService.account.pseudonym,
                );
                if (!isStillPlayer) {
                    this.matchPlayerService.cleanCurrentMatch();
                    this.matchPlayerService.router.navigateByUrl('/home');
                }
            }
        });
    }

    private updateSelectedChoices(): void {
        if (this.matchPlayerService.getCurrentQuestionIndex === 0) {
            this.histogramSrv.questionsChartData = [];
            this.matchPlayerService.socketService.on<QuestionChartData>(SocketsOnEvents.UpdateChartDataList, (answer: QuestionChartData) => {
                this.histogramSrv.questionsChartData.push({
                    labelList: answer.labelList,
                    chartData: answer.chartData,
                    chartColor: answer.chartColor,
                    xLineText: answer.xLineText,
                });
            });
        }
    }

    private updatePlayerScoreOnQrlEvaluation(): void {
        this.matchPlayerService.socketService.on(SocketsOnEvents.QrlEvaluationFinished, () => {
            if (this.matchPlayerService.currentQuestion.type === QUESTION_TYPE.qrl) {
                this.matchPlayerService.match.players.forEach((player) => {
                    const servicePlayer: Player = this.matchPlayerService.player;
                    if (this.accountService.account.pseudonym === this.matchPlayerService.match.managerName || this.matchPlayerService.isObservingManager()) {
                        this.handleManagerUpdatesAfterQrlEvaluation(player);
                        this.evaluationSrv.isEvaluatingQrlQuestions = false;
                        if (this.histogramSrv.chart) {
                            this.histogramSrv.chart.destroy();
                        }
                        this.histogramSrv.createChart();
                    }
                    if (servicePlayer.name === player.name) {
                        this.handlePlayerUpdatesAfterQrlEvaluation(player);
                    }
                });
            }
        });
    }

    private handleManagerUpdatesAfterQrlEvaluation(player: Player): void {
        const dataPlayerIndex: number = this.matchPlayerService.dataSource.data.findIndex((dataPlayer) => player.name === dataPlayer.name);
        this.matchPlayerService.dataSource.data[dataPlayerIndex] = player;
        // eslint-disable-next-line no-underscore-dangle
        this.matchPlayerService.dataSource._updateChangeSubscription();

    }

    private handlePlayerUpdatesAfterQrlEvaluation(player: Player): void {
        this.matchPlayerService.player.score = player.score;
        this.setFeedBackMessages();
    }

    private setFeedBackMessages(): void {
        const currentQuestionPoints = this.matchPlayerService.currentQuestion.points;

        if (this.matchPlayerService.questionScore === currentQuestionPoints / 2) {
            this.matchPlayerService.feedBackMessages[0] =
                this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.halfPoints : FEEDBACK_MESSAGES_EN.halfPoints;
            this.matchPlayerService.feedBackMessages[1] = `${this.matchPlayerService.questionScore} ${this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.pointsAddedToScore : FEEDBACK_MESSAGES_EN.pointsAddedToScore
                }`;
        } else if (this.matchPlayerService.questionScore === currentQuestionPoints) {
            this.matchPlayerService.feedBackMessages[0] =
                this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.rightAnswer : FEEDBACK_MESSAGES_EN.rightAnswer;
            this.matchPlayerService.feedBackMessages[1] = `${this.matchPlayerService.questionScore} ${this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.pointsAddedToScore : FEEDBACK_MESSAGES_EN.pointsAddedToScore
                }`;
        } else {
            this.matchPlayerService.feedBackMessages[0] =
                this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.wrongAnswer : FEEDBACK_MESSAGES_EN.wrongAnswer;
            this.matchPlayerService.feedBackMessages[1] =
                this.translateService.currentLang === 'fr' ? FEEDBACK_MESSAGES_FR.sameScore : FEEDBACK_MESSAGES_EN.sameScore;
        }
    }

    onTeamCreated(): void {
        this.matchPlayerService.socketService.on<Team[]>(SocketsOnEvents.TeamCreated, (teams) => {
            this.updateTeamsUI(teams);
        });
    }

    onTeamJoined(): void {
        this.matchPlayerService.socketService.on<Team[]>(SocketsOnEvents.TeamJoined, (teams) => {
            this.updateTeamsUI(teams);
        });
    }

    onTeamQuit(): void {
        this.matchPlayerService.socketService.on<Team[]>(SocketsOnEvents.TeamQuit, (teams) => {
            this.updateTeamsUI(teams);
        });
    }

    updateTeamsUI(teams: Team[]): void {
        this.matchPlayerService.match.teams = teams;
    }
}
