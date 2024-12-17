import { gameSchema } from '@app/model/database/game';
import { gameList } from '@app/scripts/data/starting-game-list';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

dotenv.config();
const logger = new Logger('GamePopulator');
const GAMEMODEL = mongoose.model('Game', gameSchema);

async function populateDB() {
    try {
        await mongoose.connect(process.env.DATABASE_CONNECTION_STRING || '');
        logger.log('Connected to MongoDB');

        const existingGamesCount = await GAMEMODEL.countDocuments();
        if (existingGamesCount > 0) {
            logger.log('Database already populated. Skipping population.');
            await mongoose.disconnect();
            logger.log('Disconnected from MongoDB');
            return;
        }

        const games = gameList.map((gameData) => new GAMEMODEL(gameData));
        await GAMEMODEL.insertMany(games);
        logger.log(`Database populated successfully with ${games.length} games.`);

        await mongoose.disconnect();
        logger.log('Disconnected from MongoDB');
    } catch (error) {
        logger.error('Error while populating the database:', error.message);
        await mongoose.disconnect();
    }
}

populateDB()
    .then(() => {
        logger.log('populateDB script execution complete.');
    })
    .catch((err) => {
        logger.error('populateDB script execution failed:', err);
    });
