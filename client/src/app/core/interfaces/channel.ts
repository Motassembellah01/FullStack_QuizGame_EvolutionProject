import { ChatRoomMessage } from '@app/core/interfaces/chat-interfaces/chatroom-message';

export interface Channel {
    name: string;
    messages: { message: ChatRoomMessage; read: boolean }[];
}
