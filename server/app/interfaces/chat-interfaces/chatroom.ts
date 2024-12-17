import { ChatRoomType } from '@app/constants/constants';
import { ChatRoomMessage } from '@app/interfaces/chat-interfaces/chatroom-message';

export interface ChatRoom {
    chatRoomName: string;
    chatRoomType: ChatRoomType;
    owner: 'general' | string;
    messages: ChatRoomMessage[];
    players: string[];
}
