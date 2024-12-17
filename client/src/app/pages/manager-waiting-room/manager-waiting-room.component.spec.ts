import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Match } from '@app/core/classes/match/match';
import { NAMES, SocketsSendEvents, TRANSITIONS_DURATIONS } from '@app/core/constants/constants';
import { ACTIVE_PLAYERS, EXAMPLES, GAMES } from '@app/core/data/data';
import { IMatch } from '@app/core/interfaces/i-match';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { ListenerManagerService } from '@app/core/websocket/services/listener-manager/listener-manager.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { PlayerCardComponent } from '@app/shared/components/player-card/player-card.component';
import { TransitionDialogComponent } from '@app/shared/components/transition-dialog/transition-dialog.component';
import { of } from 'rxjs';
import { ManagerWaitingRoomComponent } from './manager-waiting-room.component';
import { CommonModule } from '@angular/common';
const iMatchMock: IMatch = {
    game: Object.assign(GAMES[0]),
    begin: '',
    end: '',
    bestScore: 0,
    accessCode: '1234',
    testing: false,
    players: [],
    managerName: 'organisateur',
    isAccessible: true,
    bannedNames: ['organisateur'],
    playerAnswers: [],
    panicMode: false,
    timer: 0,
    timing: true,
};
describe('ManagerWaitingRoomComponent', () => {
    let component: ManagerWaitingRoomComponent;
    let fixture: ComponentFixture<ManagerWaitingRoomComponent>;
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let listenerManagerSpy: jasmine.SpyObj<ListenerManagerService>;
    let timeServiceSpy: jasmine.SpyObj<TimeService>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<TransitionDialogComponent>>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    beforeEach(() => {
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', [
            'joinMatchRoom',
            'setCurrentMatch',
            'setAccessibility',
            'match',
            'deleteMatchByAccessCode',
            'cleanCurrentMatch',
        ]);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['isSocketAlive', 'connect', 'disconnect', 'on', 'socket', 'send']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open', 'close']);
        listenerManagerSpy = jasmine.createSpyObj('ListenerManagerService', ['setManagerWaitingRoomListeners']);
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['stopServerTimer', 'startTimer']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close', 'afterClosed']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [ManagerWaitingRoomComponent, LogoComponent, PlayerCardComponent, CommonModule],
            providers: [
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: ListenerManagerService, useValue: listenerManagerSpy },
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: matDialogRefSpy },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ManagerWaitingRoomComponent);
        component = fixture.componentInstance;
        component.accessCode = EXAMPLES.accessCode;
        matchPlayerServiceSpy.setCurrentMatch(new Match(iMatchMock), {
            name: NAMES.manager,
            isActive: true,
            score: 0,
            nBonusObtained: 0,
            chatBlocked: false,
        });
        matchPlayerServiceSpy.socketService = socketServiceSpy;
        matchPlayerServiceSpy.timeService = timeServiceSpy;
        matchPlayerServiceSpy.router = routerSpy;
        matchPlayerServiceSpy.match.players = ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj }));
        fixture.detectChanges();
        socketServiceSpy.connect.calls.reset();
    });

    describe('creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('destruction', () => {
        it('should call cancelGameWithoutConfirmation on onbeforeunload event', () => {
            spyOn(component, 'cancelGameWithoutConfirmation').and.stub();
            window.dispatchEvent(new Event('beforeunload'));
            expect(component.cancelGameWithoutConfirmation).toHaveBeenCalled();
        });

        it('should not call cancelGameWithoutConfirmation on onbeforeunload event after component destruction', () => {
            spyOn(component, 'cancelGameWithoutConfirmation').and.stub();
            component.ngOnDestroy();
            window.dispatchEvent(new Event('beforeunload'));
            expect(component.cancelGameWithoutConfirmation).not.toHaveBeenCalled();
        });

        it('should call cancelGameWithoutConfirmation on onpopstate event', () => {
            spyOn(component, 'cancelGameWithoutConfirmation').and.stub();
            window.dispatchEvent(new Event('popstate'));
            expect(component.cancelGameWithoutConfirmation).toHaveBeenCalled();
        });

        it('should not call cancelGameWithoutConfirmation on onpopstate event after component destruction', () => {
            spyOn(component, 'cancelGameWithoutConfirmation').and.stub();
            component.ngOnDestroy();
            window.dispatchEvent(new Event('popstate'));
            expect(component.cancelGameWithoutConfirmation).not.toHaveBeenCalled();
        });
    });

    describe('onLockWaitingRoom', () => {
        it('should change value of waitingRoomIsLocked to opposite binary value onLockWaitingRoom', () => {
            matchPlayerServiceSpy.setAccessibility.and.returnValue(of(true));
            component.waitingRoomIsLocked = true;

            component.onLockWaitingRoom();
            expect(component.waitingRoomIsLocked).toBeFalsy();
            expect(matchPlayerServiceSpy.setAccessibility).toHaveBeenCalled();

            component.onLockWaitingRoom();
            expect(component.waitingRoomIsLocked).toBeTruthy();
        });
    });

    describe('cancelGameWithoutConfirmation', () => {
        it('should send cancelGameWithoutConfirmation event with right parameters', () => {
            matchPlayerServiceSpy.match = new Match(iMatchMock);
            routerSpy.navigateByUrl.and.stub();
            matchPlayerServiceSpy.deleteMatchByAccessCode.and.returnValue(of(undefined));
            matchPlayerServiceSpy.cleanCurrentMatch.and.stub();
            timeServiceSpy.stopServerTimer.and.stub();
            socketServiceSpy.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.CancelGame);
                expect(data).toEqual({ id: EXAMPLES.accessCode });
            });

            component.cancelGameWithoutConfirmation();

            expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.CancelGame, { id: EXAMPLES.accessCode });
        });

        it('should call stopServerTimer, cleanCurrentMatch, deleteMatchByAccessCode and navigateByUrl', () => {
            matchPlayerServiceSpy.match = new Match(iMatchMock);
            matchPlayerServiceSpy.deleteMatchByAccessCode.and.returnValue(of(undefined));
            timeServiceSpy.stopServerTimer.and.stub();
            socketServiceSpy.send.and.stub();
            component.cancelGameWithoutConfirmation();

            expect(timeServiceSpy.stopServerTimer).toHaveBeenCalled();
            expect(matchPlayerServiceSpy.deleteMatchByAccessCode).toHaveBeenCalledWith(iMatchMock.accessCode);
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith(`/create/preview/games/${iMatchMock.game.id}`);
        });
    });

    describe('cancelGame', () => {
        it('should call setManagerWaitingRoomListeners of listenerManager service', () => {
            spyOn(component, 'cancelGameWithoutConfirmation');
            spyCancelConfirmationService.askConfirmation.and.callFake((action: () => void) => {
                action();
            });
            component.cancelGame();
            expect(spyCancelConfirmationService.askConfirmation).toHaveBeenCalled();
            expect(component.cancelGameWithoutConfirmation).toHaveBeenCalled();
        });
    });

    describe('onBeginMatch', () => {
        it('should call send with the right parameters ', () => {
            matchPlayerServiceSpy.match = new Match(iMatchMock);
            matDialogSpy.open.and.stub();
            timeServiceSpy.startTimer.and.stub();
            socketServiceSpy.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.BeginMatch);
                expect(data).toEqual({ id: iMatchMock.accessCode });
            });

            component.onBeginMatch();

            expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.BeginMatch, { id: iMatchMock.accessCode });
        });

        it('should call startTimer with right parameters', () => {
            matchPlayerServiceSpy.match = new Match(iMatchMock);

            socketServiceSpy.send.and.stub();

            const dialogRefMock = {
                afterClosed: () => of(true),
                close: () => true,
            } as unknown as MatDialogRef<TransitionDialogComponent>;

            matDialogSpy.open.and.returnValue(dialogRefMock);
            matDialogRefSpy.close.and.callFake(() => {
                return;
            });
            component.dialogRef = matDialogRefSpy;
            timeServiceSpy.startTimer.and.callFake(() => {
                return;
            });
            component.onBeginMatch();
            const [time, accessCode, callback] = timeServiceSpy.startTimer.calls.mostRecent().args;

            expect(time).toEqual(TRANSITIONS_DURATIONS.startOfTheGame);
            expect(accessCode).toEqual(iMatchMock.accessCode);
            expect(typeof callback).toBe('function');
            callback();
            expect(matchPlayerServiceSpy.router.navigateByUrl).toHaveBeenCalledWith(`/play/manager/match/${iMatchMock.game.id}`);
        });
    });

    describe('connect', () => {
        it('should call setupListeners and connect method of socket service if socket is not alive', () => {
            socketServiceSpy.isSocketAlive.and.returnValue(false);
            socketServiceSpy.connect.and.callFake(() => {
                return;
            });
            const setupListenersSpy = spyOn(component, 'setupListeners').and.callFake(() => {
                return;
            });
            component.connect();
            expect(socketServiceSpy.connect).toHaveBeenCalled();
            expect(setupListenersSpy).toHaveBeenCalled();
        });

        it('should not call setupListeners and connect method of socket service if socket is alive', () => {
            socketServiceSpy.isSocketAlive.and.returnValue(true);
            const setupListenersSpy = spyOn(component, 'setupListeners').and.callFake(() => {
                return;
            });
            component.connect();
            expect(socketServiceSpy.connect).not.toHaveBeenCalled();
            expect(setupListenersSpy).not.toHaveBeenCalled();
        });
    });

    describe('setupListeners', () => {
        it('should call setManagerWaitingRoomListeners of listenerManager service', () => {
            listenerManagerSpy.setManagerWaitingRoomListeners.and.stub();
            expect(listenerManagerSpy.setManagerWaitingRoomListeners).toHaveBeenCalled();
        });
    });
});
