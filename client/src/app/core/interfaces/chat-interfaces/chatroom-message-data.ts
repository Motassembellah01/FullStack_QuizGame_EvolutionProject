import { ChatRoomMessage } from '@app/core/interfaces/chat-interfaces/chatroom-message';

/** Interface to represent a message in the chat
 * chatRoomName is also used as the room id. */
export interface ChatRoomMessageData {
    chatRoomName: string;
    data: ChatRoomMessage;
}
