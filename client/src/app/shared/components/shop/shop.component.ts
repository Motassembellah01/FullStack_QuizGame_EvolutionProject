import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { ThemeVisual, MONEY } from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { TranslationService } from '@app/core/services/translate-service/translate.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-shop',
    standalone: true,
    imports: [CommonModule, FormsModule, MatFormFieldModule, AppMaterialModule, TranslateModule],
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss'],
    providers: [TranslationService],
})
export class ShopComponent implements OnInit {
    public themes = [ThemeVisual.CHRISTMAS, ThemeVisual.VALENTINES];
    public MONEY = MONEY;

    @ViewChild('insufficientFundsDialog') insufficientFundsDialog!: TemplateRef<any>; 

    constructor(
        public accountService: AccountService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.accountService.getAccount().subscribe((account) => {
            this.accountService.ownedThemes = account.visualThemesOwned || [];
            this.accountService.ownedAvatars = account.avatarsUrlOwned || [];
        });
    }

    buyAvatar(avatar: string[], cost: number): void {
        const newMoney = this.accountService.money - cost;
        if (newMoney < 0) {
            this.openInsufficientFundsDialog();
            return;
        }
        this.accountService.updateOwnedAvatars(avatar).subscribe((updatedAccount) => {
            this.accountService.ownedAvatars = updatedAccount.avatarsUrlOwned;
            this.accountService.updateMoney(newMoney).subscribe((updatedMoneyAccount) => {
                this.accountService.money = updatedMoneyAccount.money;
            });
        });
    }

    buyTheme(theme: ThemeVisual[], cost: number): void {
        const newMoney = this.accountService.money - cost;
        if (newMoney < 0) {
            this.openInsufficientFundsDialog();
            return;
        }
        this.accountService.updateOwnedThemes(theme).subscribe((updatedAccount) => {
            this.accountService.ownedThemes = updatedAccount.visualThemesOwned;
            this.accountService.updateMoney(newMoney).subscribe((updatedMoneyAccount) => {
                this.accountService.money = updatedMoneyAccount.money;
            });
        });
    }

    openInsufficientFundsDialog(): void {
        this.dialog.open(this.insufficientFundsDialog); 
    }
}
