import { ChatRoomManager } from '@app/classes/chatroom-manager/chatroom-manager';
import { RedisClient } from '@app/classes/redis-client/redis-client';
import { ChatRoomType, ChatSocketsEmitEvents, ChatSocketsSubscribeEvents } from '@app/constants/constants';
import { ChatRoom } from '@app/interfaces/chat-interfaces/chatroom';
import { ChatRoomInfo } from '@app/interfaces/chat-interfaces/chatroom-info';
import { ChatRoomMessageData } from '@app/interfaces/chat-interfaces/chatroom-message-data';
import { SocketToUser } from '@app/interfaces/socket-to-user';
import { ChatRoomService } from '@app/services/chatroom/chatroom.service';
import { SessionService } from '@app/services/session/session.service';
import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatSocketHandler implements OnGatewayDisconnect, OnGatewayConnection {
    @WebSocketServer()
    server: Server;
    chatRoomManager: ChatRoomManager;
    connectedClients: SocketToUser[] = [];
    windowedClients: SocketToUser[] = [];

    constructor(
        private sessionService: SessionService,
        private logger: Logger,
        private redisClient: RedisClient,
        private chatRoomService: ChatRoomService,
    ) {
        this.chatRoomManager = new ChatRoomManager(this.redisClient, this.chatRoomService, this.logger);
    }

    @SubscribeMessage(ChatSocketsSubscribeEvents.CreateChatRoom)
    addChatRoom(@ConnectedSocket() client: Socket, @MessageBody() chatRoomInfo: ChatRoomInfo): void {
        console.log('Create room: ');
        console.log(chatRoomInfo);
        if (typeof chatRoomInfo === 'string') {
            chatRoomInfo = JSON.parse(chatRoomInfo) as ChatRoomInfo;
        }
        let clientId = this.connectedClients.find((c) => c.socketId === client.id);
        if (!clientId) {
            clientId = this.windowedClients.find((c) => c.socketId === client.id);
        }
        this.chatRoomManager.createRoom(client, chatRoomInfo, clientId.userId);
        this.logger.log('Create room: ' + chatRoomInfo.chatRoomName);
        if (chatRoomInfo.chatRoomType === ChatRoomType.Public) this.server.emit(ChatSocketsEmitEvents.NewChatRoom, chatRoomInfo.chatRoomName);
        const newChatRoom: ChatRoom = {
            chatRoomName: chatRoomInfo.chatRoomName,
            chatRoomType: chatRoomInfo.chatRoomType,
            owner: clientId.userId,
            messages: [],
            players: [clientId.userId],
        };
        client.emit(ChatSocketsEmitEvents.ChatJoined, newChatRoom);
    }

    @SubscribeMessage(ChatSocketsSubscribeEvents.DeleteChatRoom)
    async deleteChatRoom(@ConnectedSocket() client: Socket, @MessageBody() chatRoomName: string): Promise<void> {
        await this.chatRoomManager.deleteRoom(chatRoomName);
        this.server.emit(ChatSocketsEmitEvents.ChatClosed, chatRoomName);
    }

    @SubscribeMessage(ChatSocketsSubscribeEvents.JoinChatRoom)
    async joinChatRoom(@ConnectedSocket() client: Socket, @MessageBody() roomName: string): Promise<void> {
        console.log('Attempt to Join');
        let clientId = this.connectedClients.find((c) => c.socketId === client.id);
        if (!clientId) {
            clientId = this.windowedClients.find((c) => c.socketId === client.id);
        }
        await this.chatRoomManager.joinRoom(client, roomName, clientId.userId);
        // Update the player list for the players
        const chatRoom = await this.chatRoomService.findByRoomName(roomName); // For Public/General Only.
        if (!chatRoom) return; // Deal with not finding the room. TODO : Add a proper error on the client side.
        console.log('chatRoom');
        console.log(chatRoom);
        client.emit(ChatSocketsEmitEvents.ChatJoined, chatRoom); // We also need to do for matches
    }

    @SubscribeMessage(ChatSocketsSubscribeEvents.LeaveChatRoom)
    async leaveChatRoom(@ConnectedSocket() client: Socket, @MessageBody() chatRoomName: string): Promise<void> {
        let clientId = this.connectedClients.find((c) => c.socketId === client.id);
        if (!clientId) {
            clientId = this.windowedClients.find((c) => c.socketId === client.id);
        }
        const channelName: string | null = await this.chatRoomManager.leaveRoom(client, chatRoomName, clientId.userId);
        client.emit(ChatSocketsEmitEvents.ChatLeft, channelName);
    }

    @SubscribeMessage(ChatSocketsSubscribeEvents.SendMessage)
    async sendChatMessage(@MessageBody() msg: ChatRoomMessageData | string): Promise<void> {
        console.log(msg);
        if (typeof msg === 'string') {
            msg = JSON.parse(msg) as ChatRoomMessageData;
        }
        this.server.to(msg.chatRoomName).emit(ChatSocketsEmitEvents.ChatMessage, msg);
        await this.chatRoomManager.addMessage(msg);
    }

    @SubscribeMessage(ChatSocketsSubscribeEvents.GetChannels)
    async getChannels(@ConnectedSocket() client: Socket): Promise<void> {
        const chatRooms = await this.chatRoomManager.getRoomsPublic();
        const joinedChatRooms: ChatRoom[] = [];
        const channels: string[] = [];

        let clientId = this.connectedClients.find((c) => c.socketId === client.id);
        if (!clientId) clientId = this.windowedClients.find((c) => c.socketId === client.id);
        chatRooms.forEach((chatRoom: ChatRoom) => {
            if (chatRoom.players.some((player) => player === clientId.userId)) {
                joinedChatRooms.push(chatRoom);
                client.join(chatRoom.chatRoomName);
            }
            channels.push(chatRoom.chatRoomName);
        });
        const rooms = { joinedRooms: joinedChatRooms, channels };
        client.emit(ChatSocketsEmitEvents.ChatRoomList, rooms);
    }

    @SubscribeMessage(ChatSocketsSubscribeEvents.UserInfo)
    async getUserInfo(@ConnectedSocket() client: Socket, @MessageBody() userId: string): Promise<void> {
        if (!this.connectedClients.find((c) => c.userId === userId)) {
            this.connectedClients.push({ userId, socketId: client.id });
            this.logger.log('User id : ' + userId + ', client Id : ' + client.id);
        } else {
            this.windowedClients.push({ userId, socketId: client.id });
            this.logger.log('Windowed for User id : ' + userId + ', client Id : ' + client.id);
        }
        await this.chatRoomManager.joinRoom(client, 'general', userId);
        const chatRoom = await this.chatRoomManager.getRoom('general');
        client.emit(ChatSocketsEmitEvents.ChatJoined, chatRoom);
        this.getChannels(client);
    }

    handleDisconnect(@ConnectedSocket() client: Socket): void {
        this.logger.log('disconnecting client');
        const clientId = this.connectedClients.find((c) => c.socketId === client.id);
        if (!clientId) {
            this.windowedClients = this.windowedClients.filter((c) => c.socketId !== client.id);
        } else {
            this.sessionService.logoutSession(clientId?.userId);
            this.connectedClients = this.connectedClients.filter((c) => c.socketId !== client.id);
            this.windowedClients = this.windowedClients.filter((c) => c.userId !== clientId.userId);
        }
    }

    async handleConnection(@ConnectedSocket() client: Socket): Promise<void> {
        this.logger.log('Client "' + client.id + '" connected');
    }
}
