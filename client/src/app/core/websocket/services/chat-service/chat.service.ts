import { Injectable } from '@angular/core';
import { SocketsOnEvents, SocketsSendEvents } from '@app/core/constants/constants';
import { Message } from '@app/core/interfaces/message';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';

/**
 * This class allows to handle the business logic for the chat through all the components
 * where he is used.
 */
@Injectable({
    providedIn: 'root',
})
export class ChatService {
    messagesList: Message[] = [];
    hasJustSentMessage: boolean = false;
    isChatAccessible: boolean = true;

    constructor(private socketService: SocketService) {}

    send(msg: Message): void {
        if (this.isChatAccessible) this.socketService.send<Message>(SocketsSendEvents.SendMessage, msg);
    }

    setupListeners(): void {
        this.socketService.on<Message>(SocketsOnEvents.ChatMessage, (msg) => {
            this.messagesList.push(msg);
            this.hasJustSentMessage = true;
        });
    }

    cleanMessages(): void {
        this.messagesList = [];
    }
}
