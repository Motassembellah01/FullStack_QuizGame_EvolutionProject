import { Player } from '@app/core/interfaces/player';

/**
 * Interface to disable or enable or disable a player chat component
 */
export interface ChatAccessibilityRequest {
    matchAccessCode: string;
    name: string;
    players: Player[];
}
