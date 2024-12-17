/**
 * Interface to represent the presence
 * of a player in a room.
 */
export class PlayerRequest {
    roomId: string;
    name: string;
    hasPlayerLeft?: boolean;
}
