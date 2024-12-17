import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AccountService } from '@app/core/http/services/account-service/account.service';

/**
 * Contains the application's logo
 *
 * @class LogoComponent
 */
@Component({
    selector: 'app-logo',
    templateUrl: './logo.component.html',
    styleUrls: ['./logo.component.scss'],
    standalone: true,
    imports: [CommonModule],
})
export class LogoComponent {
    constructor(public accountService: AccountService) {}
}
