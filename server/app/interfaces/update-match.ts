import { Player } from '@app/interfaces/player';
/**
 * Used to update players list in a match
 */
export interface UpdateMatch {
    accessCode: string;
    player?: Player;
}
