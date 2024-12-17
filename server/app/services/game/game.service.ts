import { Game, GameDocument } from '@app/model/database/game';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { gameList } from '@app/scripts/data/starting-game-list';
import { Message } from '@common/message';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
/** Service to interface with the database to manage matches */
export class GameService {
    constructor(
        @InjectModel(Game.name) public gameModel: Model<GameDocument>,
        private readonly logger: Logger,
    ) {
        this.start();
    }

    async start() {
        if ((await this.gameModel.countDocuments()) === 0) {
            await this.populateDB();
        }
    }

    async populateDB(): Promise<void> {
        this.logger.log({ title: 'Populate', body: 'Populate DB with initial values' } as Message);
        const games: CreateGameDto[] = gameList;
        await this.gameModel.insertMany(games);
    }

    async getAllGames(): Promise<Game[]> {
        this.logger.log('Return list of games');
        await this.start();
        return await this.gameModel.find({});
    }

    async getGameById(id: string): Promise<Game | null> {
        this.logger.log('Game returned');
        return await this.gameModel.findOne({ id });
    }

    async getGameByTitle(title: string): Promise<Game | null> {
        this.logger.log('Game returned');
        return await this.gameModel.findOne({ title });
    }

    async addGame(newGame: CreateGameDto): Promise<void> {
        newGame.durationMap = [];
        newGame.difficultyMap = [];
        newGame.durationMap = [];
        newGame.rating = [];

        this.logger.log('Adding the new game');
        try {
            await this.gameModel.create(newGame);
        } catch (error) {
            return Promise.reject(`Failed to insert game: ${error}`);
        }
    }

    async updateGame(modifiedGame: Game): Promise<void> {
        this.logger.log('Updating the game');
        const filterQuery = { id: modifiedGame.id };
        try {
            const game = await this.gameModel.findOne({ title: modifiedGame.title });
            // if the new name is used by a different game
            if (game && game.id !== modifiedGame.id) return Promise.reject('Name already used');
            else {
                const res = await this.gameModel.replaceOne(filterQuery, modifiedGame);
                if (res.matchedCount === 0) {
                    return Promise.reject('Could not find game');
                }
            }
        } catch (error) {
            return Promise.reject(`Failed to update game: ${error.message}`);
        }
    }

    async deleteGameById(id: string): Promise<void> {
        this.logger.log('Delete game');
        try {
            const res = await this.gameModel.deleteOne({ id });
            if (res.deletedCount === 0) {
                return Promise.reject('Could not find game');
            }
        } catch (error) {
            return Promise.reject(`Failed to delete game: ${error.message}`);
        }
    }

    async updateGameVisibility(id: string, isVisible: boolean): Promise<void> {
        try {
            this.logger.log('visibility parameter updated');
            const res = await this.gameModel.updateOne({ id }, { isVisible });
            if (res.matchedCount === 0) {
                return Promise.reject('Game not found');
            }
        } catch (error) {
            return Promise.reject(`Failed to update document: ${error.message}`);
        }
    }

    async titleExists({ title }): Promise<boolean> {
        const game = await this.gameModel.findOne({ title });
        return !!game;
    }

    async updateGameDifficulty(gameId: string, newEntry: { key: string, value: number }): Promise<void> {
        try {
            this.logger.log('Updating difficulty');
            const res = await this.gameModel.updateOne(
                { id: gameId, 'difficultyMap.key': newEntry.key },
                {
                    $set: { 'difficultyMap.$.value': newEntry.value },
                }
            );
            if (res.matchedCount === 0) {
                await this.gameModel.updateOne(
                    { id: gameId }, 
                    { $push: { difficultyMap: newEntry } }
                );
            }
        } catch (error) {
            return Promise.reject(`Failed to update document: ${error.message}`);
        }
    }

    async updateGameInterest(gameId: string, newEntry: { key: string, value: number }): Promise<void> {
        try {
            this.logger.log('Updating interest');
            const res = await this.gameModel.updateOne(
                { id: gameId, 'interestMap.key': newEntry.key },
                {
                    $set: { 'interestMap.$.value': newEntry.value },
                }
            );
            if (res.matchedCount === 0) {
                await this.gameModel.updateOne(
                    { id: gameId }, 
                    { $push: { interestMap: newEntry } }
                );
            }
        } catch (error) {
            return Promise.reject(`Failed to update document: ${error.message}`);
        }
    }

    async updateGameDuration(gameId: string, newEntry: { key: string, value: number }): Promise<void> {
        try {
            this.logger.log('Updating duration');
            const res = await this.gameModel.updateOne(
                { id: gameId, 'durationMap.key': newEntry.key },
                {
                    $set: { 'durationMap.$.value': newEntry.value },
                }
            );
            if (res.matchedCount === 0) {
                await this.gameModel.updateOne(
                    { id: gameId }, 
                    { $push: { durationMap: newEntry } }
                );
            }
        } catch (error) {
            return Promise.reject(`Failed to update document: ${error.message}`);
        }
    }

    async updateGameRating(gameId: string, newEntry: { key: string, value: number }): Promise<void> {
        try {
            this.logger.log('Updating rating');
            const res = await this.gameModel.updateOne(
                { id: gameId, 'rating.key': newEntry.key },
                {
                    $set: { 'rating.$.value': newEntry.value },
                }
            );
            if (res.matchedCount === 0) {
                await this.gameModel.updateOne(
                    { id: gameId }, 
                    { $push: { rating: newEntry } }
                );
            }
        } catch (error) {
            return Promise.reject(`Failed to update document: ${error.message}`);
        }
    }
}
