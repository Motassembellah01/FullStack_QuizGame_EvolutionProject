import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableDataSource } from '@angular/material/table';
import { Match } from '@app/core/classes/match/match';
import { NAMES, PLAYERS_NAME_COLORS, SocketsSendEvents } from '@app/core/constants/constants';
import { ChatAccessibilityRequest } from '@app/core/interfaces/chat-accessibility-request';
import { Player } from '@app/core/interfaces/player';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { PlayersListComponent } from './players-list.component';
import { CommonModule } from '@angular/common';

describe('PlayersListComponent', () => {
    let component: PlayersListComponent;
    let fixture: ComponentFixture<PlayersListComponent>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let mockPlayersList: Player[];
    let mockMatch: Match;

    beforeEach(() => {
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', ['dataSource', 'initializePlayersList']);
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['playersAnswered', 'quittedPlayers', 'playersWithFinalAnswers']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['send']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, PlayersListComponent, CommonModule],
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: HistogramService, useValue: histogramServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        fixture = TestBed.createComponent(PlayersListComponent);
        component = fixture.componentInstance;
        mockPlayersList = [
            { name: 'Test1', isActive: true, score: 2, nBonusObtained: 0, chatBlocked: false },
            { name: 'Test2', isActive: true, score: 2, nBonusObtained: 0, chatBlocked: false },
            { name: 'Test3', isActive: true, score: 3, nBonusObtained: 0, chatBlocked: false },
        ];
        matchPlayerServiceSpy.dataSource = new MatTableDataSource(mockPlayersList);
        matchPlayerServiceSpy.player = mockPlayersList.map((obj) => Object.assign({ ...obj }))[0];
        mockMatch = { accessCode: '1234', players: mockPlayersList.map((obj) => Object.assign({ ...obj })) } as Match;
        matchPlayerServiceSpy.match = mockMatch;
        matchPlayerServiceSpy.socketService = socketServiceSpy;
        histogramServiceSpy.quittedPlayers = [mockPlayersList[0].name];
        histogramServiceSpy.playersWithFinalAnswers = [mockPlayersList[1].name];
        histogramServiceSpy.quittedPlayers = [mockPlayersList[2].name];
        histogramServiceSpy.playersAnswered = ['test'];
    });

    describe('creation', () => {
        it('should create', () => {
            component.isResultView = false;
            component.ngOnInit();
            expect(component.displayedColumns).toEqual(['state', 'name', 'score', 'chatAccessibility']);
            expect(component).toBeTruthy();
        });

        it('should call matchPlayerService.initializePlayersList and clearSortingByPlayersState', () => {
            spyOn(component, 'clearSortingByPlayersState').and.stub();
            component.isResultView = false;
            component.ngOnInit();
            expect(matchPlayerServiceSpy.initializePlayersList).toHaveBeenCalled();
            expect(component.clearSortingByPlayersState).toHaveBeenCalled();
        });

        it('should add nBonusObtained to displayedColumns and call sortPlayersList if isResultView', () => {
            spyOn(component, 'sortPlayersListByDefault');
            component.isResultView = true;
            matchPlayerServiceSpy.player.name = 'test';
            component.ngOnInit();
            expect(component.sortPlayersListByDefault).toHaveBeenCalled();
            expect(component.displayedColumns).toEqual(['name', 'score', 'nBonusObtained']);
        });

        it('should add nBonusObtained and chatAccessibility to displayedColumns if isResultView and players name is Manager', () => {
            spyOn(component, 'sortPlayersListByDefault');
            component.isResultView = true;
            matchPlayerServiceSpy.player.name = NAMES.manager;
            component.ngOnInit();
            expect(component.sortPlayersListByDefault).toHaveBeenCalled();
            expect(component.displayedColumns).toEqual(['name', 'score', 'nBonusObtained', 'chatAccessibility']);
        });
    });

    describe('ngAfterViewInit', () => {
        it('should set dataSource sort', () => {
            component.ngAfterViewInit();
            expect(matchPlayerServiceSpy.dataSource.sort).toEqual(component.sort);
        });
    });

    describe('hasPlayerResponded', () => {
        it('should set dataSource sort', () => {
            spyOn(histogramServiceSpy.playersAnswered, 'find').and.returnValue('');
            component.hasPlayerResponded('test');
            expect(histogramServiceSpy.playersAnswered.find).toHaveBeenCalled();
        });
    });

    describe('getDisplayColor', () => {
        it('should return PLAYERS_NAME_COLORS.black if isResultView', () => {
            component.isResultView = true;
            const nameColor = component.getDisplayColor(mockPlayersList[0].name);
            expect(nameColor).toEqual(PLAYERS_NAME_COLORS.black);
        });

        it('should return PLAYERS_NAME_COLORS.black if !isResultView and playerHasQuitted() returns true', () => {
            component.isResultView = false;
            spyOn(component, 'playerHasQuitted').and.returnValue(true);
            const nameColor = component.getDisplayColor(mockPlayersList[0].name);
            expect(nameColor).toEqual(PLAYERS_NAME_COLORS.black);
        });

        it('should return PLAYERS_NAME_COLORS.green if !isResultView and playerHasFinalAnswer() returns true', () => {
            component.isResultView = false;
            spyOn(component, 'playerHasFinalAnswer').and.returnValue(true);
            const nameColor = component.getDisplayColor(mockPlayersList[0].name);
            expect(nameColor).toEqual(PLAYERS_NAME_COLORS.green);
        });

        it('should return PLAYERS_NAME_COLORS.yellow if !isResultView and playerResponded() returns true', () => {
            component.isResultView = false;
            spyOn(component, 'hasPlayerResponded').and.returnValue(true);
            const nameColor = component.getDisplayColor(mockPlayersList[0].name);
            expect(nameColor).toEqual(PLAYERS_NAME_COLORS.yellow);
        });

        it('should return PLAYERS_NAME_COLORS.red in other cases', () => {
            component.isResultView = false;
            const nameColor = component.getDisplayColor(mockPlayersList[0].name);
            expect(nameColor).toEqual(PLAYERS_NAME_COLORS.red);
        });
    });

    describe('sortPlayersListByDefault', () => {
        it('should sort data by score and then by name', () => {
            const sortedData = mockPlayersList.map((obj) => Object.assign({ ...obj }));
            sortedData.sort((firstPlayer, nextPlayer) => {
                const scoreComparison = nextPlayer.score - firstPlayer.score;
                if (scoreComparison === 0) {
                    return firstPlayer.name.localeCompare(nextPlayer.name);
                }
                return scoreComparison;
            });

            component.sortPlayersListByDefault();
            expect(matchPlayerServiceSpy.dataSource.data).toEqual(sortedData);
            spyOn(matchPlayerServiceSpy.dataSource.data, 'sort');
            component.sortPlayersListByDefault();
            expect(matchPlayerServiceSpy.dataSource.data.sort).toHaveBeenCalled();
        });
    });

    describe('sortByPlayersState', () => {
        it('should sort data by state', () => {
            spyOn(component, 'comparePlayersStates').and.returnValue(0);
            component.sortByPlayersState();
            spyOn(matchPlayerServiceSpy.dataSource.data, 'sort');
            component.sortByPlayersState();
            expect(matchPlayerServiceSpy.dataSource.data.sort).toHaveBeenCalled();
            expect(component.comparePlayersStates).toHaveBeenCalled();
        });

        it('should sort data by state and then by name if 2 players or more have the same state', () => {
            spyOn(component, 'comparePlayersStates').and.returnValue(1);
            component.sortByPlayersState();
            spyOn(matchPlayerServiceSpy.dataSource.data, 'sort');
            component.sortByPlayersState();
            expect(matchPlayerServiceSpy.dataSource.data.sort).toHaveBeenCalled();
            expect(component.comparePlayersStates).toHaveBeenCalled();
        });

        it('should set isSortingByPlayersState to false if !isSortingByStateAscending && isSortingByPlayersState', () => {
            component.isSortingByStateAscending = false;
            component.isSortingByPlayersState = true;
            component.sortByPlayersState();
            expect(component.isSortingByPlayersState).toBeFalsy();
        });
    });

    describe('comparePlayersStates', () => {
        it('should call getDisplayColor', () => {
            spyOn(component, 'getDisplayColor');
            component.comparePlayersStates(mockPlayersList[0], mockPlayersList[1]);
            expect(component.getDisplayColor).toHaveBeenCalled();
        });
    });

    describe('sendChatAccessibility', () => {
        it('should send a request to change chat accessibility', () => {
            const mockData: ChatAccessibilityRequest = {
                matchAccessCode: '1234',
                name: mockPlayersList[0].name,
                players: mockPlayersList,
            };
            component.sendChatAccessibility(mockPlayersList[0].name);
            socketServiceSpy.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.ChangeChatAccessibility);
                expect(data).toEqual(mockData);
            });
            expect(socketServiceSpy.send).toHaveBeenCalled();
        });
    });
});
