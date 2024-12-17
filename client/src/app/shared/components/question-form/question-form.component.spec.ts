import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Question } from '@app/core/classes/question/question';
import { CHOICES, POINTS } from '@app/core/constants/constants';
import { OPTIONS, QUESTIONS } from '@app/core/data/data';
import { Choice } from '@app/core/interfaces/choice';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionFormComponent } from './question-form.component';

describe('QuestionFormComponent', () => {
    let component: QuestionFormComponent;
    let fixture: ComponentFixture<QuestionFormComponent>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    let spyMatSnackBar: unknown;
    const mockQuestions: Question[] = QUESTIONS.map((obj) => Object.assign({ ...obj }));
    const mockQuestion: Question = { ...mockQuestions[0] } as Question;
    const mockOptions = OPTIONS.map((obj) => ({ ...obj }));

    beforeEach(() => {
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, FormsModule, QuestionFormComponent, CommonModule],
            providers: [{ provide: CancelConfirmationService, useValue: spyCancelConfirmationService }],
        });
        fixture = TestBed.createComponent(QuestionFormComponent);
        component = fixture.componentInstance;
        component.question = mockQuestion;
        mockQuestion.choices = mockOptions;
        spyMatSnackBar = spyOn(component['snackBar'], 'open');
    });

    describe('creation', () => {
        it('should create', () => {
            fixture.detectChanges();
            expect(component).toBeTruthy();
        });
    });

    describe('onAddChoices', () => {
        it('should add a true and a false default choices when question.choices.length is 0', () => {
            component.question.choices = [];
            component.onAddChoices();
            expect(component.question.choices).toEqual([{ isCorrect: false } as Choice, { isCorrect: true } as Choice]);
        });
    });

    describe('onNewChoice', () => {
        it('should add a default choice when question.choices.length is less than CHOICES_MAX', () => {
            const choicesLength = component.question.choices.length;
            component.question.choices.splice(0, 1);
            expect(component.question.choices.length).toEqual(choicesLength - 1);
            component.onNewChoice();
            expect(component.question.choices.length).toEqual(choicesLength);
            expect(component.question.choices).toContain({ isCorrect: false } as Choice);
        });
    });

    describe('onIncreasePoints', () => {
        it('should add 10 points if question.choices.points are less than POINTS_MAX', () => {
            const initialPoints = POINTS.min;
            component.question.points = initialPoints;
            const pointsToAdd = POINTS.increment;
            component.onIncreasePoints();
            expect(component.question.points).toEqual(initialPoints + pointsToAdd);
        });
    });

    describe('onDecreasePoints', () => {
        it('should subtract 10 points if question.choices.points are greater than POINTS_MIN', () => {
            const initialPoints = 20;
            component.question.points = initialPoints;
            const pointsToSubtract = POINTS.increment;
            component.onDecreasePoints();
            expect(component.question.points).toEqual(initialPoints - pointsToSubtract);
        });
    });

    describe('onDrop', () => {
        it('should moveItemInArray onDrop', async () => {
            const testChoice = component.question.choices[0];
            const event: CdkDragDrop<string[]> = {
                previousIndex: 0,
                currentIndex: 1,
                item: {
                    data: testChoice,
                } as unknown as CdkDrag<string[]>,
                container: { data: component.question.choices } as unknown as CdkDropList<string[]>,
                previousContainer: null as unknown as CdkDropList<string[]>,
                isPointerOverContainer: true,
                distance: { x: 0, y: 0 },
                dropPoint: { x: 0, y: 0 },
                event: new MouseEvent('mockMouseEvent'),
            };
            component.onDrop(event);
            expect(component.question.choices[1]).toEqual(testChoice);
        });
    });

    describe('onDeleteChoice', () => {
        it('should remove a selected choice from question.choices if question.choices.length > 2', () => {
            component.question = mockQuestion;
            component.question.choices = mockOptions.map((obj) => Object.assign({ ...obj }));
            const choiceToDelete = component.question.choices[0];
            const choicesLength = component.question.choices.length;
            spyCancelConfirmationService.askConfirmation.and.callFake((action: () => void) => {
                action();
            });
            component.onDeleteChoice(0);
            expect(component.question.choices.length).toEqual(choicesLength - 1);
            expect(component.question.choices).not.toContain(choiceToDelete);
        });

        it('should call showSnackbar if question.choices.length <= 2', () => {
            spyOn(component, 'showSnackbar');
            component.question = mockQuestion;
            component.question.choices = mockOptions.map((obj) => Object.assign({ ...obj }));
            spyCancelConfirmationService.askConfirmation.and.callFake((action: () => void) => {
                action();
            });
            component.onDeleteChoice(0);
            component.onDeleteChoice(0);
            component.onDeleteChoice(0);
            expect(component.showSnackbar).toHaveBeenCalled();
        });
    });

    describe('maxChoicesReached', () => {
        it('should return true when question.choices.length is equal to CHOICES_MAX', () => {
            component.question.choices.length = CHOICES.max;
            const isEqualToMaxChoices = component.maxChoicesReached();
            expect(isEqualToMaxChoices).toBeTruthy();
        });
    });

    describe('showSnackbar', () => {
        it('should return true when question.choices.length is equal to CHOICES_MAX', () => {
            component.showSnackbar('');
            expect(spyMatSnackBar).toHaveBeenCalled();
        });
    });
});
