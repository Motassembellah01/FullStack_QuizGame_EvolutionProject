/* eslint-disable no-underscore-dangle */
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { DIALOG, SNACKBAR_DURATION, SNACKBAR_MESSAGE_EN, SNACKBAR_MESSAGE_FR } from '@app/core/constants/constants';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { FileManagerService } from '@app/core/services/file-manager-service/file-manager.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { AlertDialogComponent } from '@app/shared/alert-dialog/alert-dialog.component';
import { ErrorMessageComponent } from '@app/shared/components/error-message/error-message.component';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { NewGameNameComponent } from '@app/shared/components/new-game-name/new-game-name.component';
import { PaginatorComponent } from '@app/shared/components/paginator/paginator.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AccountService } from '@app/core/http/services/account-service/account.service';

@Component({
    selector: 'app-administration',
    templateUrl: './administration.component.html',
    styleUrls: ['./administration.component.scss'],
    standalone: true,
    imports: [LogoComponent, PaginatorComponent, AppMaterialModule, RouterModule, ErrorMessageComponent, TranslateModule, CommonModule],
})

/**
 * Component where the games are managed:
 * it calls the GamePanel component that includes the list of all the games
 * The administrator can add, modify or delete a game.
 * He can also import or export a game and change the game's visibility
 */
export class AdministrationComponent {
    @ViewChild('importButton') importButton: ElementRef;
    validationSubscription: Subscription;
    gamesUpdatedSubscription: Subscription;
    // eslint-disable-next-line max-params
    constructor(
        public gameService: GameServiceService,
        private fileManager: FileManagerService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private translateService: TranslateService,
        public accountService: AccountService,
    ) {}

    getGameList(): Observable<Game[]> {
        return this.gameService.getGameList();
    }

    spreadClickOnImport(): void {
        this.importButton.nativeElement.click();
    }

    import(event: Event): void {
        this.fileManager
            .import(event)
            .then((stringGame) => {
                if (stringGame) {
                    this.processImportedGame(stringGame);
                }
            })
            .catch((e) => {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "ERROR_MESSAGE_FOR.IMPORT_FAILED",
                        messages: JSON.stringify(e)
                    }
                });
            });
    }

    /*
     * validate recursively game name then import it */
    validateNameRecursively(game: Game): Observable<boolean> {
        return this.gameService.validateName(game.title).pipe(
            switchMap((nameExists: boolean) => {
                if (!nameExists) {
                    // if name is valid
                    this.gameService.nameExists = nameExists;
                    this.gameService.importGame(game);
                    this.gameService.updateGameList();
                    this.validationSubscription.unsubscribe(); // Stop the validation
                    if (this.translateService.currentLang === 'fr') this.showSnackbar(SNACKBAR_MESSAGE_FR.gameImported);
                    else this.showSnackbar(SNACKBAR_MESSAGE_EN.gameImported);
                    return of(false);
                } else {
                    // If name is not valid, continue validation recursively
                    return this.dialog
                        .open(NewGameNameComponent, { width: DIALOG.newNameWidth })
                        .afterClosed()
                        .pipe(
                            switchMap(() => {
                                if (!this.gameService.adminCanceledImport) return this.validateNameRecursively(game);
                                else {
                                    this.gameService.adminCanceledImport = false;
                                    return of(true);
                                }
                            }),
                        );
                }
            }),
        );
    }

    importedTypeAreValid(game: Game): boolean {
        const validationMessages = Game.validateAttributesTypes(game);
        this.gameService.errorMessages = validationMessages;
        return validationMessages.length === 0;
    }

    private processValidGame(): void {
        if (this.gameService.questionSrv.validateAllQuestions()) {
            this.validationSubscription = this.validateNameRecursively(this.gameService.currentGame).subscribe();
        } else {
            this.gameService.questionSrv.displayErrors();
            this.gameService.resetCurrentGame();
        }
    }

    private processImportedGame(stringGame: string): void {
        try {
            const game = JSON.parse(stringGame) as Game;
            if (this.importedTypeAreValid(game)) {
                this.gameService.currentGame = Game.parseGame(game);
                this.gameService.questionSrv.questions = game.questions;
                this.gameService.nameExists = false; // should be set true after if necessary
                if (this.gameService.isCurrentGameValid()) {
                    this.processValidGame();
                } else {
                    this.gameService.displayErrors();
                    this.gameService.resetCurrentGame();
                }
            } else {
                this.gameService.displayErrors();
            }
        } catch (e) {
            if (e instanceof SyntaxError) {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "ERROR_MESSAGE_FOR.IMPORT_FAILED_INVALID_JSON",
                        messages: JSON.stringify(e)
                    }
                });
            }
            else {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "GENERAL.ERROR",
                        messages: JSON.stringify(e)
                    }
                })
            }
        }
    }

    private showSnackbar(message: string): void {
        this.snackBar.open(message, 'Fermer', {
            duration: SNACKBAR_DURATION,
        });
    }
}
