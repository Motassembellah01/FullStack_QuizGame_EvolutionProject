import { ChatRoomMessage } from '@app/core/interfaces/chat-interfaces/chatroom-message';

export interface OldMessages {
    chatRoomName: string;
    messages: ChatRoomMessage[];
}
