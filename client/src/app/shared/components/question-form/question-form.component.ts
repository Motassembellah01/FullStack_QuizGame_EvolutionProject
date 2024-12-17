import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Question } from '@app/core/classes/question/question';
import {
    CHOICES,
    DIALOG_MESSAGE_EN,
    DIALOG_MESSAGE_FR,
    ERROR_QUESTION_EN,
    ERROR_QUESTION_FR,
    POINTS,
    QUESTION_TYPE,
    SNACKBAR_DURATION,
    SNACKBAR_MESSAGE_EN,
    SNACKBAR_MESSAGE_FR,
} from '@app/core/constants/constants';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { Choice } from '@app/core/interfaces/choice';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { QuestionService } from '@app/core/services/question-service/question.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { AlertDialogComponent } from '@app/shared/alert-dialog/alert-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Component that manages the question's creation and modification form
 *
 * @class QuestionFormComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'app-question-form',
    templateUrl: './question-form.component.html',
    styleUrls: ['./question-form.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, CommonModule, FormsModule, TranslateModule],
})
export class QuestionFormComponent implements OnInit {
    @Input() question: Question;
    thirdChoice: boolean;
    fourthChoice: boolean;
    questionTypes: string[];
    // importedImageUrl: string | undefined;

    constructor(
        private confirmationService: CancelConfirmationService,
        private snackBar: MatSnackBar,
        private translateService: TranslateService,
        private questionService: QuestionService,
        public accountService: AccountService,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.questionTypes = [QUESTION_TYPE.qcm, QUESTION_TYPE.qrl, QUESTION_TYPE.qre];
        if (this.question.choices !== undefined) {
            this.thirdChoice = this.question.choices.length === 3;
            this.fourthChoice = this.question.choices.length === CHOICES.max;
        }
        if (this.question.type === QUESTION_TYPE.qre) {
            this.initializeQREValues();
        }
    }

    // constructor() {}
    // addImageQuestion(event: Event): void {
    //     const input = event.target as HTMLInputElement;
    //     if (input?.files?.length) {
    //         const file = input.files[0];
    //         const reader = new FileReader();

    //         reader.onload = (e: ProgressEvent<FileReader>) => {
    //             if (e.target?.result) {
    //                 // Vous pouvez maintenant utiliser l'image
    //                 console.log('Image importée avec succès');
    //                 // Par exemple, vous pouvez afficher l'image dans l'interface utilisateur
    //                 this.importedImageUrl = e.target.result as string;
    //                 this.question.image = this.importedImageUrl;
    //             }
    //         };

    //         reader.readAsDataURL(file);
    //     }
    // }

    onAddChoices(): void {
        if (this.question.choices.length === 0) this.question.choices = [{ isCorrect: false } as Choice, { isCorrect: true } as Choice];
    }

    onNewChoice(): void {
        if (this.question.choices.length < CHOICES.max) {
            this.question.choices.push({ isCorrect: false } as Choice);
        }
    }

    onIncreasePoints(): void {
        if (this.question.points < POINTS.max) {
            this.question.points += POINTS.increment;
        }
    }

    onDecreasePoints(): void {
        if (this.question.points > POINTS.min) {
            this.question.points -= POINTS.increment;
        }
    }

    onDrop(event: CdkDragDrop<string[]>): void {
        moveItemInArray(this.question.choices, event.previousIndex, event.currentIndex);
    }

    onDeleteChoice(index: number): void {
        if (this.question.choices.length > 2) {
            let dialogMessage;
            if (this.translateService.currentLang === 'fr') {
                dialogMessage = DIALOG_MESSAGE_FR.cancelChoiceDeletion;
            } else {
                dialogMessage = DIALOG_MESSAGE_EN.cancelChoiceDeletion;
            }

            this.confirmationService.askConfirmation(() => {
                this.question.choices.splice(index, 1);
            }, dialogMessage);
        } else {
            this.showSnackbar(
                this.translateService.currentLang === 'fr' ? SNACKBAR_MESSAGE_FR.minQuestionNumber : SNACKBAR_MESSAGE_EN.minQuestionNumber,
            );
        }
    }

    maxChoicesReached(): boolean {
        return this.question.choices.length === CHOICES.max;
    }

    showSnackbar(message: string): void {
        this.snackBar.open(message, 'Fermer', {
            duration: SNACKBAR_DURATION,
        });
    }

    initializeQREValues(): void {
        if (this.question.correctAnswer === undefined) {
            this.question.correctAnswer = 0;
        }
        if (this.question.lowerBound === undefined) {
            this.question.lowerBound = 0;
        }
        if (this.question.upperBound === undefined) {
            this.question.upperBound = 0;
        }
        if (this.question.tolerance === undefined) {
            this.question.tolerance = 0;
        }
    }

    validateQREMargin(): void {
        if (!this.questionService.validateQREMargin(this.question)) {
            if (this.translateService.currentLang === 'fr') this.showSnackbar(ERROR_QUESTION_FR.tolerance);
            else this.showSnackbar(ERROR_QUESTION_EN.tolerance);
        }
    }

    // validateQRELowerBound(): void {
    //     if (!this.questionService.validateQRELowerBound(this.question)) {
    //         if (this.translateService.currentLang === 'fr') this.showSnackbar(ERROR_QUESTION_FR.lowerBound);
    //         else this.showSnackbar(ERROR_QUESTION_EN.lowerBound);
    //     }
    // }

    // validateQREUpperBound(): void {
    //     if (!this.questionService.validateQREUpperBound(this.question)) {
    //         if (this.translateService.currentLang === 'fr') this.showSnackbar(ERROR_QUESTION_FR.upperBound);
    //         else this.showSnackbar(ERROR_QUESTION_EN.upperBound);
    //     }
    // }
    triggerFileInput() {
        document.getElementById('image-upload')?.click();
    }

    resizeImage(file: File, maxWidth: number, maxHeight: number, callback: (base64: string) => void) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.floor((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.floor((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    callback(resizedBase64);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (file) {
            const allowedTypes = ['image/png', 'image/jpeg'];
            if (!allowedTypes.includes(file.type)) {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "ERROR_MESSAGE_FOR.INVALID_FILE_TYPE",
                        messages: []
                    }
                })
                return;
            }

            const maxWidth = 100;
            const maxHeight = 100;

            this.resizeImage(file, maxWidth, maxHeight, (resizedBase64) => {
                this.question.image = resizedBase64;
            });
        }
    }
}
