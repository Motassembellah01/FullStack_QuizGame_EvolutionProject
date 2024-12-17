import { Game } from '@app/core/classes/game/game';
import { Player } from '@app/core/interfaces/player';

export interface CreateMatchDto {
    game: Game;
    managerName: string;
    managerId: string;
    isFriendMatch: boolean;
    isTeamMatch: boolean;
    isPricedMatch: boolean;
    nbPlayersJoined: number;
    players: Player[];
    priceMatch: number;
}
