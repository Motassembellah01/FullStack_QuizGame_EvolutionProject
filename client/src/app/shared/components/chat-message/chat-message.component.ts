import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { Message } from '@app/core/interfaces/message';

@Component({
    selector: 'app-chat-message',
    templateUrl: './chat-message.component.html',
    styleUrls: ['./chat-message.component.scss'],
    standalone: true,
    imports: [CommonModule],
})

/**
 * Manages the messages in a match and
 * the name of the sender of the message.
 * @class ChatMessageComponent
 * @implements {OnInit}
 */
export class ChatMessageComponent implements OnInit {
    @Input() message: Message;
    isSender: boolean;

    constructor(private accountService: AccountService) {}
    ngOnInit(): void {
        this.isSender = this.accountService.account.pseudonym === this.message.playerName;
    }
}
