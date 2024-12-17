import { Game } from '@app/model/database/game';
import { gameList } from '@app/scripts/data/starting-game-list';

/**
 * Fake data for tests purpose */
export const GAMES_STUB = (): Game[] => {
    return gameList;
};
