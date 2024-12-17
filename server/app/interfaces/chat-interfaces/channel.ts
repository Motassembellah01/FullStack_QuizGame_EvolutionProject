import { ChatRoomType } from '@app/constants/constants';
import { ChatRoomMessage } from '@app/interfaces/chat-interfaces/chatroom-message';

export interface Channel {
    roomType: ChatRoomType;
    owner: 'general' | string;
    messages: ChatRoomMessage[];
    players: string[];
}
