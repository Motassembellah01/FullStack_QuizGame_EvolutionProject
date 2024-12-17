/* eslint-disable max-lines */
import { Match } from '@app/classes/match/match';
import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
import { Question } from '@app/classes/question/question';
import { FACTORS, QUESTION_TYPE } from '@app/constants/constants';
import { Player } from '@app/interfaces/player';
import { UpdateAnswerRequest } from '@app/interfaces/update-answer-request';
import { UpdateMatch } from '@app/interfaces/update-match';
import { MatchHistory, MatchHistoryDocument } from '@app/model/database/match-history';
import { createModelMock } from '@app/tests.support/mocks/model.mock';
import { MATCHES_STUB } from '@app/tests.support/stubs/matches.stub';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { MatchService } from './match.service';

describe('MatchService', () => {
    let service: MatchService;
    const sampleMatches: Match[] = Object.assign(MATCHES_STUB());
    const validAccessCode = sampleMatches[0].accessCode;
    const fakeAccessCode = 'fakeAccessCode';
    const EARLIEST_TIME = 8;
    let matchHistoryModel: Model<MatchHistoryDocument>;

    beforeEach(async () => {
        matchHistoryModel = createModelMock<MatchHistoryDocument>();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchService,
                Logger,
                {
                    provide: getModelToken(MatchHistory.name),
                    useValue: matchHistoryModel,
                },
            ],
        }).compile();
        jest.clearAllMocks();
        service = module.get<MatchService>(MatchService);
        service.matches = Object.assign(MATCHES_STUB());
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getMatchByAccessCode', () => {
        it('should return a match when a matching access code is found', () => {
            const result = service.getMatchByAccessCode(validAccessCode);

            expect(result).toEqual(sampleMatches[0]);
        });

        it('should throw an exception when no match with the given access code is found', () => {
            expect(() => {
                service.getMatchByAccessCode(fakeAccessCode);
            }).toThrowError('Match not found');
        });
    });

    describe('accessCodeExists', () => {
        it('should return true when a matching access code exists', () => {
            const exists = service.accessCodeExists(validAccessCode);

            expect(exists).toBe(true);
        });

        it('should return false when no match with the given access code is found', () => {
            const exists = service.accessCodeExists(fakeAccessCode);

            expect(exists).toBe(false);
        });
    });
    describe('isPlayerNameValidForGame', () => {
        const playerName = 'ValidPlayerName';
        it('should return true for a valid player name', () => {
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            const isPlayerNameValidSpy = jest.spyOn(Match.prototype, 'isPlayerNameValid').mockReturnValue(true);
            const result = service.isPlayerNameValidForGame({ accessCode: validAccessCode, name: playerName });

            expect(isPlayerNameValidSpy).toHaveBeenCalledWith(playerName);
            expect(result).toBe(true);
        });

        it('should return false for an invalid player name', () => {
            const invalidPlayerName = 'InvalidPlayerName';
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            const isPlayerNameValidSpy = jest.spyOn(Match.prototype, 'isPlayerNameValid').mockReturnValue(false);
            const result = service.isPlayerNameValidForGame({ accessCode: validAccessCode, name: invalidPlayerName });

            expect(isPlayerNameValidSpy).toHaveBeenCalledWith(invalidPlayerName);
            expect(result).toBe(false);
        });
    });

    describe('isAccessible', () => {
        const cloneMatch = new Match(sampleMatches[0]);
        it('should return true when the match is accessible', () => {
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(cloneMatch);
            Object.defineProperty(cloneMatch, 'isAccessible', {
                value: true,
            });
            const result = service.isAccessible(validAccessCode);
            expect(result).toBe(true);
        });

        it('should return false when the match is not accessible', () => {
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(cloneMatch);
            Object.defineProperty(cloneMatch, 'isAccessible', {
                value: false,
            });
            const result = service.isAccessible(validAccessCode);
            expect(result).toBe(false);
        });
    });

    describe('setAccessibility', () => {
        it('should set match accessibility to true when it is false', () => {
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[1]);
            sampleMatches[1].isAccessible = false;

            service.setAccessibility(validAccessCode);

            expect(sampleMatches[1].isAccessible).toBe(true);
        });

        it('should set match accessibility to false when it is true', () => {
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[1]);
            sampleMatches[1].isAccessible = true;

            service.setAccessibility(validAccessCode);

            expect(sampleMatches[1].isAccessible).toBe(false);
        });
    });

    describe('updatePlayersList', () => {
        it('should update match players list', () => {
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[2]);
            service.updatePlayersList(validAccessCode, []);
            expect(sampleMatches[2].players).toEqual([]);
        });
    });

    describe('getPlayersList', () => {
        it('should return the list of players from the match', () => {
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            jest.spyOn(sampleMatches[0], 'getPlayersList').mockReturnValue(sampleMatches[0].players);

            const result = service.getPlayersList({ accessCode: validAccessCode });

            expect(result).toEqual(sampleMatches[0].players);
        });
    });

    describe('updatePlayerAnswers', () => {
        it('should update player answers in the match', () => {
            const newPlayerAnswers: UpdateAnswerRequest = {
                matchAccessCode: validAccessCode,
                playerAnswers: {} as PlayerAnswers,
            };
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            const updatePlayerAnswersSpy = jest.spyOn(sampleMatches[0], 'updatePlayerAnswers');

            service.updatePlayerAnswers(newPlayerAnswers);

            expect(updatePlayerAnswersSpy).toHaveBeenCalledWith(newPlayerAnswers);
        });
    });

    describe('addPlayer', () => {
        it('should add a player to the match', () => {
            const updateData: UpdateMatch = {
                accessCode: validAccessCode,
                player: { name: 'newPlayer' } as Player,
            };
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            const addPlayerSpy = jest.spyOn(sampleMatches[0], 'addPlayer');

            service.addPlayer(updateData);

            expect(addPlayerSpy).toHaveBeenCalledWith(updateData.player);
        });
    });

    describe('addPlayerToBannedPlayer', () => {
        it('should add a player to the banned players list', () => {
            const updateData: UpdateMatch = {
                accessCode: validAccessCode,
                player: { name: 'BannedPlayer' } as Player,
            };
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            const banPlayerNameSpy = jest.spyOn(sampleMatches[0], 'banPlayerName');

            service.addPlayerToBannedPlayer(updateData);

            expect(banPlayerNameSpy).toHaveBeenCalledWith(updateData.player.name);
        });
    });

    describe('deleteMatchByAccessCode', () => {
        it('should delete a match with the given access code', () => {
            service.deleteMatchByAccessCode(validAccessCode);
            const result = service.matches.find((match) => match.accessCode === sampleMatches[0].accessCode);

            expect(result).toBeUndefined();
        });

        it('should throw an error when no match is deleted', () => {
            const fakeAccessCodeToDelete = 'fakeAccessCodeToDelete';

            expect(() => {
                service.deleteMatchByAccessCode(fakeAccessCodeToDelete);
            }).toThrowError('no match were deleted');
        });
    });

    describe('deleteAllMatches', () => {
        it('should delete all matches', () => {
            service.deleteAllMatches();

            expect(service.matches).toHaveLength(0);
        });
    });

    describe('createMatch', () => {
        it('should add a new match to the list of matches', () => {
            const newMatch: Match = new Match(sampleMatches[0]);

            service.createMatch(newMatch);

            expect(service.matches).toContainEqual(newMatch);
        });
    });

    describe('removePlayer', () => {
        it('should remove a player from the match', () => {
            const playerToRemove: Player = sampleMatches[0].players[0];
            const updateData: UpdateMatch = {
                accessCode: validAccessCode,
                player: playerToRemove,
            };
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            const removePlayerSpy = jest.spyOn(sampleMatches[0], 'removePlayer');

            service.removePlayer(updateData);

            expect(removePlayerSpy).toHaveBeenCalledWith(playerToRemove);
        });
    });

    describe('removePlayerToBannedName', () => {
        it('should remove a player from the banned name list in the match', () => {
            const playerToRemove: Player = sampleMatches[0].players[0];
            const updateData: UpdateMatch = {
                accessCode: validAccessCode,
                player: playerToRemove,
            };
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            const removePlayerToBannedNameSpy = jest.spyOn(sampleMatches[0], 'removePlayerToBannedName');

            service.removePlayerToBannedName(updateData);

            expect(removePlayerToBannedNameSpy).toHaveBeenCalledWith(playerToRemove);
        });
    });

    describe('getPlayerFromMatch', () => {
        it('should return a player from the match by access code and player name', () => {
            const playerName = sampleMatches[0].players[0].name;
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);

            const result = service.getPlayerFromMatch(validAccessCode, playerName);

            expect(result).toEqual(sampleMatches[0].players[0]);
        });

        it('should return undefined if player not found', () => {
            const playerName = 'non-existing name';
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);

            const result = service.getPlayerFromMatch(validAccessCode, playerName);

            expect(result).toBeUndefined();
        });
    });

    describe('getPlayerIndexByName', () => {
        it('should return the index of a player by name', () => {
            const playerName = sampleMatches[0].players[0].name;

            const result = service.getPlayerIndexByName(sampleMatches[0].players, playerName);

            expect(result).toBe(0);
        });

        it('should throw an error if the player is not found in the players list', () => {
            const playerName = 'NonExistentPlayer';

            expect(() => {
                service.getPlayerIndexByName(sampleMatches[0].players, playerName);
            }).toThrowError('Player not found in the match');
        });
    });

    describe('getPlayerAnswers', () => {
        it('should return player answers from the match by access code, player name, and question ID', () => {
            const playerName = sampleMatches[0].playerAnswers[0].name;
            const questionId = sampleMatches[0].playerAnswers[0].questionId;

            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);

            const result = service.getPlayerAnswers(validAccessCode, playerName, questionId);

            expect(result).toEqual(sampleMatches[0].playerAnswers[0]);
        });

        it('should return undefined if player answers are not found', () => {
            const playerName = 'NonExistentPlayer';
            const questionId = '123';
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);

            const result = service.getPlayerAnswers(validAccessCode, playerName, questionId);

            expect(result).toBeUndefined();
        });
    });
    describe('setPlayerAnswersLastAnswerTimeAndFinal', () => {
        it('should update the lastAnswerTime attribute for player answers', () => {
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            const setFinalPlayerAnswersSpy = jest.spyOn(sampleMatches[0], 'setFinalPlayerAnswers');

            service.setPlayerAnswersLastAnswerTimeAndFinal(validAccessCode, sampleMatches[0].playerAnswers[0]);

            expect(setFinalPlayerAnswersSpy).toHaveBeenCalledWith(sampleMatches[0].playerAnswers[0]);
        });
    });

    describe('applyBonusToPlayer', () => {
        it('should apply a bonus to the player', () => {
            const player = sampleMatches[0].players[0];
            const questionScore = 10;
            const expectedBonus = player.nBonusObtained + 1;
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);

            service.applyBonusToPlayer(player, questionScore);

            expect(player.score).toBe(questionScore * FACTORS.firstChoice);
            expect(player.nBonusObtained).toEqual(expectedBonus);
        });
    });

    describe('disablePlayer', () => {
        it('should disable a player in the match', () => {
            const playerName = sampleMatches[0].players[0].name;
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);

            service.disablePlayer({ accessCode: validAccessCode, playerName });

            expect(sampleMatches[0].players[0].isActive).toBe(false);
        });
    });

    describe('allPlayersResponded', () => {
        it('should return true when all active players have responded', () => {
            const questionId = sampleMatches[0].playerAnswers[0].questionId;
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            jest.spyOn(sampleMatches[0], 'getFinalPlayerAnswers').mockImplementation(() => {
                const activePlayers: Player[] = sampleMatches[0].players.filter((player) => player.isActive);
                return activePlayers.map((player) => new PlayerAnswers({ name: player.name }));
            });

            const result = service.allPlayersResponded(validAccessCode, questionId);

            expect(result).toBe(true);
        });

        it('should return false when not all active players have responded', () => {
            const accessCode = validAccessCode;
            const questionId = sampleMatches[0].playerAnswers[0].questionId;
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            jest.spyOn(sampleMatches[0], 'getFinalPlayerAnswers').mockImplementation(() => {
                sampleMatches[0].players.push({ name: 'playerName', isActive: false } as Player);
                return sampleMatches[0].players.map((player) => new PlayerAnswers({ name: player.name }));
            });

            const result = service.allPlayersResponded(accessCode, questionId);

            expect(result).toBe(false);
        });
    });

    describe('updatePlayerScore', () => {
        it('should update the player score in the match and check for bonus', () => {
            const accessCode = validAccessCode;
            const playerName = sampleMatches[0].players[0].name;
            const questionId = '123';
            const newScore = 100;
            const player = { name: playerName, score: newScore } as Player;
            jest.spyOn(service, 'getMatchByAccessCode').mockReturnValue(sampleMatches[0]);
            jest.spyOn(service, 'getPlayerIndexByName').mockReturnValue(0);
            const checkForBonusSpy = jest.spyOn(service, 'checkForBonus');
            const questionScore = player.score - sampleMatches[0].players[0].score;
            sampleMatches[0].game.questions = [new Question({ id: '123', type: QUESTION_TYPE.qcm })];
            service.updatePlayerScore(accessCode, player, questionId);

            expect(sampleMatches[0].players[0].score).toBe(newScore);
            expect(checkForBonusSpy).toHaveBeenCalledWith({
                match: sampleMatches[0],
                playerCheckingForBonus: player,
                questionId,
                questionScore,
            });
        });
    });

    describe('checkForBonus', () => {
        const questionId = '123';
        const questionScore = 100;

        const playerCheckingForBonus = sampleMatches[1].players[0];
        it('should apply bonus to the player with the earliest lastAnswerTime when there is only one such player', () => {
            jest.spyOn(sampleMatches[1], 'calculateEarliestLastAnswerTime').mockReturnValue(EARLIEST_TIME);
            jest.spyOn(sampleMatches[1], 'findPlayersWithEarliestLastAnswerTime').mockReturnValue([0]);
            const applyBonusToPlayerSpy = jest.spyOn(service, 'applyBonusToPlayer');

            service.checkForBonus({ match: sampleMatches[1], playerCheckingForBonus, questionId, questionScore });

            expect(sampleMatches[1].calculateEarliestLastAnswerTime).toHaveBeenCalledWith(questionId);
            expect(sampleMatches[1].findPlayersWithEarliestLastAnswerTime).toHaveBeenCalledWith(questionId, EARLIEST_TIME);
            expect(applyBonusToPlayerSpy).toHaveBeenCalledWith(playerCheckingForBonus, questionScore);
        });

        it('should not apply bonus when there are multiple players with the earliest lastAnswerTime', () => {
            jest.spyOn(sampleMatches[1], 'calculateEarliestLastAnswerTime').mockReturnValue(EARLIEST_TIME);
            jest.spyOn(sampleMatches[1], 'findPlayersWithEarliestLastAnswerTime').mockReturnValue([0, 1]);
            jest.spyOn(service, 'applyBonusToPlayer');

            service.checkForBonus({ match: sampleMatches[1], playerCheckingForBonus, questionId, questionScore });

            expect(sampleMatches[1].calculateEarliestLastAnswerTime).toHaveBeenCalledWith(questionId);
            expect(sampleMatches[1].findPlayersWithEarliestLastAnswerTime).toHaveBeenCalledWith(questionId, EARLIEST_TIME);
            expect(service.applyBonusToPlayer).not.toHaveBeenCalled();
        });

        it('should not apply bonus when the playerCheckingForBonus is not the one with the earliest lastAnswerTime', () => {
            jest.spyOn(sampleMatches[1], 'calculateEarliestLastAnswerTime').mockReturnValue(EARLIEST_TIME);
            jest.spyOn(sampleMatches[1], 'findPlayersWithEarliestLastAnswerTime').mockReturnValue([1]);
            jest.spyOn(service, 'applyBonusToPlayer');

            service.checkForBonus({ match: sampleMatches[1], playerCheckingForBonus, questionId, questionScore });

            expect(sampleMatches[1].calculateEarliestLastAnswerTime).toHaveBeenCalledWith(questionId);
            expect(sampleMatches[1].findPlayersWithEarliestLastAnswerTime).toHaveBeenCalledWith(questionId, EARLIEST_TIME);
            expect(service.applyBonusToPlayer).not.toHaveBeenCalled();
        });
    });

    describe('create match history', () => {
        const newMatchHistoryMock = sampleMatches[1].getMatchHistory();
        it('should add a new match history successfully', async () => {
            (matchHistoryModel.create as jest.Mock).mockResolvedValue(undefined);

            try {
                await service.saveMatchHistory(newMatchHistoryMock);
            } catch (error) {
                expect(error).toBeUndefined();
            }

            expect(matchHistoryModel.create).toHaveBeenCalled();
        });

        it('should handle error during match history insertion', async () => {
            const errorMessage = 'Insertion error message';
            (matchHistoryModel.create as jest.Mock).mockRejectedValue(new Error(errorMessage));

            try {
                await service.saveMatchHistory(newMatchHistoryMock);
            } catch (error) {
                expect(matchHistoryModel.create).toHaveBeenCalled();
                expect(error).toContain(errorMessage);
            }
        });
    });

    describe('delete match history', () => {
        const deleteResponse = {
            deletedCount: 1,
        };
        it('should call deleteMany and be able to handle error', async () => {
            matchHistoryModel.deleteMany = jest.fn();
            (matchHistoryModel.deleteMany as jest.Mock).mockRejectedValueOnce(deleteResponse);
            try {
                await service.deleteMatchHistory();
            } catch (error) {
                expect(error).toBeDefined();
            }

            expect(matchHistoryModel.deleteMany).toHaveBeenCalled();
        });
    });

    describe('get match history', () => {
        const newMatchHistoryMock = [sampleMatches[1].getMatchHistory()];
        it('should return match history', async () => {
            (matchHistoryModel.find as jest.Mock).mockResolvedValue(newMatchHistoryMock);

            const result = await service.getMatchHistory();

            expect(matchHistoryModel.find).toHaveBeenCalled();
            expect(result).toEqual(newMatchHistoryMock);
        });
    });
});
