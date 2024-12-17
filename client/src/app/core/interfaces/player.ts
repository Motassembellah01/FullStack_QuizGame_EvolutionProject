/**
 * Interface to represent a player
 * by the name, the score, the
 * number of bonus obtained and
 * the activity.
 */
export interface Player {
    name: string;
    isActive: boolean;
    score: number;
    nBonusObtained: number;
    chatBlocked: boolean;
    avatar: string;
}
