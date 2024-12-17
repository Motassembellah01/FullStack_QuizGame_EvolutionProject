import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { Question } from '@app/core/classes/question/question';
import { GAMES, QUESTIONS } from '@app/core/data/data';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { Observable, of } from 'rxjs';
import { GamePanelComponent } from './game-panel.component';
import { CommonModule } from '@angular/common';

describe('GamePanelComponent', () => {
    let component: GamePanelComponent;
    let fixture: ComponentFixture<GamePanelComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameServiceService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    const mockedGames: Game[] = GAMES.map((obj) => ({ ...obj })) as Game[];
    const mockQuestion: Question[] = QUESTIONS.map((obj) => ({ ...obj })) as Question[];
    const mockedGame: Game = { ...mockedGames[0] } as Game;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameServiceService', [
            'getGameById',
            'gameVisibility$',
            'verifyGameIsAvailable',
            'updateGameVisibility',
            'deleteGame',
            'exportGame',
            'verifyGameExists',
            'updateGameList',
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);

        TestBed.configureTestingModule({
            imports: [GamePanelComponent, CommonModule],
            providers: [
                { provide: GameServiceService, useValue: gameServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
            ],
        });
        fixture = TestBed.createComponent(GamePanelComponent);
        component = fixture.componentInstance;
        mockedGame.questions = mockQuestion;
        component.gameDirective = mockedGame;
        gameServiceSpy.router = routerSpy;
        spyOn(window, 'alert').and.stub();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should change component visibility', () => {
        const previousVisibility = component.isVisible;
        gameServiceSpy.verifyGameExists.and.callFake(() => {
            gameServiceSpy.gameExists = true;
            return of(mockedGame);
        });
        gameServiceSpy.updateGameVisibility.and.returnValue(of(mockedGame));
        component.toggleVisibility();

        expect(gameServiceSpy.updateGameVisibility).toHaveBeenCalled();
        expect(component.isVisible).toEqual(!previousVisibility);
    });
    it('should not change component visibility if the game does not exist', () => {
        const previousVisibility = component.isVisible;
        gameServiceSpy.verifyGameExists.and.callFake(() => {
            gameServiceSpy.gameExists = false;
            return of(mockedGame);
        });
        component.toggleVisibility();
        expect(component.isVisible).toEqual(previousVisibility);
    });
    it('should display an error message if an error occurred while updating visibility', () => {
        const previousVisibility = component.isVisible;
        gameServiceSpy.verifyGameExists.and.callFake(() => {
            gameServiceSpy.gameExists = true;
            return of(mockedGame);
        });
        gameServiceSpy.updateGameVisibility.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error message here' });
            }),
        );
        component.toggleVisibility();

        expect(window.alert).toHaveBeenCalled();
        expect(gameServiceSpy.updateGameVisibility).toHaveBeenCalled();
        expect(component.isVisible).toEqual(!previousVisibility);
    });

    it('should not change visibility if game does not exist', () => {
        const previousVisibility = component.isVisible;
        gameServiceSpy.verifyGameExists.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error message here' });
            }),
        );
        component.toggleVisibility();
        expect(gameServiceSpy.updateGameList).toHaveBeenCalled();
        expect(component.isVisible).toEqual(previousVisibility);
    });

    it('navigateModify should call navigateByUrl when gameExists is true', () => {
        gameServiceSpy.verifyGameExists.and.returnValue(of(mockedGame));
        gameServiceSpy.gameExists = true;
        component.navigateModify();

        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`administration/create-game/${component.gameDirective.id}`);
    });

    it('navigateModify should send an alert when gameExists is false', () => {
        gameServiceSpy.verifyGameExists.and.returnValue(of(mockedGame));
        gameServiceSpy.gameExists = false;
        component.navigateModify();

        expect(window.alert).toHaveBeenCalled();
    });

    it('navigateModify should update game list if verifyGameExists throws an error', () => {
        gameServiceSpy.verifyGameExists.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error' });
            }),
        );
        component.navigateModify();

        expect(gameServiceSpy.updateGameList).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
    });

    it('export should call exportGame when gameExists is true', () => {
        const exportGameSpy = spyOn(component, 'exportGame');
        gameServiceSpy.verifyGameExists.and.returnValue(of(mockedGame));
        gameServiceSpy.gameExists = true;
        component.export();

        expect(exportGameSpy).toHaveBeenCalled();
    });

    it('export should send an alert when gameExists is false', () => {
        gameServiceSpy.verifyGameExists.and.returnValue(of(mockedGame));
        gameServiceSpy.gameExists = false;
        component.export();

        expect(window.alert).toHaveBeenCalled();
    });

    it('export should update game list if verifyGameExists throws an error', () => {
        gameServiceSpy.verifyGameExists.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error' });
            }),
        );
        component.export();

        expect(gameServiceSpy.updateGameList).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
    });

    it('deleteGameWithConfirmation should call askConfirmation', () => {
        component.deleteGameWithConfirmation();
        expect(spyCancelConfirmationService.askConfirmation).toHaveBeenCalled();
    });

    it('deleteGame should call window.alert if error deleting game', () => {
        gameServiceSpy.verifyGameExists.and.returnValue(of(mockedGame));
        gameServiceSpy.gameExists = true;
        gameServiceSpy.deleteGame.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error deleting game' });
            }),
        );
        component.deleteGame();

        expect(gameServiceSpy.verifyGameExists).toHaveBeenCalled();
        expect(gameServiceSpy.deleteGame).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
    });

    it('deleteGame should update game list if game already deleted', () => {
        gameServiceSpy.verifyGameExists.and.returnValue(of(mockedGame));
        gameServiceSpy.gameExists = false;
        gameServiceSpy.deleteGame.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error deleting game' });
            }),
        );
        component.deleteGame();

        expect(gameServiceSpy.verifyGameExists).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
        expect(gameServiceSpy.updateGameList).toHaveBeenCalled();
    });

    it('deleteGame should update game list if verifyGameExists throws an error', () => {
        gameServiceSpy.verifyGameExists.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error deleting game' });
            }),
        );
        component.deleteGame();

        expect(gameServiceSpy.verifyGameExists).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalled();
        expect(gameServiceSpy.updateGameList).toHaveBeenCalled();
    });

    it('exportGame should call JSON.stringify', () => {
        const stringifySpy = spyOn(JSON, 'stringify');
        const createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('mockURL');
        const blob = new Blob(['test'], { type: 'application/json' });
        component.exportGame();

        expect(stringifySpy).toHaveBeenCalled();
        expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    });
    it('exportGame should call filterStringify', () => {
        const stringifySpy = spyOn(component, 'filterStringify');
        const createObjectURLSpy = spyOn(window.URL, 'createObjectURL').and.returnValue('mockURL');
        const blob = new Blob(['test'], { type: 'application/json' });
        component.gameDirective = mockedGame;
        component.exportGame();

        expect(stringifySpy).toHaveBeenCalled();
        expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    });
    it('filterStringify should ignore fields id and timeAllow in a question', () => {
        const stringGame: string = component.filterStringify(mockedGame);
        const gameToExport = JSON.parse(stringGame);
        // eslint-disable-next-line no-unused-vars
        const { id, timeAllowed, ...expectedQuestion } = mockQuestion[0];
        expect(gameToExport.questions[0]).toEqual(expectedQuestion);
    });
    it('filterStringify should ignore field visibility in a game', () => {
        const stringGame: string = component.filterStringify(mockedGame);
        const gameToExport = JSON.parse(stringGame);
        // eslint-disable-next-line no-unused-vars
        const { visibility, ...expectedGame } = gameToExport;
        expect(gameToExport).toEqual(expectedGame);
    });
});
