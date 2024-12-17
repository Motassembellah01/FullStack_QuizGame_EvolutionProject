import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Match } from '@app/core/classes/match/match';
import { MatchRoadGuard } from '@app/core/guards/match-road-service/match-road.guard';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';

describe('matchRoadGuard', () => {
    let service: MatchRoadGuard;
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
        service = TestBed.inject(MatchRoadGuard);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should allow user if it is a testing match', () => {
        matchPlayerServiceSpy.hasJoinMatch = false;
        matchPlayerServiceSpy.match = new Match();
        matchPlayerServiceSpy.match.testing = true;
        expect(service.canActivate()).toEqual(true);
    });

    it('should allow users if they joined a match', () => {
        matchPlayerServiceSpy.hasJoinMatch = true;
        expect(service.canActivate()).toEqual(true);
    });
    it('should redirect users to play page if they did not joined a match and it is not a testing match and return false', () => {
        matchPlayerServiceSpy.hasJoinMatch = false;
        matchPlayerServiceSpy.match = new Match();
        matchPlayerServiceSpy.match.testing = false;
        expect(service.canActivate()).toEqual(false);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('play');
    });
});
