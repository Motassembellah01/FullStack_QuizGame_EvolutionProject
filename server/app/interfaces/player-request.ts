/**
 * Interface used when a player leave
 */
export class PlayerRequest {
    roomId: string;
    name: string;
    hasPlayerLeft?: boolean;
}
