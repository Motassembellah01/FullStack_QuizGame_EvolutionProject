/**
 * Representation of a player in the server
 */
export interface Player {
    name: string;
    isActive: boolean;
    score: number;
    nBonusObtained: number;
    chatBlocked: boolean;
}
