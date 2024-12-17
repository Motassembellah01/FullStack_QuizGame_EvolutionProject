import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionEvaluationService } from '@app/core/services/question-evaluation/question-evaluation.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Component that manages the evaluation of a QRL question.
 * It displays the answer to the manager and allows him/her to evaluate it with three note possibilities : 0%, 50% or 100%
 */
@Component({
    selector: 'app-qrl-evaluation',
    templateUrl: './qrl-evaluation.component.html',
    styleUrls: ['./qrl-evaluation.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, CommonModule, TranslateModule],
})
export class QrlEvaluationComponent implements OnInit {
    note: string;

    constructor(
        public questionEvaluationService: QuestionEvaluationService,
        private readonly matchPlayerService: MatchPlayerService,
        public accountService: AccountService,
    ) {}

    ngOnInit(): void {
        this.questionEvaluationService.setPlayerAnswer();
    }

    setNoteFactor(): void {
        if (this.matchPlayerService.isObserver()) {
            return;
        }
        this.questionEvaluationService.setCurrentNoteFactor(Number(this.note));
        this.questionEvaluationService.updateScoreAfterQrlQuestion();
    }
}
