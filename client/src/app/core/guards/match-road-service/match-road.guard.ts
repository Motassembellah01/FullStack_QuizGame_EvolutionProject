import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';

@Injectable({
    providedIn: 'root',
})
/**
 * Guard for the road play
 * Only players or persons testing a game can access this road
 */
export class MatchRoadGuard {
    constructor(
        private matchPlayerService: MatchPlayerService,
        private router: Router,
    ) {}

    canActivate(): boolean {
        const isLogged = this.matchPlayerService.hasJoinMatch || this.matchPlayerService.match.testing;
        if (!isLogged) this.router.navigateByUrl('play');
        return isLogged;
    }
}
