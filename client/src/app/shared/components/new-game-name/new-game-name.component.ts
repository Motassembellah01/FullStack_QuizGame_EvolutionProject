import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Allows to request and validate a new name when the name provided already exists when importing a new game
 *
 * @class NewGameNameComponent
 */
@Component({
    selector: 'app-new-game-name',
    templateUrl: './new-game-name.component.html',
    styleUrls: ['./new-game-name.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, FormsModule, TranslateModule],
})
export class NewGameNameComponent {
    name: string;

    constructor(
        private gameService: GameServiceService,
        private dialogRef: MatDialogRef<NewGameNameComponent>,
    ) {}

    onSave(): void {
        this.gameService.currentGame.title = this.name;
        this.dialogRef?.close();
    }
    onCancel(): void {
        this.gameService.resetCurrentGame();
        this.gameService.adminCanceledImport = true;
        this.dialogRef?.close();
    }
}
