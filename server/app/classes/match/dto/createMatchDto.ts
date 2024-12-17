import { Player } from '@app/interfaces/player';
import { Game } from '@app/model/database/game';

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
