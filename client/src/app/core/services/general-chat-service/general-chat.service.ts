import { EventEmitter, Injectable } from '@angular/core';
import { ChatSocketsEmitEvents, ChatSocketsSubscribeEvents } from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { ChatRoomMessage } from '@app/core/interfaces/chat-interfaces/chatroom-message';
import { ChatRoomMessageData } from '@app/core/interfaces/chat-interfaces/chatroom-message-data';
import { JoinedChatroom } from '@app/core/interfaces/chat-interfaces/joined-chatroom';
import { MappedMessages } from '@app/core/interfaces/chat-interfaces/mapped-messages';
import { OldMessages } from '@app/core/interfaces/chat-interfaces/old-messages';
import { ChatRoomInfo } from '@app/core/interfaces/chatroom-info';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GeneralChatService {
    scrollToBottomEvent: EventEmitter<void> = new EventEmitter<void>();
    isChatOpen = false;
    currentChannel: JoinedChatroom | null = null;
    channels: string[] = [];
    joinedChannels: JoinedChatroom[] = [];
    isTyping: boolean = false;
    hasJustSentMessage: boolean = false;
    isChatClosed: boolean = false;
    mappedMessages: MappedMessages[] = [];
    // TODO: créer un service pour ces variables !!!!
    isProfileOpen: boolean = false;
    isFriendsOpen: boolean = false;
    isShopOpen: boolean = false;
    isSettingsOpen: boolean = false;
    private channelsSubject = new BehaviorSubject<string[]>(this.channels);
    private joinedChannelsSubject = new BehaviorSubject<JoinedChatroom[]>(this.joinedChannels);

    constructor(
        public socketService: SocketService,
        private accountService: AccountService,
    ) {
        socketService.connect();
        this.setupListeners(); // Set up socket listeners in the constructor
    }

    get channels$() {
        return this.channelsSubject.asObservable();
    }

    get joinedChannels$() {
        return this.joinedChannelsSubject.asObservable();
    }
    getChannels() {
        this.socketService.send(ChatSocketsEmitEvents.GetChannels);
    }

    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        if (!this.isChatOpen) {
            this.currentChannel = null;
        }
    }

    sendMessage(msg: ChatRoomMessageData) {
        this.socketService.send(ChatSocketsEmitEvents.SendMessage, msg);
    }

    async selectChannel(channel: JoinedChatroom): Promise<void> {
        this.currentChannel = channel;
        this.mappedMessages = [];
        if (channel.messages.length === 0) {
            return;
        }

        const userIds = channel.messages.map((msg) => msg.message.userId);

        try {
            const accounts = await this.accountService.getSomeAccounts(userIds).toPromise();

            const accountMap = new Map(accounts?.map((account) => [account.userId, account]));

            channel.messages.forEach((msg) => {
                if (!msg.read) {
                    msg.read = true;
                }

                const account = accountMap.get(msg.message.userId);
                if (account) {
                    this.mappedMessages.push({
                        playerName: account.pseudonym,
                        data: msg.message.data,
                        time: msg.message.time,
                        avatarUrl: this.accountService.getLocalAvatar(account.avatarUrl),
                        userId: msg.message.userId,
                        read: msg.read,
                    });
                }
            });

            this.mappedMessages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            this.scrollToBottomEvent.emit();
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    }

    getUnreadMessageCount(chatroom: JoinedChatroom): number {
        return chatroom ? chatroom.messages.filter((msg) => !msg.read).length : 0;
    }

    backToChannels() {
        this.currentChannel = null;
    }

    addMessageToChannel(msg: ChatRoomMessageData) {
        const channel = this.joinedChannels.find((c) => c.chatRoomName === msg.chatRoomName);
        if (channel) {
            this.addMessage(channel, msg.data);
        }
    }

    addMessage(channel: JoinedChatroom, msg: ChatRoomMessage) {
        channel.messages.push({ message: msg, read: this.currentChannel === channel });
        if (this.currentChannel === channel) {
            this.accountService.getAccount(msg.userId).subscribe((account) => {
                this.mappedMessages.push({
                    playerName: account.pseudonym,
                    data: msg.data,
                    time: msg.time,
                    avatarUrl: this.accountService.getLocalAvatar(account.avatarUrl),
                    userId: msg.userId,
                    read: true,
                });
                this.scrollToBottomEvent.emit();
            });
        }

        this.channelsSubject.next(this.channels); // Notify subscribers
    }

    setUpChannels(channels: { joinedRooms: any[]; channels: string[] }) {
        console.log(channels);
        this.channels = channels.channels;
        this.joinedChannels = [];
        for (const channel of channels.joinedRooms) {
            const joinedChannel: JoinedChatroom = {
                chatRoomName: channel.chatRoomName,
                messages: channel.messages.map((message: ChatRoomMessage) => ({ message, read: false })),
                chatRoomType: channel.chatRoomType,
                owner: channel.owner,
                players: channel.players,
            };
            this.joinedChannels.push(joinedChannel);
        }
        this.channelsSubject.next(this.channels); // Notify
        this.joinedChannelsSubject.next(this.joinedChannels);
    }

    removeChannel(channelName: string) {
        this.joinedChannels = this.joinedChannels.filter((c) => c.chatRoomName !== channelName);
        this.channels = this.channels.filter((c) => c !== channelName);
        this.socketService.send(ChatSocketsEmitEvents.LeaveChatRoom, channelName);
        this.channelsSubject.next(this.channels);
        this.joinedChannelsSubject.next(this.joinedChannels);
    }

    addChannel(channel: string) {
        this.channels.push(channel);
        this.channelsSubject.next(this.channels); // Notify subscribers
    }

    joinChannel(chatRoomName: string) {
        console.log('joinChannel Called with: ' + chatRoomName);
        this.socketService.send(ChatSocketsEmitEvents.JoinChatRoom, chatRoomName);
        this.channelsSubject.next(this.channels); // Notify
        this.joinedChannelsSubject.next(this.joinedChannels);
    }

    createChannel(chatRoomInfo: ChatRoomInfo) {
        console.log('Creating channel: ' + chatRoomInfo.chatRoomName);
        this.socketService.send(ChatSocketsEmitEvents.CreateChatRoom, chatRoomInfo);
    }

    removeListeners() {
        this.socketService.removeListener(ChatSocketsSubscribeEvents.NewChatRoom);
        this.socketService.removeListener(ChatSocketsSubscribeEvents.ChatClosed);
        this.socketService.removeListener(ChatSocketsSubscribeEvents.ChatJoined);
        this.socketService.removeListener(ChatSocketsSubscribeEvents.ChatLeft);
        this.socketService.removeListener(ChatSocketsSubscribeEvents.ChatMessage);
        this.socketService.removeListener(ChatSocketsSubscribeEvents.SendOldMessages);
        this.socketService.removeListener(ChatSocketsSubscribeEvents.ChatRoomList);
    }

    private setupListeners() {
        this.socketService.on<string>(ChatSocketsSubscribeEvents.NewChatRoom, (chatRoomName: string) => {
            this.addChannel(chatRoomName);
        });

        this.socketService.on<string>(ChatSocketsSubscribeEvents.ChatClosed, (chatRoomName: string) => {
            this.removeChannel(chatRoomName);
        });

        this.socketService.on<any>(ChatSocketsSubscribeEvents.ChatJoined, (chatroom) => {
            console.log('joinedChannels : ');
            console.log(this.joinedChannels);
            console.log(chatroom);
            const joinedChannel: JoinedChatroom = {
                chatRoomName: chatroom.chatRoomName,
                messages: chatroom.messages.map((message: ChatRoomMessage) => ({ message, read: false })),
                chatRoomType: chatroom.chatRoomType,
                owner: chatroom.owner,
                players: chatroom.players,
            };
            this.joinedChannels.push(joinedChannel);
            this.channelsSubject.next(this.channels);
            this.joinedChannelsSubject.next(this.joinedChannels);
            console.log('The joined channels are : ');
            console.log(this.joinedChannels);
        });

        this.socketService.on<string>(ChatSocketsSubscribeEvents.ChatLeft, (chatRoomName: string | null) => {
            if (chatRoomName !== null) {
                this.channels.push(chatRoomName);
                this.channelsSubject.next(this.channels);
            }
        });

        this.socketService.on<ChatRoomMessageData>(ChatSocketsSubscribeEvents.ChatMessage, (msg: ChatRoomMessageData) => {
            this.addMessageToChannel(msg);
            this.hasJustSentMessage = true;
        });

        this.socketService.on<OldMessages>(ChatSocketsSubscribeEvents.SendOldMessages, (msg: OldMessages) => {
            const chatRoom = this.joinedChannels.find((channel) => channel.chatRoomName === msg.chatRoomName);
            if (chatRoom) {
                const messageInfo = msg.messages.map((m) => ({ message: m, read: false }));
                chatRoom.messages.unshift(...messageInfo);
            }
        });

        this.socketService.on<{ joinedRooms: any[]; channels: string[] }>(ChatSocketsSubscribeEvents.ChatRoomList, (msg) => {
            console.log('ChatRoomList : ');
            console.log(msg);
            this.setUpChannels(msg);
            console.log(this.channels);
        });
    }
}
