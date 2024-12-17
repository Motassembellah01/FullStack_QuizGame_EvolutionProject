import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { PaginatorComponent } from '@app/shared/components/paginator/paginator.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '@app/core/http/services/account-service/account.service';

@Component({
    selector: 'app-creation',
    templateUrl: './creation.component.html',
    styleUrls: ['./creation.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, LogoComponent, PaginatorComponent, RouterModule, TranslateModule, CommonModule],
})

/**
 * Component where all the visible games are shown, by their titles.
 * If a game was deleted or is no longer visible when the manager select it,
 * he will be notified and he can select another game from the updated list
 */
export class CreationComponent {
    constructor(public accountService: AccountService) {}
}
