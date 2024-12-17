/* eslint-disable no-underscore-dangle */
import { ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { Question } from '@app/core/classes/question/question';
import { GAMES, QUESTIONS } from '@app/core/data/data';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { IGame } from '@app/core/interfaces/game';
import { IQuestion } from '@app/core/interfaces/i-question';
import { FileManagerService } from '@app/core/services/file-manager-service/file-manager.service';
import { QuestionService } from '@app/core/services/question-service/question.service';
import { Observable, of } from 'rxjs';
import { AdministrationComponent } from './administration.component';

describe('AdministrationComponent', () => {
    let component: AdministrationComponent;
    let fixture: ComponentFixture<AdministrationComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameServiceService>;
    let questionServiceSpy: jasmine.SpyObj<QuestionService>;
    let dialogSpy: unknown;
    let fileManagerSpy: jasmine.SpyObj<FileManagerService>;
    let alertSpy: jasmine.Spy;
    const mockQuestion: Question = QUESTIONS.map((obj) => Object.assign({ ...obj }))[0];
    const mockGame: Game = new Game(GAMES.map((obj) => Object.assign({ ...obj }))[0]);

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameServiceService', [
            'importGame',
            'getGameList',
            'validateName',
            'importGame',
            'validateOtherAttributes',
            'resetCurrentGame',
            'displayErrors',
            'validateAttributesTypes',
            'gamesUpdated$',
            'isCurrentGameValid',
        ]);
        fileManagerSpy = jasmine.createSpyObj('FileManagerService', ['import']);
        questionServiceSpy = jasmine.createSpyObj('QuestionService', ['validateAllQuestions', 'displayErrors', 'resetQuestions']);

        gameServiceSpy.nameExists = true;
        gameServiceSpy.currentGame = new Game(mockGame as IGame);
        questionServiceSpy.questions = [new Question(mockQuestion as IQuestion)];
        gameServiceSpy.currentGame.questions = [new Question(mockQuestion as IQuestion)];
        gameServiceSpy.getGameList.and.returnValue(new Observable());
        gameServiceSpy.gamesUpdated$ = of();

        TestBed.configureTestingModule({
            declarations: [],
            imports: [AdministrationComponent],
            providers: [
                { provide: GameServiceService, useValue: gameServiceSpy },
                { provide: FileManagerService, useValue: fileManagerSpy },
                { provide: QuestionService, useValue: questionServiceSpy },
                { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'testID' } } } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        gameServiceSpy.gamesUpdated$ = of();
        gameServiceSpy.questionSrv = questionServiceSpy;
        alertSpy = spyOn(window, 'alert').and.stub();
        fixture = TestBed.createComponent(AdministrationComponent);
        component = fixture.componentInstance;

        dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({
            afterClosed: () => of(true),
        } as MatDialogRef<unknown>);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('getGameList should return an observable of Game[]', () => {
        const expectedGames = [new Game(mockGame as IGame)];
        gameServiceSpy.getGameList.and.returnValue(of(expectedGames));
        component.getGameList().subscribe((actualGames: Game[]) => {
            expect(actualGames).toEqual(expectedGames);
        });
    });

    it('should validate name recursively', (done) => {
        const validateNameSpy = gameServiceSpy.validateName;
        validateNameSpy.and.callFake(() => {
            validateNameSpy.and.returnValue(of(false));
            return of(true);
        });
        component.validationSubscription = of(true).subscribe();
        component.validationSubscription = component.validateNameRecursively(gameServiceSpy.currentGame).subscribe((result) => {
            expect(result).toEqual(false);
            done();
        });
        expect(dialogSpy).toHaveBeenCalled();
    });

    it('should be cancelled and return true when a user canceled', (done) => {
        const validateNameSpy = gameServiceSpy.validateName;
        validateNameSpy.and.callFake(() => {
            validateNameSpy.and.returnValue(of(false));
            return of(true);
        });
        gameServiceSpy.adminCanceledImport = true;
        component.validationSubscription = component.validateNameRecursively(gameServiceSpy.currentGame).subscribe((result) => {
            expect(result).toEqual(true);
            done();
        });
        expect(dialogSpy).toHaveBeenCalled();
    });

    it('should import game if name valid', (done) => {
        gameServiceSpy.validateName.and.returnValue(of(false));
        component.validationSubscription = of(true).subscribe();
        component.validationSubscription = component.validateNameRecursively(gameServiceSpy.currentGame).subscribe((result) => {
            expect(result).toBe(false);
            done();
        });
    });

    it('Import should call import method of FileManagerService', async () => {
        fileManagerSpy.import.and.returnValue(Promise.resolve('test'));
        const event = {} as Event;
        component.import(event);
        setTimeout(() => {
            expect(alertSpy).toHaveBeenCalled();
        });
        expect(fileManagerSpy.import).toHaveBeenCalledWith(event);
    });

    it('should handle fileManager reading file error', async () => {
        const event = {} as Event;
        fileManagerSpy.import.and.returnValue(Promise.reject('error'));
        component.import(event);

        setTimeout(() => {
            expect(alertSpy).toHaveBeenCalled();
        });

        await new Promise((resolve) => setTimeout(resolve));
    });

    it('should handle parsing errors', async () => {
        const event = {} as Event;
        fileManagerSpy.import.and.returnValue(Promise.resolve('Bad_game'));
        component.import(event);
        expect(component.import).toThrowError();
        setTimeout(() => {
            expect(window.alert).toHaveBeenCalled();
        });
        await new Promise((resolve) => setTimeout(resolve));
    });

    it('Import should display errors when all questions are not valid', async () => {
        fileManagerSpy.import.and.returnValue(Promise.resolve(JSON.stringify(gameServiceSpy.currentGame)));
        spyOn(component, 'importedTypeAreValid').and.returnValue(true);
        gameServiceSpy.isCurrentGameValid.and.returnValue(false);
        gameServiceSpy.resetCurrentGame.and.returnValue();
        const event = {} as Event;
        component.import(event);
        setTimeout(() => {
            expect(gameServiceSpy.displayErrors).toHaveBeenCalled();
            expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
        });
        await new Promise((resolve) => setTimeout(resolve));
    });
    it('Import should display errors when all questions are not valid', async () => {
        fileManagerSpy.import.and.returnValue(Promise.resolve(JSON.stringify(gameServiceSpy.currentGame)));
        spyOn(component, 'importedTypeAreValid').and.returnValue(true);
        gameServiceSpy.isCurrentGameValid.and.returnValue(true);
        questionServiceSpy.validateAllQuestions.and.returnValue(true);
        spyOn(component, 'validateNameRecursively').and.stub();
        questionServiceSpy.displayErrors.and.returnValue();
        const event = {} as Event;
        component.import(event);
        setTimeout(() => {
            expect(component.validateNameRecursively).toHaveBeenCalled();
        });
        await new Promise((resolve) => setTimeout(resolve));
    });
    it('Import should display errors when all questions are not valid', async () => {
        fileManagerSpy.import.and.returnValue(Promise.resolve(JSON.stringify(gameServiceSpy.currentGame)));
        spyOn(component, 'importedTypeAreValid').and.returnValue(true);
        gameServiceSpy.isCurrentGameValid.and.returnValue(true);
        questionServiceSpy.validateAllQuestions.and.returnValue(false);
        spyOn(component, 'validateNameRecursively').and.stub();
        questionServiceSpy.displayErrors.and.returnValue();
        const event = {} as Event;
        component.import(event);
        setTimeout(() => {
            expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
        });
        await new Promise((resolve) => setTimeout(resolve));
    });

    it('Import should display if game has no valid attribute types', async () => {
        fileManagerSpy.import.and.returnValue(Promise.resolve(JSON.stringify(gameServiceSpy.currentGame)));
        spyOn(Game, 'validateAttributesTypes').and.returnValue(['test']);
        questionServiceSpy.displayErrors.and.returnValue();
        gameServiceSpy.displayErrors.and.returnValue();
        gameServiceSpy.resetCurrentGame.and.returnValue();
        gameServiceSpy.importGame.and.returnValue();
        const event = {} as Event;
        component.import(event);
        setTimeout(() => {
            expect(gameServiceSpy.displayErrors).toHaveBeenCalled();
        });
        await new Promise((resolve) => setTimeout(resolve));
    });

    it('import should catch errors occurring while importing', async () => {
        const event = {} as Event;
        fileManagerSpy.import.and.returnValue(Promise.resolve(JSON.stringify(gameServiceSpy.currentGame)));
        spyOn(Game, 'validateAttributesTypes').and.callFake(() => {
            throw new Error();
        });
        component.import(event);
        expect(component.import).toThrowError();
        setTimeout(() => {
            expect(window.alert).toHaveBeenCalled();
        });
        await new Promise((resolve) => setTimeout(resolve));
    });

    it('spreadClickOnImport should launch a click on importButton', () => {
        const clickSpy = jasmine.createSpy('click');
        const importButton = { nativeElement: { click: clickSpy } } as ElementRef;
        component.importButton = importButton;
        component.spreadClickOnImport();
        expect(clickSpy).toHaveBeenCalled();
    });
});
