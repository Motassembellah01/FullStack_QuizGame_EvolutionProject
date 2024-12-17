/* eslint-disable max-lines */
import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
import { ERRORS } from '@app/constants/constants';
import { Choice } from '@app/interfaces/choice';
import { IMatch } from '@app/interfaces/i-match';
import { Player } from '@app/interfaces/player';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { MATCHES_STUB } from '@app/tests.support/stubs/matches.stub';
import { Match } from './match';

describe('Match', () => {
    const sampleMatches: Match[] = MATCHES_STUB();
    it('should create an instance', () => {
        expect(new Match()).toBeTruthy();
    });

    describe('banPlayerName', () => {
        it('should ban a player name', () => {
            const nameToBan = 'BannedPlayer';
            sampleMatches[0].banPlayerName(nameToBan);

            expect(sampleMatches[0].bannedNames).toContain(nameToBan);
        });
    });

    describe('getPlayersList', () => {
        it('should return the list of players', () => {
            const playersList = sampleMatches[0].getPlayersList();

            expect(playersList).toEqual(sampleMatches[0].players);
        });
    });
    describe('getPlayersAnswersList', () => {
        it('should return the list of player answers', () => {
            const playerAnswers1 = { name: 'playerName' } as PlayerAnswers;
            sampleMatches[0].playerAnswers.push(playerAnswers1);

            const playersAnswersList = sampleMatches[0].getPlayersAnswersList();

            expect(playersAnswersList).toEqual(sampleMatches[0].playerAnswers);
        });
    });

    describe('addPlayer', () => {
        it('should add a player to the list', () => {
            const clonedMatch = new Match(sampleMatches[0]);
            const player = { name: 'playerName' } as Player;
            clonedMatch.addPlayer(player);

            expect(sampleMatches[0].players).toContain(player);
        });
    });

    describe('removePlayer', () => {
        it('should remove a player from the list', () => {
            const playerToRemove = { name: 'playerToRemove' } as Player;
            sampleMatches[0].players.push(playerToRemove);

            sampleMatches[0].removePlayer(playerToRemove);

            expect(sampleMatches[0].players).not.toContain(playerToRemove);
        });
    });

    describe('removePlayerToBannedName', () => {
        it('should remove a player name from the banned names list', () => {
            const nameToRemove = 'UnbannedPlayer';
            sampleMatches[0].bannedNames.push(nameToRemove);

            sampleMatches[0].removePlayerToBannedName({ name: nameToRemove } as Player);

            expect(sampleMatches[0].bannedNames).not.toContain(nameToRemove);
        });
    });

    describe('parseMatch', () => {
        it('should parse an IMatch object and return a Match instance', () => {
            const iMatchMock = {
                game: {
                    questions: [
                        { id: '1', text: 'Question 1' },
                        { id: '2', text: 'Question 2' },
                    ],
                },
            } as IMatch;

            const parsedMatch = Match.parseMatch(iMatchMock);

            expect(parsedMatch.game.questions.length).toBe(2);
            expect(parsedMatch.game.questions[0].id).toBe('1');
            expect(parsedMatch.game.questions[1].text).toBe('Question 2');
        });
    });

    describe('isPlayerNameValid', () => {
        it('should return true for a valid player name', () => {
            const clonedMatch = new Match(sampleMatches[1]);
            clonedMatch.players = [{ name: 'Player1' } as Player, { name: 'Player2' } as Player];
            clonedMatch.bannedNames = ['BannedPlayer'];

            const isValid = clonedMatch.isPlayerNameValid('NewPlayerName');

            expect(isValid).toBe(true);
        });

        it('should return false for a banned player name', () => {
            const clonedMatch = new Match(sampleMatches[1]);
            clonedMatch.bannedNames = ['BannedPlayer'];

            const isValid = clonedMatch.isPlayerNameValid('BannedPlayer');

            expect(isValid).toBe(false);
        });

        it('should return false for a duplicate player name', () => {
            const clonedMatch = new Match(sampleMatches[1]);
            clonedMatch.players = [{ name: 'ExistingPlayer' } as Player, { name: 'DuplicatePlayer' } as Player];

            const isValid = clonedMatch.isPlayerNameValid('DuplicatePlayer');

            expect(isValid).toBe(false);
        });
    });

    describe('updatePlayerAnswers', () => {
        it('should add player answers when not found in playerAnswers list', () => {
            const match = new Match(sampleMatches[0]);
            const newPlayerAnswers = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
            });

            const updateInfo = {
                playerAnswers: newPlayerAnswers,
            } as UpdateAnswerRequest;

            match.updatePlayerAnswers(updateInfo);

            expect(match.playerAnswers[match.playerAnswers.length - 1]).toEqual(newPlayerAnswers);
        });

        it('should update player answers when found in playerAnswers list', () => {
            const match = new Match(sampleMatches[1]);
            const existingPlayerAnswers = new PlayerAnswers({
                name: 'Player2',
                questionId: 'Q2',
                qcmAnswers: [{ text: 'choice1' } as Choice, { text: 'choice2' } as Choice],
            });
            match.playerAnswers.push(existingPlayerAnswers);

            const newChoices = [{ text: 'choice1' } as Choice, { text: 'choice2' } as Choice];
            const newPlayerAnswers = {
                playerAnswers: new PlayerAnswers({
                    name: 'Player2',
                    questionId: 'Q2',
                    qcmAnswers: newChoices,
                }),
            } as UpdateAnswerRequest;

            match.updatePlayerAnswers(newPlayerAnswers);

            expect(match.playerAnswers[match.playerAnswers.length - 1].name).toBe('Player2');
            expect(match.playerAnswers[match.playerAnswers.length - 1].questionId).toBe('Q2');
            expect(match.playerAnswers[match.playerAnswers.length - 1].qcmAnswers).toEqual(newChoices);
        });
    });

    describe('setFinalPlayerAnswers', () => {
        it('should set final player answers when no player answers exist', () => {
            const match = new Match(sampleMatches[0]);
            match.playerAnswers = [];
            const playerAnswers = new PlayerAnswers({
                name: 'Player1',
                questionId: 'Q1',
                final: true,
            });

            match.setFinalPlayerAnswers(playerAnswers);

            expect(match.playerAnswers.length).toBe(1);
            expect(match.playerAnswers[0]).toEqual(playerAnswers);
        });

        it('should set final player answers when player answers does not exist', () => {
            const match = new Match(sampleMatches[0]);
            jest.spyOn(PlayerAnswers.prototype, 'arePlayerAnswersEqual').mockReturnValue(false);
            const playerAnswers = new PlayerAnswers({
                name: 'non-existing Player',
                questionId: 'Q1',
                final: true,
            });
            match.playerAnswers = [];
            const existingPlayerAnswers = new PlayerAnswers({
                name: 'Player2',
                questionId: 'Q2',
                final: false,
            });
            match.playerAnswers.push(existingPlayerAnswers);

            match.setFinalPlayerAnswers(playerAnswers);

            expect(match.playerAnswers[match.playerAnswers.length - 1]).toEqual(playerAnswers);
        });

        it('should update final player answers when player answers exist', () => {
            jest.spyOn(PlayerAnswers.prototype, 'arePlayerAnswersEqual').mockReturnValue(true);
            const match = new Match(sampleMatches[1]);
            match.playerAnswers = [];
            const existingPlayerAnswers = new PlayerAnswers({
                name: 'Player2',
                questionId: 'Q2',
                final: false,
            });
            match.playerAnswers.push(existingPlayerAnswers);

            const newPlayerAnswers = new PlayerAnswers({
                name: 'Player2',
                questionId: 'Q2',
                final: true,
            });

            match.setFinalPlayerAnswers(newPlayerAnswers);

            expect(match.playerAnswers.length).toBe(1);
            expect(match.playerAnswers[0].name).toBe('Player2');
            expect(match.playerAnswers[0].questionId).toBe('Q2');
            expect(match.playerAnswers[0].final).toBe(true);
        });
    });

    describe('getPlayerIndexByName', () => {
        it('should return the index of a player by name', () => {
            const playerName = sampleMatches[0].players[0].name;
            const expectedIndex = sampleMatches[0].players.findIndex((p) => p.name === playerName);

            const result = sampleMatches[0].getPlayerIndexByName(playerName);

            expect(result).toBe(expectedIndex);
        });

        it('should return -1 for a player not found by name', () => {
            const playerName = 'NonExistentPlayer';

            const result = sampleMatches[0].getPlayerIndexByName(playerName);

            expect(result).toBe(ERRORS.noIndexFound);
        });
    });

    describe('calculateEarliestLastAnswerTime', () => {
        it('should calculate the earliest last answer time for a question', () => {
            const match = new Match(sampleMatches[0]);
            const questionId = 'Q1';
            match.playerAnswers = [];
            match.players = [];
            match.players.push(
                { name: 'Player1', isActive: true } as Player,
                { name: 'Player2', isActive: true } as Player,
                { name: 'Player3', isActive: true } as Player,
            );

            match.playerAnswers.push(
                new PlayerAnswers({
                    name: 'Player1',
                    questionId,
                    lastAnswerTime: '100',
                    final: true,
                    obtainedPoints: 1,
                }),
                new PlayerAnswers({
                    name: 'Player2',
                    questionId,
                    lastAnswerTime: '200',
                    final: true,
                    obtainedPoints: 1,
                }),
                new PlayerAnswers({
                    name: 'Player3',
                    questionId,
                    lastAnswerTime: '150',
                    final: true,
                    obtainedPoints: 1,
                }),
            );

            const result = match.calculateEarliestLastAnswerTime(questionId);
            const expectedResult = 200;

            expect(result).toBe(expectedResult);
        });

        it('should return 0 if no valid answer times are found', () => {
            const match = new Match(sampleMatches[0]);
            const questionId = 'Q2';
            match.playerAnswers = [];
            match.players = [{ name: 'Player1', isActive: true } as Player];

            match.playerAnswers.push(
                new PlayerAnswers({
                    name: 'Player1',
                    questionId,
                    lastAnswerTime: '',
                    final: true,
                    obtainedPoints: 1,
                }),
            );

            const result = match.calculateEarliestLastAnswerTime(questionId);

            expect(result).toBe(0);
        });

        it('should considerate only active players', () => {
            const match = new Match(sampleMatches[0]);
            const questionId = 'Q2';
            match.playerAnswers = [];
            match.players = [{ name: 'Player1', isActive: true } as Player, { name: 'Player2', isActive: false } as Player];

            match.playerAnswers.push(
                new PlayerAnswers({
                    name: 'Player1',
                    questionId,
                    lastAnswerTime: '100',
                    final: true,
                    obtainedPoints: 1,
                }),
                new PlayerAnswers({
                    name: 'Player2',
                    questionId,
                    lastAnswerTime: '200',
                    final: true,
                    obtainedPoints: 1,
                }),
            );

            const result = match.calculateEarliestLastAnswerTime(questionId);
            const expectedResult = 100;
            expect(result).toBe(expectedResult);
        });

        it('should return 0 when playerAnswers is empty', () => {
            const match = new Match(sampleMatches[0]);
            const questionId = 'Q2';
            match.playerAnswers = [];

            const result = match.calculateEarliestLastAnswerTime(questionId);

            expect(result).toBe(0);
        });
    });
    describe('getFinalPlayerAnswers', () => {
        it('should return an array of final player answers for a specific question', () => {
            const match = new Match(sampleMatches[0]);
            const questionId = 'Q1';

            match.playerAnswers.push(
                new PlayerAnswers({
                    name: 'Player1',
                    questionId,
                    final: true,
                }),
                new PlayerAnswers({
                    name: 'Player2',
                    questionId: 'Q2',
                    final: true,
                }),
                new PlayerAnswers({
                    name: 'Player3',
                    questionId,
                    final: true,
                }),
            );

            match.players = [];
            match.players.push(
                { name: 'Player1', isActive: true } as Player,
                { name: 'Player2', isActive: false } as Player,
                { name: 'Player3', isActive: true } as Player,
            );

            const result = match.getFinalPlayerAnswers(questionId);

            expect(result).toHaveLength(2); // Seuls Player1 et Player3 sont actifs et ont des réponses finales pour Q1
        });

        it('should return an empty array if no valid final player answers are found', () => {
            const match = new Match(sampleMatches[1]);
            const questionId = 'Q2';

            match.playerAnswers.push(
                new PlayerAnswers({
                    name: 'Player1',
                    questionId,
                    final: false,
                }),
            );
            match.players.push({ name: 'Player1', isActive: true } as Player);

            const result = match.getFinalPlayerAnswers(questionId);

            expect(result).toHaveLength(0);
        });
    });

    describe('findPlayersWithEarliestLastAnswerTime', () => {
        it('should return an array of player indexes with the earliest last answer time for a specific question', () => {
            const match = new Match(sampleMatches[0]);
            const questionId = 'Q1';
            match.players = [];
            match.playerAnswers = [];

            const player1 = { name: 'Player1', isActive: true } as Player;
            const player2 = { name: 'Player2', isActive: true } as Player;
            const player3 = { name: 'Player3', isActive: true } as Player;
            match.players.push(player1, player2, player3);

            match.playerAnswers.push(
                new PlayerAnswers({
                    name: player1.name,
                    questionId,
                    final: true,
                    obtainedPoints: 1,
                    lastAnswerTime: '1000',
                }),
                new PlayerAnswers({
                    name: player2.name,
                    questionId,
                    final: true,
                    obtainedPoints: 1,
                    lastAnswerTime: '500',
                }),
                new PlayerAnswers({
                    name: player3.name,
                    questionId,
                    final: true,
                    obtainedPoints: 1,
                    lastAnswerTime: '500',
                }),
            );

            const earliestLastAnswerTime = 500;
            const result = match.findPlayersWithEarliestLastAnswerTime(questionId, earliestLastAnswerTime);

            expect(result).toHaveLength(2); // Player2 and Player3 have the earliest last answer time
            expect(result).toContain(1); // Player2 index
            expect(result).toContain(2); // Player3 index
        });

        it('should return an empty array if no players have the earliest last answer time', () => {
            const match = new Match(sampleMatches[1]);
            const questionId = 'Q2';

            match.playerAnswers = [];

            const earliestLastAnswerTime = 1000;
            const result = match.findPlayersWithEarliestLastAnswerTime(questionId, earliestLastAnswerTime);

            expect(result).toHaveLength(0);
        });
    });

    describe('getMatchHistory', () => {
        it('should return this match history', () => {
            const BEST_SCORE = 10;
            jest.spyOn(sampleMatches[0], 'getBestScore').mockReturnValue(BEST_SCORE);
            const result = sampleMatches[0].getMatchHistory();

            expect(result).toEqual({
                matchAccessCode: sampleMatches[0].accessCode,
                bestScore: BEST_SCORE,
                startTime: sampleMatches[0].begin,
                nStartPlayers: sampleMatches[0].players.length,
                gameName: sampleMatches[0].game.title,
            });
        });
    });

    describe('getBestScore', () => {
        it('should return this match best score', () => {
            const BEST_SCORE = 10;
            const match = new Match(sampleMatches[2]);
            match.players[0].score = BEST_SCORE;
            const result = match.getBestScore();

            expect(result).toEqual(BEST_SCORE);
        });
    });
});
