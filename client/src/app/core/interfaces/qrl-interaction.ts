import { Player } from '@app/core/interfaces/player';
/**
 * Interface used for the players
 * interactions with the input during
 * a QRL question
 */
export class QrlInteraction {
    player: Player;
    hasInteracted: boolean;
}
