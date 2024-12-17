import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Router } from '@angular/router';
import { Language, ThemeVisual } from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { AuthService } from '@app/core/services/auth-service/auth.service';
import { TranslationService } from '@app/core/services/translate-service/translate.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, MatFormFieldModule, AppMaterialModule, TranslateModule],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    providers: [TranslationService],
})
export class SettingsComponent implements OnInit {
    isFrenchSelected: boolean | null = null;
    isSettingsOpen: boolean = false;

    constructor(
        private router: Router,
        private translationService: TranslationService,
        public accountService: AccountService,
        public auth: AuthService,
    ) {}

    ngOnInit(): void {
        const currentLang = this.translationService['translateService'].currentLang;
        this.isFrenchSelected = currentLang === 'fr';
        this.accountService.getAccount().subscribe((account) => {
            this.accountService.theme = account.themeVisual;
        });
    }

    changeLang(lang: string) {
        this.isFrenchSelected = lang === 'fr';
        this.translationService.changeLang(lang as Language);
    }

    changeTheme(theme: string) {
        this.accountService.theme = theme;
        this.accountService.updateTheme(theme as ThemeVisual).subscribe();
    }

    toggleSettings() {
        this.isSettingsOpen = !this.isSettingsOpen;
    }

    navigateToAvatar() {
        this.router.navigateByUrl('/set-avatar');
    }
    navigateToNewPlayerName() {
        this.router.navigateByUrl('/set-player-name');
    }
}
