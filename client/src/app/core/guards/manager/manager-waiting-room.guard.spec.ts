import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NAMES } from '@app/core/constants/constants';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { ManagerWaitingRoomGuard } from './manager-waiting-room.guard';

describe('ManagerWaitingRoomGuard', () => {
    let guard: ManagerWaitingRoomGuard;
    let routerSpy: jasmine.SpyObj<Router>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;

    beforeEach(() => {
        const router = jasmine.createSpyObj('Router', ['navigateByUrl']);
        const matchPlayerService = jasmine.createSpyObj('MatchPlayerService', ['player']);

        TestBed.configureTestingModule({
            providers: [
                ManagerWaitingRoomGuard,
                { provide: Router, useValue: router },
                { provide: MatchPlayerService, useValue: matchPlayerService },
            ],
        });

        guard = TestBed.inject(ManagerWaitingRoomGuard);
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        matchPlayerServiceSpy = TestBed.inject(MatchPlayerService) as jasmine.SpyObj<MatchPlayerService>;
    });

    it('should be created', () => {
        expect(guard).toBeTruthy();
    });

    it('should allow access for the "Organisateur"', () => {
        matchPlayerServiceSpy.player = { name: NAMES.manager, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };
        expect(guard.canActivate()).toBe(true);
    });

    it('should navigate to "create" and deny access for non-"Organisateur"', () => {
        matchPlayerServiceSpy.player = { name: 'anotherPlayer', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };
        expect(guard.canActivate()).toBe(false);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('create');
    });
});
