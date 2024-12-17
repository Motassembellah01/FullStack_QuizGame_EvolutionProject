/* eslint-disable no-underscore-dangle */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Game } from '@app/core/classes/game/game';
import { GAMES } from '@app/core/data/data';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { IGame } from '@app/core/interfaces/game';
import { AppMaterialModule } from '@app/modules/material.module';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { Observable, Subject, of } from 'rxjs';
import { PaginatorComponent } from './paginator.component';
import { CommonModule } from '@angular/common';

describe('PaginatorComponent', () => {
    let component: PaginatorComponent;
    let fixture: ComponentFixture<PaginatorComponent>;
    let gameService: jasmine.SpyObj<GameServiceService>;

    beforeEach(() => {
        gameService = jasmine.createSpyObj('GameServiceService', ['getAllGames', 'gameVisibility$', 'verifyGameIsAvailable', 'getGameList']);

        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, PaginatorComponent, LogoComponent, CommonModule],
            providers: [{ provide: GameServiceService, useValue: gameService }],
        });
        gameService.getAllGames.and.returnValue(of([]));
        gameService.gameVisibility$ = of(' ');
        gameService.getGameList.and.returnValue(new Observable());
        gameService.gamesUpdated$ = of();
        fixture = TestBed.createComponent(PaginatorComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get all games at the on init', () => {
        component.gameService.gameVisibility$ = of('');
        fixture.detectChanges();
        expect(gameService.getGameList).toHaveBeenCalled();
    });

    it('should subscribe to gameVisibility$ and call onPageChange', fakeAsync(() => {
        const mockedGames = [new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0] as IGame)];
        mockedGames[0].isVisible = true;
        gameService.getGameList.and.returnValue(of(mockedGames));
        const paginator = { pageIndex: 0, pageSize: 4 };
        component.paginator = paginator as MatPaginator;
        const spyPageChange = spyOn(component, 'onPageChange').and.stub();
        gameService.gameVisibilitySubject = new Subject<string>();
        const expectedEvent = paginator;
        fixture.detectChanges();
        gameService.gameVisibilitySubject.next('');
        tick();
        expect(spyPageChange).toHaveBeenCalledWith(expectedEvent as PageEvent);
    }));

    it('should call gameService.verifyGameIsAvailable when navigatePreview is called', () => {
        const testId = 'testId';
        const testUrl = `create/preview/games/${testId}`;
        component.navigatePreview(testId);
        expect(gameService.verifyGameIsAvailable).toHaveBeenCalledWith(testId, testUrl);
    });
    it('ngAfterViewInit should rerender', () => {
        const intl = {
            itemsPerPageLabel: '',
            nextPageLabel: '',
            getRangeLabel: (page: number, pageSize: number, length: number) => {
                return (page + pageSize + length).toString();
            },
        };
        const paginator = { pageIndex: 0, pageSize: 4, _intl: intl as MatPaginatorIntl };
        component.paginator = paginator as MatPaginator;
        component.ngAfterViewInit();
        expect(component.paginator._intl.getRangeLabel(0, 2, 1)).toEqual('1 -- 1 de 1');
        expect(component.paginator._intl.getRangeLabel(0, 0, 0)).toEqual('0 -- 0 de 0');
        component.paginator._intl.getRangeLabel(2, 2, 1);
    });

    it('onPageChange should update displayed games', () => {
        const expectedGames = [new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0] as IGame)];
        const expectedEvent = { pageIndex: 0, pageSize: 0 };
        gameService.getGameList.and.returnValue(of(expectedGames));
        component.paginator = {
            ...expectedEvent,
            previousPage: () => {
                return;
            },
        } as MatPaginator;
        const paginatorSpy = spyOn(component.paginator, 'previousPage').and.stub();
        component.onPageChange(expectedEvent as PageEvent);
        expect(gameService.getGameList).toHaveBeenCalled();
        expect(paginatorSpy).toHaveBeenCalled();
    });

    it('updateVisibleGamesCount update list of visible games', () => {
        const mockedGames = [new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0] as IGame)];
        mockedGames[0].isVisible = true;
        component.updateVisibleGamesCount(mockedGames);
        expect(component.nbGames).toEqual(mockedGames.length);
    });
    it('onPageChange should be called after a page event', fakeAsync(() => {
        const paginator = { pageIndex: 0, pageSize: 4 };
        component.paginator = paginator as MatPaginator;
        const spyPageChange = spyOn(component, 'onPageChange').and.stub();
        gameService.gamesUpdatedSubject = new Subject<void>();
        gameService.gamesUpdated$ = gameService.gamesUpdatedSubject.asObservable();
        const expectedEvent = paginator;
        fixture.detectChanges();
        gameService.gamesUpdatedSubject.next();
        tick();
        expect(spyPageChange).toHaveBeenCalledWith(expectedEvent as PageEvent);
    }));
});
