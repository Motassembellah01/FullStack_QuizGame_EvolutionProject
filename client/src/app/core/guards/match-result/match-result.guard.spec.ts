import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Player } from '@app/core/interfaces/player';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { MatchResultGuard } from './match-result.guard';

describe('MatchResultGuard', () => {
    let service: MatchResultGuard;
    let routerSpy: jasmine.SpyObj<Router>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    beforeEach(() => {
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerSpy', ['hasJoinMatch']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        TestBed.configureTestingModule({
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });
        service = TestBed.inject(MatchResultGuard);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('Manager should have access to result', () => {
        const player = { name: 'organisateur' };
        matchPlayerServiceSpy.player = player as Player;
        expect(service.canActivate()).toEqual(true);
    });

    it('Player should have access to result', () => {
        const player = { name: 'pas organisateur' };
        matchPlayerServiceSpy.hasJoinMatch = true;
        matchPlayerServiceSpy.player = player as Player;
        expect(service.canActivate()).toEqual(true);
    });

    it('should redirect users to home page if they player or manager of a current match', () => {
        matchPlayerServiceSpy.hasJoinMatch = false;
        const player = { name: 'pas organisateur' };
        matchPlayerServiceSpy.player = player as Player;
        expect(service.canActivate()).toEqual(false);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('home');
    });
});
