import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NAMES } from '@app/core/constants/constants';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';

@Injectable({
    providedIn: 'root',
})
/**
 * Guard for the road match result
 * Only players or managers can access this road
 */
export class MatchResultGuard {
    constructor(
        private matchPlayerService: MatchPlayerService,
        private router: Router,
    ) {}
    canActivate(): boolean {
        // Make sure that a player testing a game can not access Waiting Room
        let isManager = false;
        const isPlayer = this.matchPlayerService.hasJoinMatch;
        if (this.matchPlayerService.player) isManager = this.matchPlayerService.player.name.toLowerCase() === NAMES.manager.toLowerCase();
        const hasAccess = isManager || isPlayer;
        if (!hasAccess) this.router.navigateByUrl('home');
        return hasAccess;
    }
}
