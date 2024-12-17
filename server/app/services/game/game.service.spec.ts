import { Game, GameDocument } from '@app/model/database/game';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { createModelMock } from '@app/tests.support/mocks/model.mock';
import { GAMES_STUB } from '@app/tests.support/stubs/games.stub';
import { NEW_GAME_STUB } from '@app/tests.support/stubs/new-game.stub';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let gameModel: Model<GameDocument>;

    beforeEach(async () => {
        gameModel = createModelMock<GameDocument>();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                Logger,
                {
                    provide: getModelToken(Game.name),
                    useValue: gameModel,
                },
            ],
        }).compile();
        jest.clearAllMocks();
        service = module.get<GameService>(GameService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('start', () => {
        beforeEach(() => {
            jest.spyOn(service, 'populateDB');
        });
        it('should populate the database when there are no documents', async () => {
            (gameModel.countDocuments as jest.Mock).mockResolvedValue(0);
            (gameModel.insertMany as jest.Mock).mockResolvedValueOnce([]);

            await service.start();

            expect(gameModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(service.populateDB).toHaveBeenCalledTimes(1);
        });

        it('should not populate the database when there are existing documents', async () => {
            const nbDocuments = 5;
            (gameModel.countDocuments as jest.Mock).mockResolvedValue(nbDocuments);

            await service.start();

            expect(gameModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(service.populateDB).not.toHaveBeenCalled();
        });
    });

    describe('populateDB', () => {
        it('should populate the database with initial values', async () => {
            (gameModel.insertMany as jest.Mock).mockResolvedValue([]);

            await service.populateDB();

            expect(gameModel.insertMany).toHaveBeenCalledWith(GAMES_STUB());
        });
    });

    describe('getAllGames', () => {
        it('should retrieve the list of games', async () => {
            service.start = jest.fn().mockResolvedValue(undefined);
            const games: Game[] = Object.assign(GAMES_STUB());
            (gameModel.find as jest.Mock).mockResolvedValue(games);

            const result = await service.getAllGames();

            expect(service.start).toHaveBeenCalled();
            expect(gameModel.find).toHaveBeenCalledWith({});
            expect(result).toEqual(games);
        });
    });

    describe('getGameById', () => {
        it('should retrieve a game by id', async () => {
            const games = Object.assign(GAMES_STUB());
            const gameId = games[0].id;
            (gameModel.findOne as jest.Mock).mockResolvedValue(games[0]);

            const result = await service.getGameById(gameId);

            expect(gameModel.findOne).toHaveBeenCalledWith({ id: gameId });
            expect(result).toEqual(games[0]);
        });

        it('should return null for non-existing game id', async () => {
            const gameId = 'nonExistingId';
            (gameModel.findOne as jest.Mock).mockResolvedValue(null);

            const result = await service.getGameById(gameId);

            expect(gameModel.findOne).toHaveBeenCalledWith({ id: gameId });
            expect(result).toBeNull();
        });
    });

    describe('addGame', () => {
        const newGame: CreateGameDto = Object.assign(NEW_GAME_STUB());
        it('should add a new game successfully', async () => {
            (gameModel.create as jest.Mock).mockResolvedValue(undefined);

            try {
                await service.addGame(newGame);
            } catch (error) {
                expect(error).toBeUndefined();
            }

            expect(gameModel.create).toHaveBeenCalledWith(newGame);
        });

        it('should handle an error during game insertion', async () => {
            const errorMessage = 'Insertion error message';
            (gameModel.create as jest.Mock).mockRejectedValue(new Error(errorMessage));

            try {
                await service.addGame(newGame);
            } catch (error) {
                expect(gameModel.create).toHaveBeenCalledWith(newGame);
                expect(error).toContain(errorMessage);
            }
        });
    });

    describe('updateGame', () => {
        let modifiedGame: Game;
        let existingGame: Game;
        beforeEach(() => {
            modifiedGame = Object.assign(GAMES_STUB())[0];
            existingGame = { ...modifiedGame };
        });
        it('should update a game successfully', async () => {
            (gameModel.findOne as jest.Mock).mockResolvedValue(existingGame);
            (gameModel.replaceOne as jest.Mock).mockResolvedValue({ matchedCount: 1 });

            try {
                await service.updateGame(modifiedGame);
            } catch (error) {
                expect(error).toBeUndefined();
            }

            expect(gameModel.findOne).toHaveBeenCalledWith({ title: modifiedGame.title });
            expect(gameModel.replaceOne).toHaveBeenCalledWith({ id: modifiedGame.id }, modifiedGame);
        });

        it('should reject with "Name already used" when a game with the same title exists', async () => {
            modifiedGame.id = 'Another game has the same title';
            (gameModel.findOne as jest.Mock).mockResolvedValue(existingGame);

            try {
                await service.updateGame(modifiedGame);
            } catch (error) {
                expect(gameModel.findOne).toHaveBeenCalledWith({ title: modifiedGame.title });
                expect(error).toBe('Name already used');
            }
        });

        it('should reject with "Could not find game" when the game to update is not found', async () => {
            (gameModel.findOne as jest.Mock).mockResolvedValue(null);
            (gameModel.replaceOne as jest.Mock).mockResolvedValue({ matchedCount: 0 });

            try {
                await service.updateGame(modifiedGame);
            } catch (error) {
                expect(gameModel.findOne).toHaveBeenCalledWith({ title: modifiedGame.title });
                expect(gameModel.replaceOne).toHaveBeenCalledWith({ id: modifiedGame.id }, modifiedGame);
                expect(error).toBe('Could not find game');
            }
        });

        it('should reject with an error message when an error occurs during the update', async () => {
            (gameModel.findOne as jest.Mock).mockResolvedValue(existingGame);

            const errorMessage = 'Update error message';
            (gameModel.replaceOne as jest.Mock).mockRejectedValue(new Error(errorMessage));

            try {
                await service.updateGame(modifiedGame);
            } catch (error) {
                expect(gameModel.findOne).toHaveBeenCalledWith({ title: modifiedGame.title });
                expect(error).toContain(`Failed to update game: ${errorMessage}`);
            }
        });
    });

    describe('deleteGameById', () => {
        it('should delete a game by ID', async () => {
            const gameIdToDelete = Object.assign(GAMES_STUB())[0].id;
            const deleteResponse = {
                deletedCount: 1,
            };
            (gameModel.deleteOne as jest.Mock).mockResolvedValue(deleteResponse);

            try {
                await service.deleteGameById(gameIdToDelete);
            } catch (error) {
                expect(error).toBeUndefined();
            }
            expect(gameModel.deleteOne).toHaveBeenCalledWith({ id: gameIdToDelete });
        });

        it('should handle a game not found', async () => {
            const gameIdToDelete = 'Inexistant Id';
            const deleteResponse = {
                deletedCount: 0,
            };
            (gameModel.deleteOne as jest.Mock).mockResolvedValue(deleteResponse);

            try {
                await service.deleteGameById(gameIdToDelete);
            } catch (error) {
                expect(error).toContain('Could not find game');
            }
            expect(gameModel.deleteOne).toHaveBeenCalledWith({ id: gameIdToDelete });
        });

        it('should handle an error during deletion', async () => {
            const gameIdToDelete = Object.assign(GAMES_STUB())[0].id;
            const errorMessage = 'Deletion error message';
            (gameModel.deleteOne as jest.Mock).mockRejectedValue(new Error(errorMessage));

            try {
                await service.deleteGameById(gameIdToDelete);
            } catch (error) {
                expect(error).toContain(`Failed to delete game: ${errorMessage}`);
            }
            expect(gameModel.deleteOne).toHaveBeenCalledWith({ id: gameIdToDelete });
        });
    });

    describe('updateGameVisibility', () => {
        it('should update game visibility', async () => {
            const gameIdToUpdate = Object.assign(GAMES_STUB())[0].id;
            const isVisible = true;
            const updateResponse = {
                matchedCount: 1,
            };
            (gameModel.updateOne as jest.Mock).mockResolvedValue(updateResponse);

            try {
                await service.updateGameVisibility(gameIdToUpdate, isVisible);
            } catch (error) {
                expect(error).toBeUndefined();
            }

            expect(gameModel.updateOne).toHaveBeenCalledWith({ id: gameIdToUpdate }, { isVisible });
        });

        it('should handle a game not found', async () => {
            const gameIdToUpdate = 'Inexistant Id';
            const isVisible = true;
            const updateResponse = {
                matchedCount: 0,
            };
            (gameModel.updateOne as jest.Mock).mockResolvedValue(updateResponse);

            try {
                await service.updateGameVisibility(gameIdToUpdate, isVisible);
            } catch (error) {
                expect(error).toContain('Game not found');
            }
            expect(gameModel.updateOne).toHaveBeenCalledWith({ id: gameIdToUpdate }, { isVisible });
        });

        it('should handle an error during update', async () => {
            const gameIdToUpdate = Object.assign(GAMES_STUB())[0].id;
            const isVisible = true;
            const errorMessage = 'Update error message';
            (gameModel.updateOne as jest.Mock).mockRejectedValue(new Error(errorMessage));

            try {
                await service.updateGameVisibility(gameIdToUpdate, isVisible);
            } catch (error) {
                expect(error).toContain(`Failed to update document: ${errorMessage}`);
            }

            expect(gameModel.updateOne).toHaveBeenCalledWith({ id: gameIdToUpdate }, { isVisible });
        });
    });

    describe('titleExists', () => {
        it('should return true if the title exists in the database', async () => {
            const titleToCheck = Object.assign(GAMES_STUB())[0].title;
            (gameModel.findOne as jest.Mock).mockResolvedValue({ title: titleToCheck });

            const titleExists = await service.titleExists({ title: titleToCheck });
            expect(titleExists).toBe(true);
        });

        it('should return false if the title does not exist in the database', async () => {
            const titleToCheck = 'Non-Existent Title';
            (gameModel.findOne as jest.Mock).mockResolvedValue(null);

            const titleExists = await service.titleExists({ title: titleToCheck });
            expect(titleExists).toBe(false);
        });
    });
});
