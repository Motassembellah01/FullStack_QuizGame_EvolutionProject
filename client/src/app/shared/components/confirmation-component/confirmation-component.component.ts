import { Component, OnInit } from '@angular/core';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-confirmation-component',
    templateUrl: './confirmation-component.component.html',
    styleUrls: ['./confirmation-component.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, TranslateModule, CommonModule],
})
/** Component used in a dialog with confirm and cancel buttons to confirm or
 * cancel some critical actions like abandon and quit match
 *
 * @class ConfirmationComponentComponent
 * @implements {OnInit}
 */
export class ConfirmationComponentComponent implements OnInit {
    confirmationService: CancelConfirmationService;

    constructor(
        public accountService: AccountService,
    ) {}

    ngOnInit(): void {
        if (this.confirmationService) {
            this.confirmationService.userConfirmed = false;
        }
    }

    cancel(): void {
        this.confirmationService.userConfirmed = false;
        this.confirmationService.dialogMessage = '';
        this.confirmationService.dialogRef?.close();
    }

    confirm(): void {
        this.confirmationService.userConfirmed = true;
        this.confirmationService.dialogMessage = '';
        this.confirmationService.dialogRef?.close();
    }
}
