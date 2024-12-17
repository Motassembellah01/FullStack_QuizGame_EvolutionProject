import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { WaitingRoomRoadGuard } from '@app/core/guards/waiting-room-road-service/waiting-room-road.guard';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';

describe('adminRoadGuard', () => {
    let service: WaitingRoomRoadGuard;
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
        service = TestBed.inject(WaitingRoomRoadGuard);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should allow users if they joined a match', () => {
        matchPlayerServiceSpy.hasJoinMatch = true;
        expect(service.canActivate()).toEqual(true);
    });
    it('should redirect users to play page if they did not joined a match and return false', () => {
        matchPlayerServiceSpy.hasJoinMatch = false;
        expect(service.canActivate()).toEqual(false);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('play');
    });
});
