import { CreateTeamDto } from '@app/classes/match/dto/create-team.dto';
import { CreateMatchDto } from '@app/classes/match/dto/createMatchDto';
import { Match } from '@app/classes/match/match';
import { Team } from '@app/classes/match/team';
import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
import { Question } from '@app/classes/question/question';
import { ERRORS, FACTORS, QUESTION_TYPE } from '@app/constants/constants';
import { Observer } from '@app/interfaces/Observer';
import { Player } from '@app/interfaces/player';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { UpdateMatch } from '@app/interfaces/update-match';
import { Validation } from '@app/interfaces/validation';
import { MatchHistory, MatchHistoryDocument } from '@app/model/database/match-history';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
/** Class responsible of the management of matches. All actions performed on a match
 * are made through this class
 */
export class MatchService {
    matches: Match[] = [];
    constructor(
        @InjectModel(MatchHistory.name) public matchHistoryModel: Model<MatchHistoryDocument>,
        public logger: Logger,
    ) {}

    getMatchByAccessCode(accessCode: string): Match {
        const matchR: Match = this.matches.find((match) => match.accessCode === accessCode);
        if (!matchR) {
            throw new Error('Match not found');
        }
        this.logger.log('Match returned');
        return matchR;
    }

    accessCodeExists(accessCode: string): boolean {
        this.logger.log('Match validity');
        return this.matches.map((match) => match.accessCode).includes(accessCode);
    }

    isPlayerNameValidForGame(bodyMessage: Validation): boolean {
        this.logger.log('Getting player name existence');
        const match: Match = this.getMatchByAccessCode(bodyMessage.accessCode);
        return match.isPlayerNameValid(bodyMessage.name);
    }

    isAccessible(accessCode: string): boolean {
        this.logger.log('Getting match accessibility');
        const match: Match = this.getMatchByAccessCode(accessCode);
        return match.isAccessible;
    }

    setAccessibility(accessCode: string): void {
        this.logger.log('Setting match accessibility');
        const match: Match = this.getMatchByAccessCode(accessCode);
        match.isAccessible = !match.isAccessible;
    }

    updatePlayersList(accessCode: string, updatedList): void {
        this.logger.log('Updating players list');
        const match: Match = this.getMatchByAccessCode(accessCode);
        match.players = updatedList;
    }

    getPlayersList(updateData: UpdateMatch): Player[] {
        const match = this.getMatchByAccessCode(updateData.accessCode);
        return match.getPlayersList();
    }

    updatePlayerAnswers(newPlayerAnswers: UpdateAnswerRequest): void {
        this.logger.log('Updating player Answers');
        const match = this.getMatchByAccessCode(newPlayerAnswers.matchAccessCode);
        match.updatePlayerAnswers(newPlayerAnswers);
    }

    addPlayer(updateData: UpdateMatch): void {
        this.logger.log('Adding a player');
        const match = this.getMatchByAccessCode(updateData.accessCode);
        match.addPlayer(updateData.player);
    }

    addObserver(joinMatchObserverDto): void {
        this.logger.log('Adding a player');
        const match = this.getMatchByAccessCode(joinMatchObserverDto.accessCode);
        match.addObserver(joinMatchObserverDto.observer);
    }


    addPlayerToBannedPlayer(updateData: UpdateMatch): void {
        this.logger.log('Adding a player to banned Name');
        const match: Match = this.getMatchByAccessCode(updateData.accessCode);
        match.banPlayerName(updateData.player.name);
    }

    deleteMatchByAccessCode(accessCode: string): void {
        this.logger.log('Delete Match', accessCode);
        const matchIndex = this.matches.findIndex((match) => match.accessCode === accessCode);
        if (matchIndex >= 0) this.matches.splice(matchIndex, 1);
        else throw new Error('no match were deleted');
    }

    deleteAllMatches(): void {
        this.logger.log('Delete all matches');
        this.matches = [];
    }

    createMatch(createMatchDto: CreateMatchDto): Match {
        this.logger.log('Adding the new match');
        const accessCode = this.generateUniqueAccessCode();
        const match: Match = new Match({
            game: createMatchDto.game,
            accessCode,
            players: [],
            managerName: createMatchDto.managerName,
            managerId: createMatchDto.managerId,
            isFriendMatch: createMatchDto.isFriendMatch,
            bannedNames: ['manager', 'system', createMatchDto.managerName],
            isAccessible: true,
            isTeamMatch: createMatchDto.isTeamMatch,
            isPricedMatch: createMatchDto.isPricedMatch,
            priceMatch: createMatchDto.priceMatch,
            nbPlayersJoined: createMatchDto.nbPlayersJoined,
            teams: [],
            currentQuestionIndex: 0,
        })
        this.matches.push(match);
        return match;
    }

    generateUniqueAccessCode(): string {
        let accessCode;
        do {
            accessCode = Math.floor(1000 + Math.random() * 9000).toString();
        } while (this.matches.some((match) => match.accessCode === accessCode));
        return accessCode;
    }

    removePlayer(updateData: UpdateMatch): void {
        const match = this.getMatchByAccessCode(updateData.accessCode);
        match.removePlayer(updateData.player);
        if (match.isTeamMatch) {
            match.removePlayerFromTeam(updateData.player.name);
        }
    }

    removePlayerToBannedName(updateData: UpdateMatch): void {
        this.logger.log('Removing player to banned name list');
        const match = this.getMatchByAccessCode(updateData.accessCode);
        match.removePlayerToBannedName(updateData.player);
    }

    updatePlayerScore(accessCode: string, player: Player, questionId: string): void {
        this.logger.log('Updating player score in match: ', accessCode);
        const match: Match = this.getMatchByAccessCode(accessCode);
        const playerIndex: number = this.getPlayerIndexByName(match.players, player.name);

        const questionFound: Question = new Question(match.game.questions.find((question) => question.id === questionId));
        const playerAnswerIndex = match.getPlayerAnswersIndex(player.name, questionId, questionFound.type === QUESTION_TYPE.qre);

        this.logger.log(`Question:  ${questionFound.points}`);
        this.logger.log(`playerAnswerIndex:  ${playerAnswerIndex}`);
        if (playerAnswerIndex !== ERRORS.noIndexFound && questionFound.type === QUESTION_TYPE.qre) {
            const previousScore = match.players[playerIndex].score;
            const answer = match.playerAnswers[playerAnswerIndex].qreAnswer;

            this.logger.log(`Evaluating QRE question for player at index: ${playerIndex}`);
            this.logger.log(`Player's answer: ${answer}`);
            this.logger.log(`Previous score: ${previousScore}`);

            if (questionFound.evaluateQreQuestion(answer)) {
                this.logger.log(`Answer is valid. Adding points to player.`);

                match.players[playerIndex].score += questionFound.points;

                if (answer === questionFound.correctAnswer && questionFound.tolerance !== 0) {
                    this.logger.log(
                        `Answer is exactly correct. Applying bonus. Tolerance: ${questionFound.tolerance}, Points: ${questionFound.points}`
                    );
                    this.applyBonusToPlayer(match.players[playerIndex], questionFound.points);
                }

                const obtainedPoints = match.players[playerIndex].score - previousScore;
                this.logger.log(`Player gained ${obtainedPoints} points.`);
                match.playerAnswers[playerAnswerIndex].obtainedPoints = obtainedPoints;
            } else {
                this.logger.log(`Answer is invalid. No points awarded.`);
            }
            return;
        }


        const questionScore: number = player.score - match.players[playerIndex].score;
        match.players[playerIndex].score = player.score;

        if (playerAnswerIndex !== ERRORS.noIndexFound && questionFound.type === QUESTION_TYPE.qrl) {
            match.playerAnswers[playerAnswerIndex].obtainedPoints = questionScore;
        }

        if (questionFound && questionFound.type === QUESTION_TYPE.qcm) {
            const playerCheckingForBonus = player;
            this.checkForBonus({ match, playerCheckingForBonus, questionId, questionScore });
            if (playerAnswerIndex === ERRORS.noIndexFound) {
                const playerAnswer = new PlayerAnswers({ name: player.name, questionId: questionId, obtainedPoints: questionScore, final: true });
                match.playerAnswers.push(playerAnswer)
            } else {
                match.playerAnswers[playerAnswerIndex].obtainedPoints = questionScore;
            }
        }

        if (match.isTeamMatch) {
            const team = match.teams.find((team) => team.players.some((name) => name === player.name));

            if (team) {
                team.teamScore += match.players[playerIndex].score;
            }
        }
    }

    getPlayerFromMatch(accessCode: string, playerName: string): Player | undefined {
        return this.getMatchByAccessCode(accessCode).players.find((player) => player.name === playerName);
    }

    getPlayerIndexByName(players: Player[], playerName: string): number {
        const playerIndex: number = players.findIndex((p) => p.name === playerName);
        if (playerIndex === ERRORS.noIndexFound) throw new Error('Player not found in the match');
        return playerIndex;
    }

    getPlayerAnswers(accessCode: string, playerName: string, questionId: string): PlayerAnswers | undefined {
        return this.getMatchByAccessCode(accessCode).playerAnswers.find(
            (playerAnswers) => playerAnswers.name === playerName && playerAnswers.questionId === questionId,
        );
    }

    setPlayerAnswersLastAnswerTimeAndFinal(accessCode: string, playerAnswers: PlayerAnswers): void {
        this.logger.log(`Updating PlayerAnswers lastAnswerTime attribute for ${playerAnswers.name}`);

        const match = this.getMatchByAccessCode(accessCode);

        match.setFinalPlayerAnswers(playerAnswers);
    }

    applyBonusToPlayer(player: Player, questionScore: number): void {
        player.score += questionScore * FACTORS.firstChoice;
        player.nBonusObtained++;
    }

    checkForBonus(params: { match: Match; playerCheckingForBonus: Player; questionId: string; questionScore: number }): void {
        const { match, playerCheckingForBonus, questionId, questionScore } = params;
        this.logger.log(`${questionScore} questionScore`);
        this.logger.log(`${playerCheckingForBonus.score} player score`);

        // Calculate the earliestLastAnswerTime, which represents the bigger lastAnswerTime among all player answers.
        // In this context, the player who left the most time on the timer is considered to have answered the earliest.
        const earliestLastAnswerTime: number = match.calculateEarliestLastAnswerTime(questionId);

        const playersIndexesWithEarliestLastAnswerTime: number[] = match.findPlayersWithEarliestLastAnswerTime(questionId, earliestLastAnswerTime);

        if (playersIndexesWithEarliestLastAnswerTime.length === 1) {
            const playerIndexWithEarliestLastAnswerTime = playersIndexesWithEarliestLastAnswerTime[0];
            if (playerCheckingForBonus.name === match.players[playerIndexWithEarliestLastAnswerTime].name) {
                // Apply the bonus to the single player with the oldest time
                this.applyBonusToPlayer(match.players[playerIndexWithEarliestLastAnswerTime], questionScore);
                const playerAnswerIndex = match.getPlayerAnswersIndex(playerCheckingForBonus.name, questionId);
                match.playerAnswers[playerAnswerIndex].obtainedPoints = match.players[playerIndexWithEarliestLastAnswerTime].score;
            }
        }
    }

    disablePlayer(data: { accessCode: string; playerName: string }): void {
        const match: Match = this.getMatchByAccessCode(data.accessCode);

        const playerIndex: number = this.getPlayerIndexByName(match.players, data.playerName);
        match.players[playerIndex].isActive = false;
    }

    removeObserver(accessCode: string, observerName: string): Observer[] {
        const match: Match = this.getMatchByAccessCode(accessCode);
        if (!match) return [];
        match.removeObserver(observerName);
        return match.observers;
    }

    allPlayersResponded(accessCode: string, questionId: string): boolean {
        const match: Match = this.getMatchByAccessCode(accessCode);
        const finalQuestionPlayerAnswers: PlayerAnswers[] = match.getFinalPlayerAnswers(questionId);
        const activePlayers: Player[] = match.players.filter((player) => player.isActive);

        return finalQuestionPlayerAnswers.length === activePlayers.length;
    }

    async saveMatchHistory(matchHistory: MatchHistory): Promise<void> {
        this.logger.log('Adding the new match history');
        try {
            await this.matchHistoryModel.create(matchHistory);
        } catch (error) {
            return Promise.reject(`Failed to save match history: ${error}`);
        }
    }

    async getMatchHistory(): Promise<MatchHistory[]> {
        this.logger.log('Return match history');
        return await this.matchHistoryModel.find({});
    }

    async deleteMatchHistory(): Promise<void> {
        this.logger.log('Delete match history');
        try {
            await this.matchHistoryModel.deleteMany({});
        } catch (error) {
            return Promise.reject(`Failed to delete match history: ${error.message}`);
        }
    }

    createTeam(createTeamDto: CreateTeamDto): Team[] {
        const { accessCode, teamName, playerName: name } = createTeamDto;
        const match = this.getMatchByAccessCode(accessCode);

        if (match.teams.length === 0) {
            this.logger.log(`Teams table is empty in match ${accessCode}. Adding the first team.`);
        } else if (match.teams.some((team) => team.name === teamName)) {
            throw new Error(`Team ${teamName} already exists in this match`);
        }

        match.teams.forEach((existingTeam) => {
            const playerIndex = existingTeam.players.indexOf(createTeamDto.playerName);
            if (playerIndex !== -1) {
                existingTeam.players.splice(playerIndex, 1);
                this.logger.log(`${createTeamDto.playerName} left team ${existingTeam.name} in match ${createTeamDto.accessCode}`);
            }
        });

        const newTeam: Team = {
            name: teamName,
            players: [name],
            teamScore: 0,
        };

        match.teams.push(newTeam);
        this.logger.log(`Team ${teamName} created successfully in match ${accessCode}`);
        return match.teams;
    }

    joinTeam(createTeamDto: CreateTeamDto): Team[] {
        const match = this.getMatchByAccessCode(createTeamDto.accessCode);
        const team = match.teams.find((team) => team.name === createTeamDto.teamName);

        if (!team) {
            throw new Error(`Team ${createTeamDto.teamName} does not exist in this match`);
        }

        if (team.players.length >= 2) {
            throw new Error(`Team ${createTeamDto.teamName} is already full`);
        }

        match.teams.forEach((existingTeam) => {
            const playerIndex = existingTeam.players.indexOf(createTeamDto.playerName);
            if (playerIndex !== -1) {
                existingTeam.players.splice(playerIndex, 1);
                this.logger.log(`${createTeamDto.playerName} left team ${existingTeam.name} in match ${createTeamDto.accessCode}`);
            }
        });

        team.players.push(createTeamDto.playerName);
        this.logger.log(`${createTeamDto.playerName} joined team ${createTeamDto.teamName} in match ${createTeamDto.accessCode}`);
        return match.teams;
    }

    quitTeam(createTeamDto: CreateTeamDto): Team[] {
        const match = this.getMatchByAccessCode(createTeamDto.accessCode);
        const team = match.teams.find((team) => team.name === createTeamDto.teamName);

        if (!team) {
            throw new Error(`Team ${createTeamDto.teamName} does not exist in this match`);
        }

        team.players = team.players.filter((name) => name !== createTeamDto.playerName);
        this.logger.log(`Player ${createTeamDto.playerName} left team ${createTeamDto.teamName} in match ${createTeamDto.accessCode}`);
        return match.teams;
    }

    clearEmptyTeams(accessCode: string): Team[] {
        const match = this.getMatchByAccessCode(accessCode);

        const initialTeamCount = match.teams.length;
        match.teams = match.teams.filter((team) => team.players.length > 0);

        const clearedTeams = initialTeamCount - match.teams.length;
        if (clearedTeams > 0) {
            this.logger.log(`${clearedTeams} empty teams removed from match ${accessCode}`);
        } else {
            this.logger.log(`No empty teams found in match ${accessCode}`);
        }
        return match.teams;
    }
}
