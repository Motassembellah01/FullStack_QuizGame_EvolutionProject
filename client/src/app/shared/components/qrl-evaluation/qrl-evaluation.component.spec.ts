import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionEvaluationService } from '@app/core/services/question-evaluation/question-evaluation.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { QrlEvaluationComponent } from './qrl-evaluation.component';
import { CommonModule } from '@angular/common';

describe('QrlEvaluationComponent', () => {
    let component: QrlEvaluationComponent;
    let fixture: ComponentFixture<QrlEvaluationComponent>;
    let questionEvaluationServiceSpy: jasmine.SpyObj<QuestionEvaluationService>;

    beforeEach(() => {
        questionEvaluationServiceSpy = jasmine.createSpyObj('QuestionEvaluationService', [
            'setPlayerAnswer',
            'setCurrentNoteFactor',
            'updateScoreAfterQrlQuestion',
        ]);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, QrlEvaluationComponent, CommonModule],
            providers: [{ provide: QuestionEvaluationService, useValue: questionEvaluationServiceSpy }],
        });
        fixture = TestBed.createComponent(QrlEvaluationComponent);
        component = fixture.componentInstance;
    });

    describe('creation', () => {
        beforeEach(() => {
            component.ngOnInit();
        });
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should call setPlayerAnswer', () => {
            expect(questionEvaluationServiceSpy.setPlayerAnswer).toHaveBeenCalled();
        });
    });

    describe('setNoteFactor', () => {
        it('should call setPlayerAnswer', () => {
            component.setNoteFactor();
            expect(questionEvaluationServiceSpy.setCurrentNoteFactor).toHaveBeenCalled();
            expect(questionEvaluationServiceSpy.updateScoreAfterQrlQuestion).toHaveBeenCalled();
        });
    });
});
