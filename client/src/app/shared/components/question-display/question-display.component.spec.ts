import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Question } from '@app/core/classes/question/question';
import { QUESTIONS } from '@app/core/data/data';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionDisplayComponent } from './question-display.component';
import { CommonModule } from '@angular/common';

describe('QuestionDisplayComponent', () => {
    let component: QuestionDisplayComponent;
    let fixture: ComponentFixture<QuestionDisplayComponent>;
    const mockQuestion = QUESTIONS.map((obj) => ({ ...obj }))[0];

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, QuestionDisplayComponent, CommonModule],
        });
        fixture = TestBed.createComponent(QuestionDisplayComponent);
        component = fixture.componentInstance;
        component.question = mockQuestion as Question;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
