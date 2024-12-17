import { ChatRoomType } from '@app/core/constants/constants';
import { ChatRoomMessage } from '@app/core/interfaces/chat-interfaces/chatroom-message';

export interface Chatroom {
    chatRoomName: string;
    chatRoomType: ChatRoomType;
    owner: 'general' | string;
    messages: ChatRoomMessage[];
    players: string[];
}
