import { ChatRoomType } from '@app/core/constants/constants';
import { ChatRoomMessage } from '@app/core/interfaces/chat-interfaces/chatroom-message';

export interface Channel {
    roomType: ChatRoomType;
    owner: 'general' | string;
    messages: ChatRoomMessage[];
    players: string[];
}
