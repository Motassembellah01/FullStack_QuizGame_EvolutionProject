import { Account } from "@app/model/database/account";
import { FriendRequestDto } from "@app/model/dto/friend-request/friend-request-dto";
import { AccountService } from "@app/services/account/account.service";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import sr from "date-fns/locale/sr";
import { Server, Socket } from "socket.io";


@WebSocketGateway()
export class FriendHandlerGateway {
    @WebSocketServer()
    server: Server;
    private onlineUsers = new Map<string, string>();

    @SubscribeMessage('register')
    async handleRegister(@MessageBody() userId: string, @ConnectedSocket() client: Socket): Promise<void> {
        this.onlineUsers.set(userId, client.id);
        console.log(`User ${userId} registered with socket ${client.id}`);
        console.log("onlineUsers are", this.onlineUsers);
    }

    @SubscribeMessage('unregister')
    handleUnregister(@MessageBody() userId: string): void {
        if (this.onlineUsers.has(userId)){
            this.onlineUsers.delete(userId);
        }
        console.log(`User ${userId} unregistered`);
        console.log("onlineUsers are", this.onlineUsers);
    }

    updateFriendRequestSentList(senderId: string, friendsThatUserRequested: string[]): void {
        const socketIdSender = this.onlineUsers.get(senderId);
        if (socketIdSender) {
            this.server.to(socketIdSender).emit('friendsThatUserRequested', friendsThatUserRequested);
        }
    }

    updateFriendRequestsThatUserReceived(receiverId: string, friendRequestsBasicInfo: FriendRequestDto[]): void {
        const socketIdReceiver = this.onlineUsers.get(receiverId);
        if (socketIdReceiver) {
            this.server.to(socketIdReceiver).emit('friendRequestsThatUserReceived', friendRequestsBasicInfo);
        }
    }

    updateFriendListReceiver(receiverId: string, friendsReceiver: string[]): void {
        const socketIdReceiver = this.onlineUsers.get(receiverId);
        if (socketIdReceiver) {
            this.server.to(socketIdReceiver).emit('updateFriendListReceiver', friendsReceiver);
        }
    }

    updateFriendListSender(senderId: string, friendsSender: string[]): void {
        const socketIdSender = this.onlineUsers.get(senderId);
        if (socketIdSender) {
            this.server.to(socketIdSender).emit('updateFriendListSender', friendsSender);
        }
    }

    updateBlockedUsersList(userId: string, blockedUsers: string[]): void {
        const socketId = this.onlineUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('updateBlockedUsers', blockedUsers);
        }
    }

    updateBlockedByList(userId: string, blockedBy: string[]): void {
        const socketId = this.onlineUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('updateBlockedBy', blockedBy);
        }
    }
}