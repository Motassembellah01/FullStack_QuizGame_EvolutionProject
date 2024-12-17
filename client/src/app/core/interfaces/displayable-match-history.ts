/**
 * Interface to represent a match history displayed in the histories table
 */
export interface DisplayableMatchHistory {
    matchAccessCode: string;
    bestScore: number;
    startTime: Date;
    nStartPlayers: number;
    gameName: string;
}
