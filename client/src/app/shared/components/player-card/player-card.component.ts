import { NgIf } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { SocketsSendEvents } from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { Account } from '@app/core/interfaces/account/account';
import { Player } from '@app/core/interfaces/player';
import { PlayerRequest } from '@app/core/interfaces/player-request';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';

/**
 * This component represents a player card that can be displayed within the waiting room.
 * It allows interaction with players, such as excluding a player (if the user is the manager).
 *
 * @class PlayerCardComponent
 */
@Component({
    selector: 'app-player-card',
    templateUrl: './player-card.component.html',
    styleUrls: ['./player-card.component.scss'],
    standalone: true,
    imports: [NgIf],
})
export class PlayerCardComponent implements OnInit{
    @Input() player: Player = { name: '', isActive: true, score: 0, nBonusObtained: 0, chatBlocked: false, avatar: '' };
    @Input() isManager: boolean = false;
    @Input() accessCode: string = '';
    playerAvatarUrl: string | null = null;
    

    constructor(private socketService: SocketService, public accountService: AccountService) {}

    ngOnInit(): void {
        if (this.player.name) {
            this.loadPlayerAvatar(this.player.name);
        }
    }

    excludePlayer(): void {
        this.socketService.send<PlayerRequest>(SocketsSendEvents.RemovePlayer, {
            roomId: this.accessCode,
            name: this.player.name,
            hasPlayerLeft: false,
        });
    }

    loadPlayerAvatar(playerName: string): void {
        this.accountService.getAccountByPseudonym(playerName).subscribe((account: Account) => {
          this.playerAvatarUrl = this.getLocalAvatar(account.avatarUrl);
        });
    }

    getLocalAvatar(avatarUrl: string): string {
        if (this.accountService.isBase64DataURL(avatarUrl)) {
          return avatarUrl;
        } else {
          return 'assets/avatars/' + avatarUrl;
        }
    }
}
