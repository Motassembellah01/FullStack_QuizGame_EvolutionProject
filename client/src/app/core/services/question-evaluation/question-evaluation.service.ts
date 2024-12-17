import { Injectable } from '@angular/core';
import { FACTORS, SocketsSendEvents } from '@app/core/constants/constants';
import { Player } from '@app/core/interfaces/player';
import { QuestionRequest } from '@app/core/interfaces/question-request';
import { Room } from '@app/core/interfaces/room';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
/**
 * Service that contains the methods and attributs required to complete the qrl evaluation process
 */
@Injectable({
    providedIn: 'root',
})
export class QuestionEvaluationService {
    currentPlayer: Player = {} as Player;
    playersNames: string[] = [];
    currentPlayerAnswer: string = '';
    currentNoteFactor: number;
    nPlayersEvaluated: number = 0;
    currentQuestionPoints: number = 0;
    isEvaluatingQrlQuestions: boolean = false;

    constructor(
        public matchPlayerService: MatchPlayerService,
        public histogramService: HistogramService,
    ) {}

    clearAttributes(): void {
        this.currentPlayer = {} as Player;
        this.playersNames = [];
        this.currentPlayerAnswer = '';
        this.currentNoteFactor = 0;
        this.nPlayersEvaluated = 0;
        this.currentQuestionPoints = 0;
        this.isEvaluatingQrlQuestions = false;
    }
    

    setPlayersNamesList(): void {
        const playersList: Player[] = this.matchPlayerService.match.players.filter((player) => player.isActive);
        this.playersNames = playersList.map((player) => player.name).sort(() => Math.random() - 0.5);
        this.setPlayerByIndex(0);
    }

    setCurrentNoteFactor(note: number): void {
        this.currentNoteFactor = note / FACTORS.percentage;
    }

    setQuestionPoints(): void {
        this.currentQuestionPoints = this.matchPlayerService.currentQuestion.points;
        this.histogramService.questionsStats.set(this.matchPlayerService.currentQuestion.id, []);
    }

    updateScoreAfterQrlQuestion(): void {
        this.currentPlayer.score += this.currentNoteFactor * this.currentQuestionPoints;
        this.histogramService.questionsStats.get(this.matchPlayerService.currentQuestion.id)?.push(this.currentNoteFactor);
        this.sendUpdateScoreEvent();
        this.setNextPlayer();
    }

    sendUpdateScoreEvent(): void {
        this.matchPlayerService.socketService.send<QuestionRequest>(SocketsSendEvents.UpdateScore, {
            matchAccessCode: this.matchPlayerService.match.accessCode,
            player: this.currentPlayer,
            questionId: this.matchPlayerService.currentQuestion.id,
            hasQrlEvaluationBegun: this.matchPlayerService.hasQuestionEvaluationBegun,
        });
    }

    setNextPlayer(): void {
        this.nPlayersEvaluated++;
        this.setPlayerByIndex(this.nPlayersEvaluated);
        this.setPlayerAnswer();
        this.handleLastPlayerEvaluation();
    }

    handleLastPlayerEvaluation(): void {
        if (this.isLastPlayer()) {
            this.cleanServiceAttributes();
            this.matchPlayerService.socketService.send<Room>(SocketsSendEvents.FinishQrlEvaluation, {
                id: this.matchPlayerService.match.accessCode,
            });
        }
    }

    setPlayerByIndex(index: number): void {
        if (index < 0 || index >= this.playersNames.length) return;
        const playerName = this.playersNames[index];
        const foundPlayer = this.matchPlayerService.match.players.find((player) => player.name === playerName && player.isActive);
        if (foundPlayer) this.currentPlayer = { ...foundPlayer };
    }

    setPlayerAnswer(): void {
        const answer = this.matchPlayerService.match.playerAnswers.find(
            (playerAnswer) => playerAnswer.name === this.currentPlayer.name && this.matchPlayerService.currentQuestion.id === playerAnswer.questionId,
        );
        if (!answer || !answer.qrlAnswer || (answer.qrlAnswer && !answer.qrlAnswer.trim())) this.currentPlayerAnswer = undefined as unknown as string;
        else this.currentPlayerAnswer = answer.qrlAnswer;
    }

    hasPlayerResponded(): boolean {
        return this.currentPlayerAnswer !== undefined;
    }

    isLastPlayer(): boolean {
        return this.nPlayersEvaluated >= this.playersNames.length;
    }

    cleanServiceAttributes(): void {
        this.currentPlayer = {} as Player;
        this.playersNames = [];
        this.currentPlayerAnswer = '';
        this.currentNoteFactor = 0;
        this.nPlayersEvaluated = 0;
        this.currentQuestionPoints = 0;
        this.isEvaluatingQrlQuestions = false;
        this.histogramService.isShowingQuestionResults = true;
    }
}
