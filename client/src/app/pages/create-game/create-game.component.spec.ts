import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { Match } from '@app/core/classes/match/match';
import { Question } from '@app/core/classes/question/question';
import { ACTIVE_PLAYERS, GAMES, QUESTIONS } from '@app/core/data/data';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { IMatch } from '@app/core/interfaces/i-match';
import { IQuestion } from '@app/core/interfaces/i-question';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { QuestionService } from '@app/core/services/question-service/question.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { QuestionListComponent } from '@app/shared/components/question-list/question-list.component';
import { Observable, of } from 'rxjs';
import { CreateGameComponent } from './create-game.component';

describe('CreateGameComponent', () => {
    let component: CreateGameComponent;
    let fixture: ComponentFixture<CreateGameComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameServiceService>;
    let questionServiceSpy: jasmine.SpyObj<QuestionService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let spyCancelConfirmationService: jasmine.SpyObj<CancelConfirmationService>;
    const mockQuestions: Question[] = QUESTIONS.map((obj) => Object.assign({ ...obj }));
    const mockGames: Game[] = GAMES.map((obj) => Object.assign({ ...obj }));
    let matchPlayerServiceSpy: jasmine.SpyObj<MatchPlayerService>;
    const iMatchMock: IMatch = {
        game: GAMES.map((obj) => Object.assign({ ...obj }))[0],
        begin: '',
        end: '',
        bestScore: 0,
        accessCode: '1234',
        testing: false,
        players: ACTIVE_PLAYERS.map((obj) => Object.assign({ ...obj })),
        managerName: 'organisateur',
        isAccessible: true,
        bannedNames: ['organisateur', 'système'],
        playerAnswers: [],
        panicMode: false,
        timer: 0,
        timing: true,
    };
    @Component({
        selector: 'app-game-form',
    })
    class MockGameFormComponent {}

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameServiceService', [
            'completeUpdateIsSuccessful',
            'verifyNameExists',
            'verifyGameExists',
            'updateGame',
            'validateName',
            'resetCurrentGame',
            'createGame',
            'completeCreation',
            'currentGame',
            'nameExists',
            'completeCreationIsSuccessful',
            'getGameById',
        ]);
        questionServiceSpy = jasmine.createSpyObj('QuestionService', ['resetQuestions']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        matchPlayerServiceSpy = jasmine.createSpyObj('MatchPlayerService', ['match']);
        spyCancelConfirmationService = jasmine.createSpyObj('CancelConfirmationService', ['askConfirmation']);

        TestBed.configureTestingModule({
            declarations: [MockGameFormComponent],
            imports: [AppMaterialModule, CreateGameComponent, QuestionListComponent, LogoComponent, CommonModule],
            providers: [
                { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'testID' } } } },
                { provide: GameServiceService, useValue: gameServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: QuestionService, useValue: questionServiceSpy },
                { provide: MatchPlayerService, useValue: matchPlayerServiceSpy },
                { provide: CancelConfirmationService, useValue: spyCancelConfirmationService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CreateGameComponent);
        gameServiceSpy.router = routerSpy;
        gameServiceSpy.currentGame.questions = mockQuestions.map((obj) => new Question(obj as IQuestion));
        gameServiceSpy.currentGame = mockGames[0];
        component = fixture.componentInstance;
        matchPlayerServiceSpy.match = new Match(iMatchMock);
        gameServiceSpy.currentGame.questions = mockQuestions.map((obj) => new Question(obj as IQuestion));
        gameServiceSpy.questionSrv = questionServiceSpy;
        spyOn(window, 'alert').and.stub();
        spyCancelConfirmationService.askConfirmation.and.callFake((action: () => void) => {
            action();
        });
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getGameById when ngOnInit is called', () => {
        gameServiceSpy.getGameById.and.returnValue(of(mockGames[0]));
        component.ngOnInit();
        gameServiceSpy.getGameById(mockGames[0].id).subscribe(() => {
            expect(gameServiceSpy.currentGame).toEqual(mockGames[0]);
            expect(component.oldGameName).toEqual(mockGames[0].title);
            expect(questionServiceSpy.questions).toEqual(mockGames[0].questions);
        });
    });

    it('should call router.navigateByURL onCancel', () => {
        component.onCancel();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('administration/home');
    });

    it('should call gameService.resetCurrentGame onCancel', () => {
        component.onCancel();
        expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
    });

    it('should call ask validation with right message when canceling modification', () => {
        gameServiceSpy.currentGame.id = '';
        component.onCancel();
        expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
    });

    it('should call ask validation with right message when canceling modification', () => {
        gameServiceSpy.currentGame.id = 'test';
        component.onCancel();
        expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
    });

    it('should call router.navigateByURL onCancel', () => {
        component.onCancel();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('administration/home');
        expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
    });

    it('should call gameService.validateName onCreateGame', () => {
        gameServiceSpy.validateName.and.returnValue(of(false));
        gameServiceSpy.currentGame.title = 'title';
        component.onCreateGame();
        expect(gameServiceSpy.validateName).toHaveBeenCalledWith(gameServiceSpy.currentGame.title);
    });

    it('should send an alert when an error is caught onCreateGame', () => {
        gameServiceSpy.validateName.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error message here' });
            }),
        );
        component.onCreateGame();
        expect(component.onCreateGame).toThrowError();
        expect(window.alert).toHaveBeenCalled();
    });

    it('should send an alert when an error is caught when calling validNameHandler', () => {
        const validNameHandlerSpy = spyOn(component, 'validNameHandler');
        gameServiceSpy.validateName.and.returnValue(
            new Observable((observer) => {
                observer.next(false);
            }),
        );
        validNameHandlerSpy.and.throwError(new Error('An error occurred'));
        component.onCreateGame();
        expect(component.onCreateGame).toThrowError();
        expect(window.alert).toHaveBeenCalled();
    });

    it("should update each question's timeAllowed attribute when validNameHandler is called", () => {
        const nameExists = true;
        gameServiceSpy.getGameById.and.returnValue(of(gameServiceSpy.currentGame));
        gameServiceSpy.completeCreationIsSuccessful.and.returnValue(false);
        gameServiceSpy.currentGame.duration = 20;
        component.validNameHandler(nameExists);
        expect(gameServiceSpy.nameExists).toEqual(nameExists);
        for (const question of gameServiceSpy.currentGame.questions) {
            expect(question.timeAllowed).toEqual(gameServiceSpy.currentGame.duration);
        }
    });
    it('should call createGame when validNameHandler is called', () => {
        const nameExists = true;
        gameServiceSpy.completeCreationIsSuccessful.and.returnValue(true);
        gameServiceSpy.createGame.and.returnValue(of());
        component.validNameHandler(nameExists);
        expect(gameServiceSpy.createGame).toHaveBeenCalled();
    });

    it('should call navigateByUrl when createGame is called', () => {
        const nameExists = true;
        gameServiceSpy.completeCreationIsSuccessful.and.returnValue(true);
        gameServiceSpy.createGame.and.returnValue(
            new Observable((observer) => {
                observer.next();
            }),
        );
        component.validNameHandler(nameExists);
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('administration/home');
    });

    it('onSave should call onUpdateGame if current game has an id', () => {
        gameServiceSpy.currentGame.id = 'testId';
        const spy = spyOn(component, 'onUpdateGame');
        component.onSave();
        expect(spy).toHaveBeenCalled();
    });

    it('onSave should call onCreateGame if current game has not an id', () => {
        gameServiceSpy.currentGame.id = '';
        const spy = spyOn(component, 'onCreateGame');
        component.onSave();
        expect(spy).toHaveBeenCalled();
    });

    it('should call gameService.validateName onUpdateGame', () => {
        gameServiceSpy.validateName.and.returnValue(of(false));
        component.onUpdateGame();
        expect(gameServiceSpy.validateName).toHaveBeenCalledWith(gameServiceSpy.currentGame.title);
    });

    it('should send an alert when an error is caught onUpdateGame', () => {
        gameServiceSpy.validateName.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error message here' });
            }),
        );
        component.onUpdateGame();
        expect(component.onUpdateGame).toThrowError();
        expect(window.alert).toHaveBeenCalled();
    });

    it("should navigate to 'administration/home' and update the game when updateGame verifyGame has no errors", () => {
        gameServiceSpy.validateName.and.returnValue(of(true));
        gameServiceSpy.completeUpdateIsSuccessful.and.returnValue(true);
        gameServiceSpy.verifyGameExists.and.returnValue(of(mockGames[0]));
        gameServiceSpy.updateGame.and.returnValue(of(mockGames[0]));
        component.onUpdateGame();
        expect(gameServiceSpy.validateName).toHaveBeenCalled();
        expect(gameServiceSpy.completeUpdateIsSuccessful).toHaveBeenCalled();
        expect(gameServiceSpy.verifyGameExists).toHaveBeenCalled();
        expect(gameServiceSpy.updateGame).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('administration/home');
    });

    it("should navigate to 'administration/home' and delete the game when updateGame verifyGame has errors", () => {
        gameServiceSpy.validateName.and.returnValue(of(true));
        gameServiceSpy.completeUpdateIsSuccessful.and.returnValue(true);
        gameServiceSpy.verifyGameExists.and.returnValue(of(mockGames[0]));
        gameServiceSpy.completeCreationIsSuccessful.and.returnValue(true);
        gameServiceSpy.createGame.and.returnValue(of(mockGames[0]));
        gameServiceSpy.verifyGameExists.and.returnValue(
            new Observable((observer) => {
                observer.error({ message: 'Error message here' });
            }),
        );
        component.onUpdateGame();
        expect(component.onUpdateGame).toThrowError();
        expect(gameServiceSpy.validateName).toHaveBeenCalled();
        expect(gameServiceSpy.completeUpdateIsSuccessful).toHaveBeenCalled();
        expect(gameServiceSpy.verifyGameExists).toHaveBeenCalled();
        expect(gameServiceSpy.completeCreationIsSuccessful).toHaveBeenCalled();
        expect(gameServiceSpy.createGame).toHaveBeenCalled();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('administration/home');
    });

    it('gameService.nameExists should be true if oldGame is equal to gameService.currentGame.title', () => {
        gameServiceSpy.validateName.and.returnValue(of(true));
        gameServiceSpy.completeUpdateIsSuccessful.and.returnValue(false);
        component.oldGameName = mockGames[0].title;
        gameServiceSpy.currentGame = Object.assign({ ...mockGames[0] });
        component.onUpdateGame();
        expect(gameServiceSpy.validateName).toHaveBeenCalled();
        expect(gameServiceSpy.completeUpdateIsSuccessful).toHaveBeenCalled();
        expect(gameServiceSpy.nameExists).toEqual(false);
    });

    it('gameService.nameExists should be false if oldGame is not equal to gameService.currentGame.title', () => {
        gameServiceSpy.validateName.and.returnValue(of(false));
        gameServiceSpy.completeUpdateIsSuccessful.and.returnValue(false);
        component.oldGameName = 'test';
        component.onUpdateGame();
        expect(gameServiceSpy.validateName).toHaveBeenCalled();
        expect(gameServiceSpy.completeUpdateIsSuccessful).toHaveBeenCalled();
        expect(gameServiceSpy.nameExists).toEqual(false);
    });

    it('should call router.navigateByURL onCancel', () => {
        component.onCancel();
        expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('administration/home');
    });

    it('should call gameService.resetCurrentGame onCancel', () => {
        component.onCancel();
        expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
    });
});
