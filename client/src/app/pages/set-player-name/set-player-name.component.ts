import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { Router } from '@angular/router';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { ErrorMessageComponent } from '@app/shared/components/error-message/error-message.component';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-set-player-name',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatGridListModule, MatButtonModule, TranslateModule, LogoComponent, FormsModule, AppMaterialModule, ErrorMessageComponent],
    templateUrl: './set-player-name.component.html',
    styleUrls: ['./set-player-name.component.scss'],
})
export class SetPlayerNameComponent {
    newName: string = '';
    selectedAvatar: string | null = null;

    constructor(
        public accountService: AccountService,
        private router: Router,
    ) {}

    selectAvatar(avatar: string) {
        this.selectedAvatar = avatar;
    }

    submitName() {
        if (this.newName) {
            this.accountService.updateName(this.newName.trim()).subscribe((account) => {
                this.accountService.account = account;
                this.newName = '';
                this.router.navigateByUrl('/home');
            });
        }
    }

    navigateHome() {
        this.router.navigateByUrl('/home');
    }
}
