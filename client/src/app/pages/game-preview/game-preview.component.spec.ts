import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { Match } from '@app/core/classes/match/match';
import { NAMES } from '@app/core/constants/constants';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { Player } from '@app/core/interfaces/player';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { Observable, of } from 'rxjs';
import { GamePreviewComponent } from './game-preview.component';
import { CommonModule } from '@angular/common';

describe('GamePreviewComponent', () => {
    let component: GamePreviewComponent;
    let fixture: ComponentFixture<GamePreviewComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameServiceService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let routeSpy: jasmine.SpyObj<ActivatedRoute>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    const mockGame: Game = new Game();
    const mockId: Params = { id: 'testId' };

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameServiceService', ['getGameById', 'gameVisibility$', 'verifyGameIsAvailable']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        routeSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', ['initializeScore', 'setCurrentMatch', 'validateAccessCode']);

        TestBed.configureTestingModule({
            declarations: [],
            imports: [GamePreviewComponent, LogoComponent, CommonModule],
            providers: [
                { provide: GameServiceService, useValue: gameServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: routeSpy },
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
            ],
        });
        fixture = TestBed.createComponent(GamePreviewComponent);
        component = fixture.componentInstance;
        routeSpy.snapshot.params = mockId;
        gameServiceSpy.gameVisibility$ = of(' ');
        spyOn(window, 'alert').and.stub();
    });

    it('should create', () => {
        gameServiceSpy.getGameById.and.returnValue(of(mockGame));
        fixture.detectChanges();
        expect(component).toBeTruthy();
        expect(component.currentGame).toEqual(mockGame);
    });

    it('should send an alert when getGameById returns an error', () => {
        gameServiceSpy.getGameById.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error message here' });
            }),
        );
        fixture.detectChanges();
        expect(window.alert).toHaveBeenCalled();
    });

    it('should call verifyGameIsAvailable, setCurrentMatch and initializeScore onTestGame', () => {
        const id = mockId['id'];
        component.currentGame = mockGame;
        spyOn(component, 'validateAccessCodeRecursively').and.returnValue(of(true));
        spyOn(component, 'getCurrentFormattedTime').and.returnValue('');
        component.onTestGame(id);
        const testPlayer = {
            name: NAMES.tester,
            isActive: true,
            score: 0,
            nBonusObtained: 0,
            chatBlocked: false,
        } as Player;
        const testMatch = new Match({
            game: component.currentGame,
            begin: '',
            end: '',
            bestScore: 0,
            accessCode: 'xxxx',
            managerName: 'organisateur',
            isAccessible: true,
            bannedNames: ['organisateur', 'système'],
            players: [testPlayer],
            playerAnswers: [],
            testing: true,
            timer: 0,
            panicMode: false,
            timing: true,
        });
        testMatch.players = [];

        expect(gameServiceSpy.verifyGameIsAvailable).toHaveBeenCalledWith(id, `play/match/${id}`);
        expect(matchPlayerServiceSpy.setCurrentMatch).toHaveBeenCalledWith(testMatch, testPlayer);
        expect(matchPlayerServiceSpy.initializeScore).toHaveBeenCalled();
    });

    it('should call verifyGameIsAvailable and setCurrentMatch onCreateMatch', () => {
        spyOn(component, 'validateAccessCodeRecursively').and.returnValue(of(true));
        const id = mockId['id'];
        component.onCreateMatch(id);
        expect(gameServiceSpy.verifyGameIsAvailable).toHaveBeenCalledWith(id, `create/wait/game/${JSON.stringify({ id, testing: false })}`);
        expect(matchPlayerServiceSpy.setCurrentMatch).toHaveBeenCalled();
    });
    it('should call validateAccessCodeRecursively once if the accessCode is valid', () => {
        const validateAccessCodeRecursivelySpy = spyOn(component, 'validateAccessCodeRecursively').and.callThrough();
        const validateAccessCodeSpy = matchPlayerServiceSpy.validateAccessCode.and.returnValue(of(false));
        component.validateAccessCodeRecursively().subscribe((result) => {
            expect(result).toBe(true);
            expect(validateAccessCodeRecursivelySpy).toHaveBeenCalledTimes(1);
            expect(validateAccessCodeSpy).toHaveBeenCalledTimes(1);
        });
    });

    it('should call validateAccessCodeRecursively recursively if the accessCode is not valid', () => {
        const validateAccessCodeRecursivelySpy = spyOn(component, 'validateAccessCodeRecursively').and.callThrough();
        const validateAccessCodeSpy = matchPlayerServiceSpy.validateAccessCode.and.callFake(() => {
            validateAccessCodeSpy.and.returnValue(of(false));
            return of(true);
        });
        component.validateAccessCodeRecursively().subscribe((result) => {
            expect(result).toBe(true);
            expect(validateAccessCodeRecursivelySpy).toHaveBeenCalledTimes(2);
            expect(validateAccessCodeSpy).toHaveBeenCalledTimes(2);
        });
    });
});
