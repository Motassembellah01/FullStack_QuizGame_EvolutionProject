import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Question } from '@app/core/classes/question/question';
import { DIALOG_MESSAGE_EN, DIALOG_MESSAGE_FR, POINTS } from '@app/core/constants/constants';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { QuestionService } from '@app/core/services/question-service/question.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionFormComponent } from '@app/shared/components/question-form/question-form.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { AccountService } from '@app/core/http/services/account-service/account.service';

/**
 * Component that uses the question form to create a new question and
 * adds it to the questionService's questions list
 *
 * @class CreateQuestionComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'app-create-question',
    templateUrl: './create-question.component.html',
    styleUrls: ['./create-question.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, QuestionFormComponent, TranslateModule, CommonModule],
})
export class CreateQuestionComponent implements OnInit {
    question: Question;

    constructor(
        private questionService: QuestionService,
        private confirmationService: CancelConfirmationService,
        private dialogRef: MatDialogRef<CreateQuestionComponent>,
        private translateService: TranslateService,
        public accountService: AccountService,
    ) {}

    onSaveQuestion(): void {
        if (this.questionService.addQuestion(this.question)) {
            this.dialogRef?.close();
        }
    }

    ngOnInit(): void {
        this.question = new Question({
            id: '',
            type: '',
            text: '',
            points: 0,
            choices: [],
            timeAllowed: 0,
            correctAnswer: null,
            lowerBound: null,
            upperBound: null,
            tolerance: null,
            image: ''
        });
        this.question.points = POINTS.min;
    }

    onCancel(): void {
        let dialogMessage;
        if (this.translateService.currentLang === 'fr') {
            dialogMessage = DIALOG_MESSAGE_FR.cancelQuestion;
        } else {
            dialogMessage = DIALOG_MESSAGE_EN.cancelQuestion;
        }

        this.confirmationService.askConfirmation(() => {
            if (this.confirmationService.userConfirmed) this.dialogRef.close();
        }, dialogMessage);
    }
}
