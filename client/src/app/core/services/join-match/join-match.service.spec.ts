import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAX_PLAYER_NAME_LENGTH } from '@app/core/constants/constants';
import { MatchCommunicationService } from '@app/core/http/services/match-communication/match-communication.service';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { of } from 'rxjs';
import { JoinMatchService } from './join-match.service';

describe('JoinMatchService', () => {
    let service: JoinMatchService;
    let spyMatchCommunicationService: jasmine.SpyObj<MatchCommunicationService>;
    let socketServiceMock: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        spyMatchCommunicationService = jasmine.createSpyObj('MatchCommunicationService', [
            'isValidAccessCode',
            'isMatchAccessible',
            'validatePlayerName',
        ]);
        socketServiceMock = jasmine.createSpyObj('SocketService', ['send']);
        TestBed.configureTestingModule({
            providers: [
                { provide: MatchCommunicationService, useValue: spyMatchCommunicationService },
                { provide: SocketService, useValue: socketServiceMock },
            ],
        });
        service = TestBed.inject(JoinMatchService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('containsOnlySpaces should return true for string with only space', () => {
        service.input = '       ';
        expect(service.containsOnlySpaces()).toEqual(true);
    });

    it('isValidAccessCode should call method of communication service with right parameter', () => {
        spyMatchCommunicationService.isValidAccessCode.and.returnValue(of(true));
        const parameter = 'testAccessCode';
        service.input = '';
        service.accessCode = parameter;
        service.isValidAccessCode().subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(spyMatchCommunicationService.isValidAccessCode).toHaveBeenCalledWith(parameter);
    });

    it('isValidAccessCode should return false if input field contains only space', () => {
        spyMatchCommunicationService.isValidAccessCode.and.returnValue(of(true));
        service.input = '   ';
        service.isValidAccessCode().subscribe((result) => {
            expect(result).toBe(false);
        });
    });

    it('isValidAccessCode should call method of communication service with right parameter', () => {
        spyMatchCommunicationService.isValidAccessCode.and.returnValue(of(true));
        const parameter = 'testInput';
        service.accessCode = '';
        service.input = parameter;
        service.isValidAccessCode().subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(spyMatchCommunicationService.isValidAccessCode).toHaveBeenCalledWith(parameter);
    });

    it('isMatchAccessible should call method of communication service', () => {
        spyMatchCommunicationService.isMatchAccessible.and.returnValue(of(true));

        service.isMatchAccessible().subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(spyMatchCommunicationService.isMatchAccessible).toHaveBeenCalled();
    });

    it('validatePlayerName should call method of communication service', () => {
        service.input = 'test';
        spyMatchCommunicationService.validatePlayerName.and.returnValue(of(true));

        service.validatePlayerName().subscribe((result) => {
            expect(result).toBe(true);
        });

        expect(spyMatchCommunicationService.validatePlayerName).toHaveBeenCalled();
    });

    it('should return false if input is empty', fakeAsync(() => {
        service.input = '';
        let result: boolean | undefined;

        service.validatePlayerName().subscribe((res) => {
            result = res;
        });

        tick();
        expect(result).toBeFalse();
    }));

    it('should return false if input contains only spaces', fakeAsync(() => {
        service.input = '     '; // Multiple spaces
        let result: boolean | undefined;

        service.validatePlayerName().subscribe((res) => {
            result = res;
        });

        tick();
        expect(result).toBeFalse();
    }));

    it('should return false if input length exceeds the maximum allowed length', fakeAsync(() => {
        service.input = 'a'.repeat(MAX_PLAYER_NAME_LENGTH + 1); // Input exceeds the limit
        let result: boolean | undefined;

        service.validatePlayerName().subscribe((res) => {
            result = res;
        });

        tick();
        expect(result).toBeFalse();
    }));

    it('removeSpace should remove all space a the beginning and at the en of input field', () => {
        service.input = '   test    ';
        const expectResult = service.input.trim();
        service.removeSpace();
        expect(service.input).toEqual(expectResult);
    });

    it('joinMatchRoom should send a socket message to join the match room', () => {
        const accessCode = '12345';
        const playerName = 'playerName';
        service.accessCode = accessCode;
        service.playerName = playerName;

        service.joinMatchRoom();

        expect(socketServiceMock.send).toHaveBeenCalledWith('joinMatchRoom', { roomId: accessCode, name: playerName });
    });

    it('clearInput should reset input variable', () => {
        service.clearInput();
        expect(service.input).toEqual('');
    });
});
