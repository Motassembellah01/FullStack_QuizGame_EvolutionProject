import { RedisClient } from '@app/classes/redis-client/redis-client';
import { ChatRoomType } from '@app/constants/constants';
import { ChatRoom } from '@app/interfaces/chat-interfaces/chatroom';
import { ChatRoomInfo } from '@app/interfaces/chat-interfaces/chatroom-info';
import { ChatRoomMessage } from '@app/interfaces/chat-interfaces/chatroom-message';
import { ChatRoomMessageData } from '@app/interfaces/chat-interfaces/chatroom-message-data';
import { ChatRoomDto } from '@app/model/dto/chatroom/chatroom';
import { ChatRoomService } from '@app/services/chatroom/chatroom.service';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

export class ChatRoomManager {
    chatRoomTypes: Map<string, ChatRoomType> = new Map();
    constructor(
        private redisClient: RedisClient,
        private chatRoomService: ChatRoomService,
        private logger: Logger,
    ) {
        this.initialize();
    }

    async getRoom(name: string): Promise<ChatRoom | null> {
        if (!this.chatRoomTypes.has(name)) {
            return null;
        }
        return this.chatRoomTypes.get(name) === ChatRoomType.Match ? await this.getRoomMatch(name) : await this.getRoomPublic(name);
    }

    async getRoomNamesPublic(): Promise<string[]> {
        const result = await this.chatRoomService.findAllRoomNames();
        return result.map((r) => r.chatRoomName);
    }

    async getRoomNamesMatch(): Promise<string[]> {
        return await this.redisClient.getKeys('chatroom');
    }

    async getRoomsPublic(): Promise<ChatRoom[]> {
        return await this.chatRoomService.findAllRoom();
    }

    async createRoom(player: Socket, chatRoomInfo: ChatRoomInfo, authId: string): Promise<void> {
        if (this.chatRoomTypes.has(chatRoomInfo.chatRoomName)) return;
        return this.chatRoomTypes.get(chatRoomInfo.chatRoomName) === ChatRoomType.Match
            ? this.createRoomMatch(player, chatRoomInfo, authId)
            : this.createRoomPublic(player, chatRoomInfo, authId);
    }

    async joinRoom(player: Socket, chatRoomName: string, authId: string): Promise<void> {
        if (!this.chatRoomTypes.has(chatRoomName)) return;
        return this.chatRoomTypes.get(chatRoomName) === ChatRoomType.Match
            ? await this.joinRoomMatch(player, chatRoomName, authId)
            : await this.joinRoomPublic(player, chatRoomName, authId);
    }

    async leaveRoom(player: Socket, chatRoomName: string, authId: string): Promise<string | null> {
        if (!this.chatRoomTypes.has(chatRoomName)) return;
        return this.chatRoomTypes.get(chatRoomName) === ChatRoomType.Match
            ? this.leaveRoomMatch(player, chatRoomName, authId)
            : this.leaveRoomPublic(player, chatRoomName, authId);
    }

    async getMessages(chatRoomName: string, index: number): Promise<ChatRoomMessage[]> {
        if (this.chatRoomTypes.get(chatRoomName) === null) return [];
        const chatRoom =
            this.chatRoomTypes.get(chatRoomName) === ChatRoomType.Match
                ? await this.getRoomMatch(chatRoomName)
                : await this.getRoomPublic(chatRoomName);

        if (chatRoom === undefined) {
            // Error
            return; // TODO : Handle it by sending a message back to the client
        }
        if (chatRoom === null) {
            // Not found
            return; // TODO : Handle it by sending a message back to the client
        }
        console.log(chatRoom.messages);

        return chatRoom.messages;
    }

    async addMessage(message: ChatRoomMessageData): Promise<void> {
        if (!this.chatRoomTypes.has(message.chatRoomName)) {
            console.log('Error while adding message in Public Chat : "' + message.chatRoomName + '"');
            console.log(this.chatRoomTypes);
            return;
        }
        return (await this.chatRoomTypes.get(message.chatRoomName)) === ChatRoomType.Match
            ? this.addMessageMatch(message)
            : this.addMessagePublic(message);
    }

    async deleteRoom(chatRoomName: string): Promise<void> {
        if (this.chatRoomTypes.has(chatRoomName)) return;
        const response =
            this.chatRoomTypes.get(chatRoomName) === ChatRoomType.Match
                ? await this.redisClient.delete(`chatroom:${chatRoomName}`)
                : await this.chatRoomService.delete(chatRoomName);
        this.logger.log('"' + chatRoomName + '" was deleted successfully with response : ' + response);
        this.chatRoomTypes.delete(chatRoomName);
    }

    private async initialize() {
        await this.redisClient.connectRedis();
        await this.redisClient.deleteAllElements('chatroom');
        if ((await this.chatRoomService.findByRoomName('general')) === null) {
            this.logger.log('Creating default chatroom "general"');
            const generalChatRoom: ChatRoomDto = {
                chatRoomName: 'general',
                chatRoomType: ChatRoomType.General,
                owner: 'chatroom:general',
                messages: [],
                players: [],
            };
            await this.chatRoomService.create(generalChatRoom);
        }

        this.chatRoomTypes.set('general', ChatRoomType.General);
        const rooms = await this.chatRoomService.findAllRoom();
        rooms.forEach((room) => {
            this.chatRoomTypes.set(room.chatRoomName, room.chatRoomType);
        });
        console.log('RoomTypes : ');
        console.log(this.chatRoomTypes);
    }

    private async getRoomMatch(name: string): Promise<ChatRoom | null> {
        const roomJSON = await this.redisClient.get('chatroom:' + name.trim());
        const room: ChatRoom = JSON.parse(roomJSON);
        return room;
    }

    private async getRoomPublic(name: string): Promise<ChatRoom | null> {
        const room = await this.chatRoomService.findByRoomName(name.trim());
        return room;
    }

    private async createRoomMatch(player: Socket, chatRoomInfo: ChatRoomInfo, playerId: string): Promise<void> {
        const chatRoom: ChatRoom = {
            chatRoomName: chatRoomInfo.chatRoomName,
            chatRoomType: chatRoomInfo.chatRoomType,
            owner: 'player:' + playerId,
            messages: [],
            players: [playerId],
        };
        await this.redisClient.set<ChatRoom>(`chatroom:${chatRoom.chatRoomName}`, JSON.stringify(chatRoom));
        this.joinRoomMatch(player, chatRoomInfo.chatRoomName, playerId); // TODO : Change for the owner of the room.
    }

    private async createRoomPublic(player: Socket, chatRoomInfo: ChatRoomInfo, playerId: string): Promise<void> {
        if (this.chatRoomTypes.has(chatRoomInfo.chatRoomName)) {
            // TODO : Handle it by sending a message back to the client
            return;
        }
        const chatRoom: ChatRoom = {
            chatRoomName: chatRoomInfo.chatRoomName,
            chatRoomType: chatRoomInfo.chatRoomType,
            owner: 'player:' + playerId,
            messages: [],
            players: [playerId],
        };
        await this.chatRoomService.create(chatRoom);
        this.chatRoomTypes.set(chatRoom.chatRoomName, chatRoom.chatRoomType);
        await this.joinRoomPublic(player, chatRoomInfo.chatRoomName, playerId);
    }

    private async joinRoomMatch(player: Socket, chatRoomName: string, playerId: string): Promise<void> {
        const chatRoom = await this.getRoomMatch(chatRoomName);
        console.log(chatRoom);
        if (chatRoom === undefined) {
            // Request had an error : TODO : Handle it by sending a message back to the client
            this.logger.log('Error while "' + playerId + '" tried joining the room "' + chatRoomName + '"');
            return;
        }
        if (chatRoom === null) {
            // Room does not exist : TODO : Handle it by sending a message back to the client
            this.logger.log('"' + playerId + '" tried to join the non-existent room "' + chatRoomName + '"');
            return;
        }
        chatRoom.players.push(playerId);
        await this.redisClient.set(`chatroom:${chatRoomName}`, JSON.stringify(chatRoom));
        player.join(chatRoomName);
        this.logger.log('"' + playerId + '" joined the room "' + chatRoomName + '" successfully');
    }

    private async joinRoomPublic(player: Socket, chatRoomName: string, playerId: string): Promise<void> {
        const chatRoom: ChatRoom | null = await this.getRoomPublic(chatRoomName);

        if (chatRoom === null) {
            // TODO: Handle it by sending a message back to the client
            return;
        }
        if (chatRoom.players.includes(playerId)) {
            player.join(chatRoomName);
            console.log('player already in room');
            return;
        }
        const updateData: Partial<ChatRoomDto> = {
            players: [...chatRoom.players, playerId],
        };
        await this.chatRoomService.update(chatRoomName, updateData, chatRoom);

        player.join(chatRoomName);
        this.logger.log(`"${playerId}" joined the room "${chatRoomName}" successfully`);
    }

    private async leaveRoomMatch(player: Socket, chatRoomName: string, playerId: string): Promise<string | null> {
        const chatRoom = await this.getRoomMatch(chatRoomName);
        if (chatRoom === undefined) {
            // Request had an error : TODO : Handle it by sending a message back to the client
            this.logger.log('Error while "' + playerId + '" tried leaving the room "' + chatRoomName + '"');
            return;
        }
        if (chatRoom === null) {
            // Room does not exist : TODO : Handle it by sending a message back to the client
            this.logger.log('"' + playerId + '" tried to leave the non-existent room "' + chatRoomName + '"');
            return;
        }
        chatRoom.players = chatRoom.players.filter((p) => p !== playerId);
        if (playerId === chatRoom.owner) {
            if (chatRoom.players.length > 0) {
                chatRoom.owner = chatRoom.players[0];
            } else {
                await this.deleteRoom(chatRoomName);
                player.leave(chatRoomName);
                return null;
            }
        }
        await this.redisClient.set(`chatroom:${chatRoomName}`, JSON.stringify(chatRoom));
        player.leave(chatRoomName);
        this.logger.log('"' + playerId + '" left the room "' + chatRoomName + '" successfully');
        return chatRoomName;
    }

    private async leaveRoomPublic(player: Socket, chatRoomName: string, playerId: string): Promise<string | null> {
        const chatRoom = await this.getRoomPublic(chatRoomName);

        if (chatRoom === null || chatRoom.chatRoomType === ChatRoomType.General) {
            console.log('Error while "' + playerId + '" tried leaving the room "' + chatRoomName + '"');
            return;
        }
        const newPlayers = chatRoom.players.filter((p) => p !== playerId);

        let newOwner: string | undefined;

        console.log(playerId + ' : ' + chatRoom.owner);
        if ('player:' + playerId === chatRoom.owner) {
            console.log('Was owner');
            if (newPlayers.length > 0) {
                newOwner = newPlayers[0];
                console.log('new owner : ' + newOwner);
            } else {
                await this.chatRoomService.delete(chatRoomName);
                this.chatRoomTypes.delete(chatRoomName);
                player.leave(chatRoomName);
                console.log('deleted room');
                return null;
            }
        }

        console.log('Left room : ' + chatRoomName);

        const updateData: Partial<ChatRoomDto> = { players: newPlayers };
        if (newOwner) {
            updateData.owner = newOwner;
        }

        await this.chatRoomService.update(chatRoomName, updateData, chatRoom);
        player.leave(chatRoomName);
        return chatRoomName;
    }

    private async addMessageMatch(message: ChatRoomMessageData): Promise<void> {
        const chatRoomName = message.chatRoomName;
        const chatRoom = await this.getRoomMatch(chatRoomName);
        if (chatRoom === undefined) {
            // Error
            return; // TODO : Handle it by sending a message back to the client
        }
        if (chatRoom === null) {
            // Not found
            return; // TODO : Handle it by sending a message back to the client
        }
        chatRoom.messages.push(message.data);
        await this.redisClient.set(`chatroom:${chatRoomName}`, JSON.stringify(chatRoom));
        this.logger.log('A message was sent in the room "' + chatRoomName + '" successfully');
        return;
    }

    private async addMessagePublic(message: ChatRoomMessageData): Promise<void> {
        console.log('chatRoom');
        const chatRoom = await this.chatRoomService.findByRoomName(message.chatRoomName);
        console.log(chatRoom);
        if (chatRoom === undefined) {
            // Error
            this.logger.log('Error while adding message in Public Chat : "' + message.chatRoomName + '"');
            return; // TODO : Handle it by sending a message back to the client
        }
        if (chatRoom === null) {
            this.logger.log('Public Chat : "' + message.chatRoomName + '" does not exist.');
            return; // TODO : Handle it by sending a message back to the client
        }
        if (chatRoom) {
            await this.chatRoomService.addMessage(message.chatRoomName, message.data);
        }
    }
}
