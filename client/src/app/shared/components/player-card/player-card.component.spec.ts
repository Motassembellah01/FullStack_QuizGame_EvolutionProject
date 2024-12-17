import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocketsSendEvents } from '@app/core/constants/constants';
import { PlayerRequest } from '@app/core/interfaces/player-request';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { PlayerCardComponent } from './player-card.component';
import { CommonModule } from '@angular/common';

describe('PlayerCardComponent', () => {
    let component: PlayerCardComponent;
    let fixture: ComponentFixture<PlayerCardComponent>;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['send', 'on']);

        TestBed.configureTestingModule({
            declarations: [],
            imports: [PlayerCardComponent, CommonModule],
            providers: [
                { provide: SocketService, useValue: socketServiceSpy },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        fixture = TestBed.createComponent(PlayerCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('creation', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('excludePlayer', () => {
        it('should send a request to exclude a player', () => {
            const mockMatchAccessCode = '1234';
            const mockName = 'Test';

            component.accessCode = mockMatchAccessCode;
            component.player = { name: mockName, isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false };

            const mockData: PlayerRequest = {
                roomId: mockMatchAccessCode,
                name: mockName,
                hasPlayerLeft: false,
            };

            socketServiceSpy.send.and.callFake((event: string, data: unknown) => {
                expect(event).toEqual(SocketsSendEvents.RemovePlayer);
                expect(data).toEqual(mockData);
            });

            component.excludePlayer();

            expect(socketServiceSpy.send).toHaveBeenCalledWith(SocketsSendEvents.RemovePlayer, mockData);
        });
    });
});
