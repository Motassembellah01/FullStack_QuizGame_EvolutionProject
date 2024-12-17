import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { AuthService } from '@app/core/services/auth-service/auth.service';
import { TranslationService } from '@app/core/services/translate-service/translate.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, MatFormFieldModule, AppMaterialModule, TranslateModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
    providers: [TranslationService],
})
export class ProfileComponent {
    isFrenchSelected: boolean | null = null;
    isSettingsOpen: boolean = false;

    constructor(
        private router: Router,
        public accountService: AccountService,
        public auth: AuthService,
    ) {}

    openHistory() {
        this.router.navigateByUrl('/profile/history');
    }

    openStatistics() {
        this.router.navigateByUrl('/profile/statistics');
    }

    onLogout() {
        this.accountService
            .deleteSession()
            .pipe(
                finalize(() => {
                    this.auth.logout();
                }),
            )
            .subscribe();
    }
}
