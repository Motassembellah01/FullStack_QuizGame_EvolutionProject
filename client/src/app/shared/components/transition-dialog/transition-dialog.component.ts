import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimeService } from '@app/core/websocket/services/time-service/time.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { CommonModule } from '@angular/common';
import { AccountService } from '@app/core/http/services/account-service/account.service';

/**
 * Component that provides the template for transition dialogs :
 * Used when the manager starts the match and after showing each question results
 *
 * @class TransitionDialogComponent
 */
@Component({
    selector: 'app-transition-dialog',
    templateUrl: './transition-dialog.component.html',
    styleUrls: ['./transition-dialog.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, CommonModule],
})
export class TransitionDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { transitionText: string; maxTime: number},
        public timeService: TimeService,
        public accountService: AccountService 
    ) {}
}
