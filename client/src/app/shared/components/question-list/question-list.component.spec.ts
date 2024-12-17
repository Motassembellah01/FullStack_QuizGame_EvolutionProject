import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Question } from '@app/core/classes/question/question';
import { QUESTIONS } from '@app/core/data/data';
import { QuestionService } from '@app/core/services/question-service/question.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionListComponent } from './question-list.component';

describe('QuestionListComponent', () => {
    let component: QuestionListComponent;
    let fixture: ComponentFixture<QuestionListComponent>;
    let questionServiceSpy: jasmine.SpyObj<QuestionService>;
    let matDialogSpy: unknown;
    const mockQuestions = QUESTIONS.map((obj) => ({ ...obj }));

    beforeEach(() => {
        questionServiceSpy = jasmine.createSpyObj('QuestionService', ['questions']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, QuestionListComponent, CommonModule],
            providers: [{ provide: QuestionService, useValue: questionServiceSpy }],
        });
        fixture = TestBed.createComponent(QuestionListComponent);
        component = fixture.componentInstance;
        questionServiceSpy.questions = mockQuestions as Question[];
        matDialogSpy = spyOn(component['dialog'], 'open');
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should remove question from questionService.questions onDeleteQuestion', () => {
        const initialLength = QUESTIONS.length;
        component.onDeleteQuestion(0);
        expect(questionServiceSpy.questions.length).toEqual(initialLength - 1);
    });

    it('should call matDialog.open onModifyQuestion', () => {
        component.onModifyQuestion(0);
        expect(matDialogSpy).toHaveBeenCalled();
    });

    it('should moveItemInArray onDrop', async () => {
        const testQuestion = questionServiceSpy.questions[0];
        const event: CdkDragDrop<string[]> = {
            previousIndex: 0,
            currentIndex: 1,
            item: {
                data: testQuestion,
            } as unknown as CdkDrag<string[]>,
            container: { data: questionServiceSpy.questions } as unknown as CdkDropList<string[]>,
            previousContainer: null as unknown as CdkDropList<string[]>,
            isPointerOverContainer: true,
            distance: { x: 0, y: 0 },
            dropPoint: { x: 0, y: 0 },
            event: new MouseEvent('mockMouseEvent'),
        };
        component.onDrop(event);
        expect(questionServiceSpy.questions[1]).toEqual(testQuestion);
    });
});
