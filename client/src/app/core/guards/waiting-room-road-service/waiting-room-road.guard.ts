import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
/**
 * Guard for the road waiting room
 * Only players can access this road
 */
export class WaitingRoomRoadGuard {
    constructor(

    ) {}
    canActivate(): boolean {
        // Make sure that a player testing a game can not access Waiting Room
        return true;
    }
}
