import { ChatRoomMessage } from '@app/interfaces/chat-interfaces/chatroom-message';

export interface OldMessages {
    chatRoomName: string;
    messages: ChatRoomMessage[];
}
