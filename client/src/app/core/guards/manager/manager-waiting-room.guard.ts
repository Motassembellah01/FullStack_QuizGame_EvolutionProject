import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NAMES } from '@app/core/constants/constants';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';

@Injectable({
    providedIn: 'root',
})
/**
 * Guard for the road manager waiting room
 * Only managers can access this road
 */
export class ManagerWaitingRoomGuard {
    constructor(
        private matchPlayerService: MatchPlayerService,
        private router: Router,
    ) {}
    canActivate(): boolean {
        // Make sure that a player testing a game can not access Waiting Room
        let hasAccess = false;
        if (this.matchPlayerService.player) {
            if (this.matchPlayerService.player.name) hasAccess = this.matchPlayerService.player.name.toLowerCase() === NAMES.manager.toLowerCase();
        }
        if (!hasAccess) this.router.navigateByUrl('create');
        return hasAccess;
    }
}
