import { TestBed } from '@angular/core/testing';

import { SocketsOnEvents } from '@app/core/constants/constants';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let spySocketService: jasmine.SpyObj<SocketService>;

    let service: ChatService;

    beforeEach(() => {
        spySocketService = jasmine.createSpyObj('SocketService', ['on', 'send']);

        TestBed.configureTestingModule({
            providers: [{ provide: SocketService, useValue: spySocketService }],
        });
        service = TestBed.inject(ChatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should clean de messageList when cleanMessage is called', () => {
        service.cleanMessages();
        expect(service.messagesList).toEqual([]);
    });

    it('should send a message when send is called', () => {
        const message = { playerName: 'Name', matchAccessCode: 'Code', time: '00:00', data: 'data' };
        spySocketService.send.and.returnValue();
        service.send(message);
        expect(spySocketService.send).toHaveBeenCalled();
    });

    it('should push a message in the list when the message is received', () => {
        const msg = { playerName: 'Name', matchAccessCode: 'Code', time: '00:00', data: 'data' };
        service.messagesList = [];
        service.setupListeners();
        expect(spySocketService.on).toHaveBeenCalledWith(SocketsOnEvents.ChatMessage, jasmine.any(Function));
        const newMessageCallback = spySocketService.on.calls.argsFor(0)[1];
        newMessageCallback(msg);
        expect(service.messagesList.length).toEqual(1);
        expect(service.messagesList[0]).toEqual(msg);
    });
});
