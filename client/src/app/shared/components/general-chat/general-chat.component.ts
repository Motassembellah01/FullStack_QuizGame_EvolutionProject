import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ChatRoomType } from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { ChatRoomMessageData } from '@app/core/interfaces/chat-interfaces/chatroom-message-data';
import { JoinedChatroom } from '@app/core/interfaces/chat-interfaces/joined-chatroom';
import { AccountListenerService } from '@app/core/services/account-listener/account-listener.service';
import { GeneralChatService } from '@app/core/services/general-chat-service/general-chat.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatMessageComponent } from '@app/shared/components/chat-message/chat-message.component';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-general-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, ChatMessageComponent, MatFormFieldModule, AppMaterialModule, TranslateModule],
    templateUrl: './general-chat.component.html',
    styleUrls: ['./general-chat.component.scss'],
})
export class GeneralChatComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('chatZone') chatZone: ElementRef;
    @Input() sendEvent: EventEmitter<void>;
    isChannelOpen: boolean = false;
    isAddOpen: boolean = false;
    isModifyOpen: boolean = false;
    isSearchOpen: boolean = false;
    newChannelName: string = '';
    newMessage: string = ''; // Property for new message input
    channels: string[] = [];
    joinedChatRooms: JoinedChatroom[];
    searchTerm: string = '';
    filteredChannels: string[] = [];

    private messageSubscription: Subscription = new Subscription();
    private joinedChannelsSubscription: Subscription = new Subscription();

    constructor(
        public generalChatService: GeneralChatService,
        private timeService: TimeService,
        public accountService: AccountService,
        public accountListenerService: AccountListenerService
    ) {}

    @HostListener('document:keydown.enter', ['$event'])
    onEntryKey(event: KeyboardEvent): void {
        if (this.generalChatService.isTyping)
            if (event.key === 'Enter') {
                event.preventDefault();
                this.sendMessage();
            }
    }

    ngOnInit(): void {
        this.generalChatService.scrollToBottomEvent.subscribe(() => {
            this.scrollToBottom();
        });
        this.messageSubscription = this.generalChatService.channels$.subscribe((channels) => {
            this.channels = channels;
        });
        this.joinedChannelsSubscription = this.generalChatService.joinedChannels$.subscribe((c: JoinedChatroom[]) => (this.joinedChatRooms = c));
        this.generalChatService.isTyping = false;
        if (this.sendEvent) {
            this.sendEvent.subscribe((event: KeyboardEvent) => {
                this.onEntryKey(event);
            });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isChat: boolean = (window as any).chatAPI?.isChatProcess();
        if (!isChat) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).electronAPI.isChatClosed(() => {
                this.generalChatService.isChatClosed = false;
                this.generalChatService.isChatOpen = true;
            });
        }
    }

    isBlocked(userId: string): boolean {
        return this.accountListenerService.blocked.includes(userId);
    }

    isBlockedByHim(userId: string): boolean {
        return this.accountListenerService.UsersBlockingMe.includes(userId);
    }

    ngAfterViewChecked(): void {
        if (this.generalChatService.hasJustSentMessage) {
            this.scrollToBottom();
            this.generalChatService.hasJustSentMessage = false;
        }
    }

    ngOnDestroy(): void {
        this.messageSubscription.unsubscribe();
        this.joinedChannelsSubscription.unsubscribe();
    }

    changeTypingState(): void {
        this.generalChatService.isTyping = !this.generalChatService.isTyping;
    }

    toggleChat() {
        this.generalChatService.isChatOpen = !this.generalChatService.isChatOpen;
        if (!this.generalChatService.isChatOpen) this.backToChannels();
    }

    toggleAddChannel() {
        this.isAddOpen = !this.isAddOpen;
        this.isModifyOpen = false;
        this.isSearchOpen = false;
    }

    toggleModifyChannel() {
        this.isModifyOpen = !this.isModifyOpen;
        this.isAddOpen = false;
        this.isSearchOpen = false;
    }

    toggleSearchChannel() {
        this.isSearchOpen = !this.isSearchOpen;
        this.isModifyOpen = false;
        this.isAddOpen = false;
        this.searchTerm = '';
        this.filteredChannels = [...this.channels];
    }

    async selectChannel(channel: JoinedChatroom) {
        this.generalChatService.currentChannel = channel;
        await this.generalChatService.selectChannel(channel);
        this.isChannelOpen = !this.isChannelOpen;
        this.scrollToBottom();
    }

    onSearch(): void {
        this.filteredChannels = [...this.channels];

        if (this.searchTerm) {
            this.filteredChannels = this.filteredChannels.filter((channel) => channel.includes(this.searchTerm));
        }
    }

    getUnreadMessageCount(channel: JoinedChatroom): number {
        if (this.accountService.account.pseudonym) return this.generalChatService.getUnreadMessageCount(channel);
        return 0;
    }

    getTotalUnreadMessages(): number {
        return this.joinedChatRooms.reduce((total, channel) => total + this.getUnreadMessageCount(channel), 0);
    }

    sendMessage() {
        if (this.generalChatService.currentChannel && this.newMessage.trim()) {
            const message: ChatRoomMessageData = {
                chatRoomName: this.generalChatService.currentChannel.chatRoomName,
                data: {
                    time: this.timeService.getCurrentTime(),
                    data: this.newMessage,
                    userId: this.accountService.account.userId,
                },
            };
            this.generalChatService.sendMessage(message);
            this.newMessage = ''; // Clear the input after sending
        }
    }

    backToChannels() {
        this.generalChatService.currentChannel = null; // Reset currentChannel
        this.generalChatService.backToChannels(); // Call the service method to reset channel state
    }

    scrollToBottom(): void {
        setTimeout(() => {
            if (this.chatZone?.nativeElement) {
                const container = this.chatZone.nativeElement;
                container.scrollTop = container.scrollHeight;
            }
        }, 0);
    }

    isChannelJoined(channel: string): boolean {
        return this.joinedChatRooms.some((channelN) => channelN.chatRoomName === channel);
    }

    createChannel() {
        const chatRoomInfo = {
            chatRoomName: this.newChannelName,
            chatRoomType: ChatRoomType.Public,
        };

        if (!(this.newChannelName.length === 0) && !this.channels.some((channel) => channel === this.newChannelName)) {
            this.generalChatService.createChannel(chatRoomInfo);
        }
        this.newChannelName = '';
    }

    removeChannel(channelName: string) {
        this.generalChatService.removeChannel(channelName);
    }

    joinChannel(channel: string) {
        this.generalChatService.joinChannel(channel);
    }

    openExternalChat() {
        const userData = { userName: this.accountService.account.pseudonym, avatarPath: this.accountService.account.avatarUrl, theme: this.accountService.account.themeVisual, language: this.accountService.account.lang };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).electronAPI.openChatWindow(userData).then(() => {
            this.generalChatService.isChatClosed = true;
            this.generalChatService.isChatOpen = false;
        });
    }
}
