import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterModule } from '@angular/router';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { ChatRoomMessageData } from '@app/core/interfaces/chat-interfaces/chatroom-message-data';
import { JoinedChatroom } from '@app/core/interfaces/chat-interfaces/joined-chatroom';
import { AccountListenerService } from '@app/core/services/account-listener/account-listener.service';
import { GeneralChatService } from '@app/core/services/general-chat-service/general-chat.service';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { ChatMessageComponent } from '@app/shared/components/chat-message/chat-message.component';
import { FriendsComponent } from '@app/shared/components/friends/friends.component';
import { GeneralChatComponent } from '@app/shared/components/general-chat/general-chat.component';
import { ProfileComponent } from '@app/shared/components/profile/profile.component';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ShopComponent } from '@app/shared/components/shop/shop.component';
import { SettingsComponent } from '@app/shared/components/settings/settings.component';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ChatMessageComponent,
        MatFormFieldModule,
        AppMaterialModule,
        GeneralChatComponent,
        ProfileComponent,
        FriendsComponent,
        RouterModule,
        TranslateModule,
        ShopComponent,
        SettingsComponent,
    ],
    animations: [
        trigger('headerAnimation', [
            state('open', style({ opacity: 1 })),
            state('closed', style({ width: '0', opacity: 0 })),
            transition('open => closed', [animate('0.6s ease-in-out')]),
            transition('closed => open', [animate('0.6s ease-in-out')]),
        ]),
    ],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('chatZone') chatZone: ElementRef;
    @Input() sendEvent: EventEmitter<void>;
    isChannelOpen: boolean = false;
    isAddOpen: boolean = false;
    isModifyOpen: boolean = false;
    isSearchOpen: boolean = false;
    newChannelName: string = '';
    newMessage: string = ''; // Property for new message input
    avatarUrl = 'path-to-avatar-image'; // Adjust the path to your avatar
    channels: string[] = [];
    joinedChannels: JoinedChatroom[] = [];
    currentChannel: JoinedChatroom | null = null; // Add this property
    searchTerm: string = '';
    filteredChannels: string[] = [];

    private messageSubscription: Subscription = new Subscription();
    private joinedChannelsSubscription: Subscription = new Subscription();

    constructor(
        public generalChatService: GeneralChatService,
        private timeService: TimeService,
        public accountService: AccountService,
        public accountListenerService: AccountListenerService,
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
        this.filteredChannels = [...this.channels];
        this.messageSubscription = this.generalChatService.channels$.subscribe((channels) => {
            this.channels = channels;
            this.currentChannel = this.generalChatService.currentChannel; // Update currentChannel from the service
        });
        this.joinedChannelsSubscription = this.generalChatService.joinedChannels$.subscribe((c: JoinedChatroom[]) => (this.joinedChannels = c));
        // this.generalChatService.getChannels(); We'll get the channels with the getUser
        this.generalChatService.isTyping = false;
        if (this.sendEvent) {
            this.sendEvent.subscribe((event: KeyboardEvent) => {
                this.onEntryKey(event);
            });
        }
        console.log(this.accountService.account);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isChat: boolean = (window as any).chatAPI?.isChatProcess();
        if (!isChat) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).electronAPI.isChatClosed(() => {
                if (this.generalChatService.isProfileOpen) this.generalChatService.isProfileOpen = false;
                if (this.generalChatService.isFriendsOpen) this.generalChatService.isFriendsOpen = false;
                if (this.generalChatService.isShopOpen) this.generalChatService.isShopOpen = false;
                if (this.generalChatService.isSettingsOpen) this.generalChatService.isSettingsOpen = false;
                this.generalChatService.isChatClosed = false;
                this.generalChatService.getChannels();
            });
        }
        this.accountService.getAccount().subscribe((account) => {
            this.accountService.money = account.money;
        });
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
        if (!this.generalChatService.isChatClosed) {
            this.generalChatService.isChatOpen = !this.generalChatService.isChatOpen;
            if (this.generalChatService.currentChannel) this.generalChatService.selectChannel(this.generalChatService.currentChannel);
            if (!this.generalChatService.isChatOpen) this.backToChannels();
            if (this.generalChatService.isProfileOpen) this.generalChatService.isProfileOpen = false;
            if (this.generalChatService.isFriendsOpen) this.generalChatService.isFriendsOpen = false;
            if (this.generalChatService.isShopOpen) this.generalChatService.isShopOpen = false;
            if (this.generalChatService.isSettingsOpen) this.generalChatService.isSettingsOpen = false;
        }
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
    }

    toggleFriends() {
        this.generalChatService.isFriendsOpen = !this.generalChatService.isFriendsOpen;
        if (this.generalChatService.isProfileOpen) this.generalChatService.isProfileOpen = false;
        if (this.generalChatService.isChatOpen) this.generalChatService.isChatOpen = false;
        if (this.generalChatService.isShopOpen) this.generalChatService.isShopOpen = false;
        if (this.generalChatService.isSettingsOpen) this.generalChatService.isSettingsOpen = false;
    }

    toggleProfile() {
        this.generalChatService.isProfileOpen = !this.generalChatService.isProfileOpen;
        if (this.generalChatService.isChatOpen) this.generalChatService.isChatOpen = false;
        if (this.generalChatService.isFriendsOpen) this.generalChatService.isFriendsOpen = false;
        if (this.generalChatService.isShopOpen) this.generalChatService.isShopOpen = false;
        if (this.generalChatService.isSettingsOpen) this.generalChatService.isSettingsOpen = false;
    }

    toggleShop() {
        this.generalChatService.isShopOpen = !this.generalChatService.isShopOpen;
        if (this.generalChatService.isChatOpen) this.generalChatService.isChatOpen = false;
        if (this.generalChatService.isFriendsOpen) this.generalChatService.isFriendsOpen = false;
        if (this.generalChatService.isProfileOpen) this.generalChatService.isProfileOpen = false;
        if (this.generalChatService.isSettingsOpen) this.generalChatService.isSettingsOpen = false;
    }

    toggleSettings() {
        this.generalChatService.isSettingsOpen = !this.generalChatService.isSettingsOpen;
        if (this.generalChatService.isChatOpen) this.generalChatService.isChatOpen = false;
        if (this.generalChatService.isFriendsOpen) this.generalChatService.isFriendsOpen = false;
        if (this.generalChatService.isProfileOpen) this.generalChatService.isProfileOpen = false;
        if (this.generalChatService.isShopOpen) this.generalChatService.isShopOpen = false;
    }

    selectChannel(channel: JoinedChatroom) {
        this.isChannelOpen = !this.isChannelOpen;
        this.currentChannel = channel;
        this.generalChatService.selectChannel(channel); // Ensure this calls the service method
        this.scrollToBottom();
    }

    onSearch(): void {
        this.filteredChannels = this.channels.filter((channel) => channel.includes(this.searchTerm));
    }

    getUnreadMessageCount(channel: JoinedChatroom): number {
        return this.generalChatService.getUnreadMessageCount(channel);
    }

    getTotalUnreadMessages(): number {
        if (!this.accountService.account.pseudonym)
            return this.joinedChannels.reduce((total, chatroom) => total + this.getUnreadMessageCount(chatroom), 0);
        return 0;
    }

    sendMessage() {
        if (this.currentChannel && this.newMessage.trim()) {
            const message: ChatRoomMessageData = {
                chatRoomName: this.currentChannel.chatRoomName,
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
        this.currentChannel = null; // Reset currentChannel
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

    navToHome() {
        this.accountService.isInHomePage = true;
    }
}
