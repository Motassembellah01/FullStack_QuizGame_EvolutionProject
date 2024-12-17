import { Game } from '@app/core/classes/game/game';
import { Question } from '@app/core/classes/question/question';
import { ERRORS } from '@app/core/constants/constants';
import { Choice } from '@app/core/interfaces/choice';
import { IMatch } from '@app/core/interfaces/i-match';
import { Player } from '@app/core/interfaces/player';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { Observer } from './observer';
import { Team } from './team';

/**
 * This class allows to handle the logic associated to a match and also
 * to manage his data
 */
export class Match implements IMatch {
    game: Game;
    begin: string = '';
    end: string = '';
    bestScore: number = 0;
    accessCode: string = '';
    testing: boolean = false;
    players: Player[] = [];
    observers: Observer[] = [];
    managerName: string = 'organisateur';
    managerId: string = '';
    isAccessible: boolean = true;
    isFriendMatch: boolean = false;
    bannedNames: string[] = ['organisateur'];
    playerAnswers: PlayerAnswers[] = [];
    panicMode: boolean = false;
    timer: number = 0;
    timing: boolean = true;
    isTeamMatch: boolean = false;
    isPricedMatch: boolean = false;
    priceMatch: number = 0;
    nbPlayersJoined: number = 0;
    teams: Team[]
    currentQuestionIndex: number;
    isEvaluatingQrl: boolean;

    constructor(match?: IMatch) {
        if (match) {
            this.game = Game.parseGame(match.game);
            this.begin = match.begin;
            this.end = match.begin;
            this.bestScore = match.bestScore;
            this.accessCode = match.accessCode;
            this.testing = match.testing;
            this.players = match.players;
            this.observers = match.observers;
            this.managerName = match.managerName;
            this.managerId = match.managerId;
            this.isAccessible = match.isAccessible;
            this.isFriendMatch = match.isFriendMatch;
            this.bannedNames = match.bannedNames;
            this.playerAnswers = match.playerAnswers;
            this.panicMode = match.panicMode;
            this.timer = match.timer;
            this.timing = match.timing;
            this.isTeamMatch = match.isTeamMatch;
            this.isPricedMatch = match.isPricedMatch;
            this.priceMatch = match.priceMatch;
            this.nbPlayersJoined = match.nbPlayersJoined;
            this.teams = match.teams;
            this.currentQuestionIndex = match.currentQuestionIndex;
            this.isEvaluatingQrl = match.isEvaluatingQrl;
        }
    }

    static parseMatch(match: IMatch): Match {
        const game = Game.parseGame(match.game);
        const parsedMatch = new Match(match);
        parsedMatch.game = game;
        return parsedMatch;
    }

    setTimerValue(): void {
        this.timer = this.game.duration;
    }

    getPlayerAnswersIndex(player: Player, questionId: string): number {
        return this.playerAnswers.findIndex((playerAnswer) => playerAnswer.name === player.name && playerAnswer.questionId === questionId);
    }

    didPlayerAnswer(player: Player, choice: Choice, questionId: string): boolean {
        const answersIndex = this.getPlayerAnswersIndex(player, questionId);

        if (answersIndex === ERRORS.noIndexFound) return false;

        const answerExists = this.playerAnswers[answersIndex].qcmAnswers.find((answer) => answer.text === choice.text);
        return answerExists !== undefined;
    }

    getQrlAnswer(player: Player, questionId: string): string {
        const answersIndex = this.getPlayerAnswersIndex(player, questionId);

        if (answersIndex === ERRORS.noIndexFound) return '';

        return this.playerAnswers[answersIndex].qrlAnswer;
    }

    getQreAnswer(player: Player, questionId: string): number {
        const answersIndex = this.getPlayerAnswersIndex(player, questionId);

        if (answersIndex === ERRORS.noIndexFound) return 0;

        return this.playerAnswers[answersIndex].qreAnswer;
    }

    getAnswerIndex(player: Player, questionId: string, choice: Choice): number {
        const playerAnswersIndex = this.getPlayerAnswersIndex(player, questionId);
        return this.playerAnswers[playerAnswersIndex].qcmAnswers.findIndex((currentChoice) => currentChoice.text === choice.text);
    }

    setAnswersAsFinal(player: Player, questionId: string, final: boolean = true): void {
        const answersIndex = this.getPlayerAnswersIndex(player, questionId);
        if (answersIndex !== ERRORS.noIndexFound) {
            this.playerAnswers[answersIndex].final = final;
        }
    }

    isFinalAnswer(player: Player, questionId: string): boolean {
        const answersIndex = this.getPlayerAnswersIndex(player, questionId);
        return answersIndex !== ERRORS.noIndexFound ? this.playerAnswers[answersIndex].final : false;
    }

    evaluateQuestion(player: Player, question: Question): boolean {
        const answersIndex = this.getPlayerAnswersIndex(player, question.id);
        if (this.playerAnswers.length === 0) return false;
        if (this.playerAnswers[answersIndex] === undefined) return false;
        let gotRightAnswer = true;
        let correctChoicesCounter = 0;
        for (const choice of this.playerAnswers[answersIndex].qcmAnswers) {
            if (!choice.isCorrect) {
                gotRightAnswer = false;
                break;
            } else {
                correctChoicesCounter++;
            }
        }
        if (correctChoicesCounter !== question.getRightChoicesNumber()) {
            gotRightAnswer = false;
        }
        return gotRightAnswer;
    }

    updateAnswer(player: Player, question: Question, newChoice: Choice): void {
        const answersIndex = this.getPlayerAnswersIndex(player, question.id);
        if (answersIndex !== ERRORS.noIndexFound) {
            if (this.didPlayerAnswer(player, newChoice, question.id)) {
                this.playerAnswers[answersIndex].qcmAnswers.splice(this.getAnswerIndex(player, question.id, newChoice), 1);
            } else {
                this.playerAnswers[answersIndex].qcmAnswers.push(newChoice);
            }
        } else {
            this.playerAnswers.push({
                name: player.name,
                lastAnswerTime: '',
                final: false,
                questionId: question.id,
                obtainedPoints: 0,
                qcmAnswers: [newChoice],
                qrlAnswer: '',
                // TODO : changer pour la vraie reponse
                qreAnswer: 0,
                isTypingQrl: false,
            });
        }
    }

    /**
     * This method allows us to update score and nBonusObtained stats from a player of this match
     */
    updatePlayerStats(updatedPlayer: Player): void {
        const updatedPlayerIndex = this.findPlayerIndexByName(updatedPlayer.name);

        if (updatedPlayerIndex !== ERRORS.noIndexFound) {
            const existingPlayer = this.players[updatedPlayerIndex];
            existingPlayer.score = updatedPlayer.score;
            existingPlayer.nBonusObtained = updatedPlayer.nBonusObtained;
        }
    }

    findPlayerIndexByName(playerName: string): number {
        return this.players.findIndex((player) => player.name === playerName);
    }

    findPlayerByName(name: string): Player | null {
        const index = this.findPlayerIndexByName(name);
        return index !== -1 ? this.players[index] : null;
    }

    getScoreOfPlayerByName(playerName: string): number | null {
        const playerIndex = this.findPlayerIndexByName(playerName);
        if (playerIndex !== ERRORS.noIndexFound) return this.players[playerIndex].score;
        return null;
    }
}
