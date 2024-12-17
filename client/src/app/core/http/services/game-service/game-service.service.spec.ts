import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { Question } from '@app/core/classes/question/question';
import { HTTP_RESPONSES } from '@app/core/constants/constants';
import { GAMES, QUESTIONS } from '@app/core/data/data';
import { QuestionService } from '@app/core/services/question-service/question.service';
import { Observable, Subject, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GameServiceService } from './game-service.service';

describe('GameServiceService', () => {
    let service: GameServiceService;
    let httpMock: HttpTestingController;
    let spyRouter: jasmine.SpyObj<Router>;
    let spyQuestionService: jasmine.SpyObj<QuestionService>;
    const badGameMock: Game = new Game({ id: '', title: '', description: '', duration: 40, lastModification: '', questions: [], isVisible: false });
    const mockGames: Game[] = GAMES.map((obj) => Object.assign({ ...obj }));
    beforeEach(() => {
        spyRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
        spyQuestionService = jasmine.createSpyObj('QuestionService', ['resetQuestions']);
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                { provide: Router, useValue: spyRouter },
                { provide: QuestionService, useValue: spyQuestionService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(GameServiceService);
        httpMock = TestBed.inject(HttpTestingController);
        spyOn(window, 'alert').and.stub();
    });
    afterEach(() => {
        httpMock.verify();
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('updateGameList should call getAllGames', () => {
        const spy = spyOn(service, 'getAllGames').and.callFake(() => of());
        service.updateGameList();
        expect(spy).toHaveBeenCalled();
    });
    it('updateGameList should map result ', () => {
        spyOn(service, 'getAllGames').and.returnValue(of([new Game()]));
        service.updateGameList();
        service['games$'].subscribe((gamesList) => {
            expect(gamesList).toBeTruthy();
        });
    });
    it('completeCreationIsSuccessful should call setMissingAttributes', () => {
        const spy = spyOn(service, 'setMissingAttributes');
        service.completeCreationIsSuccessful();
        expect(spy).toHaveBeenCalled();
    });
    it('completeCreationIsSuccessful should generate an id is the game is valid', () => {
        spyOn(service, 'isCurrentGameValid').and.returnValue(true);
        spyOn(service, 'generateId').and.returnValue('testId');
        const completed = service.completeCreationIsSuccessful();
        expect(service.generateId).toHaveBeenCalled();
        expect(service.isCurrentGameValid).toHaveBeenCalled();
        expect(completed).toBeTruthy();
    });
    it('displayErrors should reset errorMessages', () => {
        service.displayErrors();
        expect(service.errorMessages).toHaveSize(0);
    });
    it('setCommonAttributes should set questions and lastModification attributes', () => {
        service.currentGame.questions = undefined as unknown as Question[];
        service.currentGame.lastModification = undefined as unknown as string;
        spyQuestionService.questions = Object.assign(QUESTIONS);
        service.setCommonAttributes();
        expect(service.currentGame.questions).not.toBeUndefined();
        expect(service.currentGame.lastModification).not.toBeUndefined();
    });
    it('completeUpdateIsSuccessful should call setCommonAttributes', () => {
        const spy = spyOn(service, 'setCommonAttributes');
        service.completeUpdateIsSuccessful();
        expect(spy).toHaveBeenCalled();
    });
    it('completeUpdateIsSuccessful should return true if game is valid', () => {
        const spy = spyOn(service, 'setCommonAttributes');
        spyOn(service, 'isCurrentGameValid').and.returnValue(true);
        expect(service.completeUpdateIsSuccessful()).toBeTruthy();
        expect(spy).toHaveBeenCalled();
    });
    it('completeUpdateIsSuccessful should call displayErrors if not a valid game', () => {
        const spy = spyOn(service, 'displayErrors');
        service.currentGame = badGameMock;
        const completed = service.completeUpdateIsSuccessful();
        expect(spy).toHaveBeenCalled();
        expect(completed).toBeFalsy();
    });
    it('getAllGames should generate a get request', () => {
        service.getAllGames().subscribe(() => {
            return;
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/games`);
        expect(req.request.method).toBe('GET');
    });
    it('getAllGames should return a Observable<Game[]>', () => {
        const returnValue = service.getAllGames();
        expect(returnValue).toBeInstanceOf(Observable<Game[]>);
    });
    it('createGame should generate a post request', () => {
        const expectedGame: Game = Object.assign({ ...mockGames[0] });
        service.currentGame = expectedGame;
        service.createGame().subscribe((result) => {
            expect(result).toEqual(expectedGame);
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/games`);
        expect(req.request.method).toBe('POST');
        req.flush(expectedGame);
    });
    it('verifyGameIsAvailable should call navigateByUrl if game visible', () => {
        const gameMock: Game = Object.assign({ ...mockGames[0] });
        gameMock.isVisible = true;
        const spy = spyOn(service, 'getGameById').and.returnValue(of(gameMock));
        service.verifyGameIsAvailable(gameMock.id, '');
        expect(spy).toHaveBeenCalledWith(gameMock.id);
        expect(spyRouter.navigateByUrl).toHaveBeenCalledWith('');
    });
    it('verifyGameIsAvailable should call update gameList if game is not visible', () => {
        const gameMock: Game = Object.assign({ ...mockGames[0] });
        gameMock.isVisible = false;
        const spy = spyOn(service, 'getGameById').and.returnValue(of(gameMock));
        spyOn(service, 'updateGameList').and.returnValue();
        service.verifyGameIsAvailable(gameMock.id, '');
        expect(spy).toHaveBeenCalledWith(gameMock.id);
        expect(window.alert).toHaveBeenCalled();
        expect(service.updateGameList).toHaveBeenCalled();
    });
    it('verifyGameIsAvailable should handle errors of getGameById if game is not found', () => {
        const gameMock: Game = Object.assign({ ...mockGames[0] });
        service.gameVisibilitySubject = new Subject();
        const spy = spyOn(service, 'getGameById').and.returnValue(
            new Observable((observer) => {
                observer.error({ status: HTTP_RESPONSES.notFound });
            }),
        );
        service.verifyGameIsAvailable(gameMock.id, '');
        expect(window.alert).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(gameMock.id);
    });
    it('verifyGameIsAvailable should handle errors of getGameById other than game not found', () => {
        const gameMock: Game = Object.assign({ ...mockGames[0] });
        const spy = spyOn(service, 'getGameById').and.returnValue(
            new Observable((observer) => {
                observer.error({ status: HTTP_RESPONSES.forbidden });
            }),
        );
        service.verifyGameIsAvailable(gameMock.id, '');
        expect(window.alert).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(gameMock.id);
    });
    it('getGameById should make a get request', () => {
        const expectedGame: Game = Object.assign({ ...mockGames[0] });
        const fakeId = 'fakeId';
        service.getGameById(fakeId).subscribe({
            next: (response: Game) => {
                expect(response.title).toEqual(expectedGame.title);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/games/${fakeId}`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedGame);
    });
    it('deleteGame should make a delete request', () => {
        const expectedGame: Game = Object.assign({ ...mockGames[0] });
        const fakeId = 'fakeId';
        service.deleteGame(fakeId).subscribe({
            next: (response: Game | null) => {
                expect(response?.title).toEqual(expectedGame.title);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/games/${fakeId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(expectedGame);
    });
    it('addGame should make a post request', () => {
        const gameToCreate: Game = Object.assign({ ...mockGames[0] });
        service.currentGame = gameToCreate;
        service.addGame(gameToCreate).subscribe((result) => {
            expect(result).toEqual(gameToCreate);
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/games`);
        expect(req.request.method).toBe('POST');
        req.flush(gameToCreate);
    });
    it('importGame should call createGame', () => {
        const completeCreationSpy = spyOn(service, 'completeCreationIsSuccessful').and.callFake(() => true);
        const createGameSpy = spyOn(service, 'createGame').and.callFake(() => of());
        service.importGame(Object.assign({ ...mockGames[0] }));
        expect(completeCreationSpy).toHaveBeenCalled();
        expect(createGameSpy).toHaveBeenCalled();
    });
    it('updateGame should make a put request if game exists', () => {
        const gameToUpdate: Game = Object.assign({ ...mockGames[0] });
        service.currentGame = gameToUpdate;
        service.gameExists = true;
        service.updateGame(gameToUpdate).subscribe((result) => {
            expect(result).toEqual(gameToUpdate);
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/games`);
        expect(req.request.method).toBe('PUT');
        req.flush(gameToUpdate);
    });
    it("updateGame should call add game if game doesn't exist", () => {
        const gameToUpdate: Game = Object.assign({ ...mockGames[0] });
        const addGameSpy = spyOn(service, 'addGame').and.callFake(() => of());
        service.gameExists = false;
        service.updateGame(gameToUpdate);
        expect(addGameSpy).toHaveBeenCalled();
    });
    it('verifyGameExists should set gameExists to true if game exists', () => {
        const gameToVerify: Game = new Game(Object.assign({ ...mockGames[0] }));
        service.verifyGameExists(gameToVerify).subscribe((result) => {
            expect(result).toEqual(gameToVerify);
            expect(service.gameExists).toEqual(true);
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/games/${gameToVerify.id}`);
        req.flush(gameToVerify);
    });
    it('updateGameVisibility should make a patch request', () => {
        const gameToUpdate: Game = Object.assign({ ...mockGames[0] });
        service.updateGameVisibility(gameToUpdate.id, true).subscribe((result) => {
            expect(result).toEqual(gameToUpdate);
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/games/${gameToUpdate.id}/update-visibility`);
        expect(req.request.method).toBe('PATCH');
        req.flush(gameToUpdate);
    });
    it('validateName should make a post request', () => {
        const gameToValidate: Game = Object.assign({ ...mockGames[0] });
        service.validateName(gameToValidate.title).subscribe();
        const req = httpMock.expectOne(`${environment.serverUrl}/games/title`);
        expect(req.request.method).toBe('POST');
        req.flush(true);
    });
    it('getGameList should return a Observable<Game[]>', () => {
        const returnValue = service.getGameList();
        expect(returnValue).toBeInstanceOf(Observable<Game[]>);
    });
});
