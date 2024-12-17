import { Player } from '@app/core/interfaces/player';

export interface CurrentMatchesDto {
    accessCode: string;
    quizName: string;
    playersCount: number;
    observersCount: number;
    hasStarted: boolean;
    isAccessible: boolean;
    managerName: string;
    managerId: string;
    isFriendMatch: boolean;
    isPricedMatch: boolean;
    players: Player[];
    priceMatch: number;
}
