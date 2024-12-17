import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { FriendService } from '@app/core/http/services/friend-service/friend.service';
import { AccountListenerService } from '@app/core/services/account-listener/account-listener.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FRIENDS_EN, FRIENDS_FR } from '@app/core/constants/constants';
import { Subscription } from 'rxjs';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';

@Component({
    selector: 'app-friends',
    standalone: true,
    imports: [CommonModule, FormsModule, MatFormFieldModule, AppMaterialModule, TranslateModule],
    templateUrl: './friends.component.html',
    styleUrls: ['./friends.component.scss'],
})
export class FriendsComponent implements OnInit, OnDestroy {
    tabs: string[];
    currentTab: string;
    searchTerm: string = '';
    private langChangeSubscription: Subscription;

    constructor(
        public accountService: AccountService,
        public accountListenerService: AccountListenerService,
        private readonly friendService: FriendService,
        private translateService: TranslateService,
        public cancelConfirmationService: CancelConfirmationService
    ) {
        this.updateLanguageDependentProperties();
    }

    ngOnInit(): void {
        // Update values from database that are used by frontend
        this.informUserOfPeopleAlreadyRequestedAtLogin();
        this.getFriendListAtLogin();
        this.getFriendRequestsListAtLogin();
        this.getListAllAccountsExistingAtLogin();
        this.getBlockedUsersListAtLogin()
        this.getBlockedByListAtLogin();

        // To get real time updates from the server using websockets and listeners
        // Also it maps account at the very beginning
        // To get real time updates from the server using websockets and listeners
        // Also it maps account at the very beginning
        this.accountListenerService.setUpListeners();

        // Listen for language changes
        this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
            this.updateLanguageDependentProperties();
        });
    }

    ngOnDestroy(): void {
        if (this.langChangeSubscription) {
            this.langChangeSubscription.unsubscribe();
        }
    }

    updateLanguageDependentProperties(): void {
        const isFrench = this.translateService.currentLang === 'fr';
        this.tabs = isFrench
            ? [FRIENDS_FR.discover, FRIENDS_FR.friends, FRIENDS_FR.friendRequest]
            : [FRIENDS_EN.discover, FRIENDS_EN.friends, FRIENDS_EN.friendRequest];
        this.currentTab = isFrench ? FRIENDS_FR.discover : FRIENDS_EN.discover;
    }

    getListAllAccountsExistingAtLogin(): void {
        this.accountService.getAccounts().subscribe((accounts: any[]) => {
            this.accountListenerService.accounts = this.accountListenerService.mapAccounts(accounts);
        });
    }

    informUserOfPeopleAlreadyRequestedAtLogin(): void {
        this.accountService.getFriendsThatUserRequested().subscribe((friends) => {
            this.accountListenerService.friendsThatUserRequested = friends;
        });
    }

    getFriendListAtLogin(): void {
        this.accountService.getFriends().subscribe((friends) => {
            this.accountListenerService.friends = friends;
        });
    }

    getFriendRequestsListAtLogin(): void {
        this.accountService.getFriendRequests().subscribe((friendRequests) => {
            this.accountListenerService.friendRequestsReceived = friendRequests;
        });
    }

    getBlockedUsersListAtLogin(): void {
        this.accountService.getBlockedUsers().subscribe((blockedUsers) => {
            this.accountListenerService.blocked = blockedUsers;
        });
    }

    getBlockedByListAtLogin(): void {
        this.accountService.getBlockedBy().subscribe((blockedBy) => {
            this.accountListenerService.UsersBlockingMe = blockedBy;
        });
    }

    switchTab(tab: string): void {
        this.currentTab = tab;
        this.filterAccounts();
    }

    filterAccounts(): any[] {
        return this.accountListenerService.accounts.filter((account) => {
            const isFrench = this.translateService.currentLang === 'fr';
            const matchesTab =
                (this.currentTab === (isFrench ? FRIENDS_FR.discover : FRIENDS_EN.discover)) ||
                (this.currentTab === (isFrench ? FRIENDS_FR.friends : FRIENDS_EN.friends) && account.isFriend);
            const matchesSearch = account.pseudonym
                .toLowerCase()
                .includes(this.searchTerm.toLowerCase());

            return matchesTab && matchesSearch;
        });
    }

    sendFriendRequest(userId: string): void {
        console.log(`Account ID is ${userId}`);
        this.friendService.sendFriendRequest(userId).subscribe(() => {
            this.filterAccounts();
        });
    }

    acceptFriendRequest(requestId: string): void {
        this.friendService.acceptFriendRequest(requestId).subscribe(() => {
            this.filterAccounts();
        });
    }

    rejectFriendRequest(requestId: string): void {
        this.friendService.rejectFriendRequest(requestId).subscribe(() => {
            this.filterAccounts();
        });
    }

    removeFriend(friendId: string): void {
        this.friendService.removeFriend(friendId).subscribe(() => {
            this.filterAccounts();
        });
    }

    blockNormalUser(blockedUserId: string, pseudonym: string): void {
        let dialogMessage;
        if (this.translateService.currentLang === 'fr') {
            dialogMessage = `bloquer ${pseudonym}`;
        } else {
            dialogMessage = `block ${pseudonym}`;
        }

        this.cancelConfirmationService.askConfirmation(() => {
            this.friendService.blockNormalUser(blockedUserId).subscribe(() => {
                this.filterAccounts();
            });
        }, dialogMessage);
    }

    blockFriend(blockedFriendId: string, pseudonym: string): void {
        let dialogMessage;
        if (this.translateService.currentLang === 'fr') {
            dialogMessage = `bloquer votre Ami ${pseudonym}`;
        } else {
            dialogMessage = `block your friend ${pseudonym}`;
        }

        this.cancelConfirmationService.askConfirmation(() => {
            this.friendService.blockFriend(blockedFriendId).subscribe(() => {
                this.filterAccounts();
            });
        }, dialogMessage);
    }

    blockUserWithPendingRequest(otherUserId: string, pseudonym: string): void {
        let dialogMessage;
        if (this.translateService.currentLang === 'fr') {
            dialogMessage = `bloquer ${pseudonym}`;
        } else {
            dialogMessage = `block ${pseudonym}`;
        }

        this.cancelConfirmationService.askConfirmation(() => {
            this.friendService.blockUserWithPendingRequest(otherUserId).subscribe(() => {
                this.filterAccounts();
            });
        }, dialogMessage);
    }
}
