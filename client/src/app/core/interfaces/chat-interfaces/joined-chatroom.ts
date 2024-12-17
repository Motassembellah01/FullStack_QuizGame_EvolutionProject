import { ChatRoomType } from '@app/core/constants/constants';
import { ChatRoomMessage } from '@app/core/interfaces/chat-interfaces/chatroom-message';

export interface JoinedChatroom {
    chatRoomName: string;
    chatRoomType: ChatRoomType;
    owner: 'general' | string;
    messages: { message: ChatRoomMessage; read: boolean }[];
    players: string[];
}
