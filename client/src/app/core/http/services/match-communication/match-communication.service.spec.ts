import { TestBed } from '@angular/core/testing';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Game } from '@app/core/classes/game/game';
import { Match } from '@app/core/classes/match/match';
import { GAMES, MATCHES_HISTORY } from '@app/core/data/data';
import { MatchHistory } from '@app/core/interfaces/match-history';
import { Player } from '@app/core/interfaces/player';
import { environment } from 'src/environments/environment';
import { MatchCommunicationService } from './match-communication.service';

describe('MatchCommunicationService', () => {
    let service: MatchCommunicationService;
    let httpMock: HttpTestingController;
    const expectedMatch: Match = new Match();
    const mockGames: Game[] = GAMES.map((obj) => Object.assign({ ...obj }));
    const matchesHistoryMock: MatchHistory[] = MATCHES_HISTORY.map((obj) => Object.assign({ ...obj }));

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
        });
        service = TestBed.inject(MatchCommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        expectedMatch.accessCode = '1234';
        expectedMatch.game = new Game(mockGames[0]);
        expectedMatch.players.push({ name: 'test' } as Player);
        spyOn(window, 'alert').and.stub();
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('isValidAccessCode should return false if no accessCode is provided', () => {
        const testAccessCode = '';
        service.isValidAccessCode(testAccessCode).subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(false);
            },
            error: fail,
        });
    });

    it('isValidAccessCode should make a get request if an accessCode is provided', () => {
        const testAccessCode = '1234';
        service.isValidAccessCode(testAccessCode).subscribe();
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/validity/${testAccessCode}`);
        expect(req.request.method).toBe('GET');
    });

    it('isValidAccessCode should be false if the accessCode does not exist', () => {
        const testAccessCode = '1235';
        service.isValidAccessCode(testAccessCode).subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(false);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/validity/${testAccessCode}`);
        req.flush(testAccessCode === expectedMatch.accessCode);
    });

    it('isValidAccessCode should be true if the accessCode exists', () => {
        const testAccessCode = '1234';
        service.isValidAccessCode(testAccessCode).subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(true);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/validity/${testAccessCode}`);
        req.flush(testAccessCode === expectedMatch.accessCode);
    });

    it('isValidAccessCode should handle error', () => {
        const testAccessCode = '1234';
        service.isValidAccessCode(testAccessCode).subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(false);
            },
            error: () => {
                expect(window.alert).toHaveBeenCalled();
            },
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/validity/${testAccessCode}`);
        req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('validatePlayerName should make a post request if an accessCode is provided', () => {
        const testAccessCode = '1234';
        const testName = 'test';
        service.validatePlayerName(testAccessCode, testName).subscribe();
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/playerNameValidity`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ accessCode: testAccessCode, name: testName });
    });

    it('validatePlayerName should validate if a name is already used in the match', () => {
        const testAccessCode = '1234';
        const testName = 'test';
        service.validatePlayerName(testAccessCode, testName).subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(true);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/playerNameValidity`);
        req.flush(!!expectedMatch.players.find((player) => player.name === testName));
    });

    it('validatePlayerName should should handle error', () => {
        const testAccessCode = '1234';
        const testName = 'test';
        service.validatePlayerName(testAccessCode, testName).subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(false);
            },
            error: () => {
                expect(window.alert).toHaveBeenCalled();
            },
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/playerNameValidity`);
        req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('isMatchAccessible should make a get request and return correct match accessibility', () => {
        const testAccessCode = '1234';
        expectedMatch.isAccessible = true;
        service.isMatchAccessible(testAccessCode).subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(true);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/accessibility/${testAccessCode}`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedMatch.isAccessible);
    });

    it('isMatchAccessible should handle error', () => {
        const testAccessCode = '1234';
        service.isMatchAccessible(testAccessCode).subscribe({
            next: (response: boolean) => {
                expect(response).toEqual(false);
            },
            error: () => {
                expect(window.alert).toHaveBeenCalled();
            },
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/accessibility/${testAccessCode}`);
        req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('setAccessibility should update accessibility and handle error', () => {
        const testAccessCode = '1234';
        service.setAccessibility(testAccessCode).subscribe({
            error: () => {
                expect(window.alert).toHaveBeenCalled();
            },
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/accessibility/${testAccessCode}`);
        expect(req.request.method).toBe('PATCH');

        req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('createMatch should create a match and handle error', () => {
        service.createMatch(expectedMatch).subscribe({
            error: () => {
                expect(window.alert).toHaveBeenCalled();
            },
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match`);
        expect(req.request.method).toBe('POST');

        req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('deleteMatchByAccessCode should DELETE a match and handle error', () => {
        const testAccessCode = '1234';
        service.deleteMatchByAccessCode(testAccessCode).subscribe({
            error: () => {
                expect(window.alert).toHaveBeenCalled();
            },
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/${testAccessCode}`);
        expect(req.request.method).toBe('DELETE');

        req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('saveMatchHistory should make a POST request to the right path and handle error', () => {
        const testAccessCode = '1234';
        service.saveMatchHistory(testAccessCode).subscribe({
            error: () => {
                expect(window.alert).toHaveBeenCalled();
            },
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/match/${testAccessCode}/history`);
        expect(req.request.method).toBe('POST');

        req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('getMatchHistory should make a GET request to the right path', () => {
        service.getMatchHistory().subscribe({
            next: (matchHistory: MatchHistory[]) => {
                expect(matchHistory).toEqual(matchesHistoryMock);
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/history`);
        expect(req.request.method).toBe('GET');

        req.flush(matchesHistoryMock);
    });

    it('deleteMatchHistory should make DELETE request and handle error', () => {
        service.deleteMatchHistory().subscribe({
            error: () => {
                expect(window.alert).toHaveBeenCalled();
            },
        });
        const req = httpMock.expectOne(`${environment.serverUrl}/matches/history`);
        expect(req.request.method).toBe('DELETE');

        req.flush(null, { status: 404, statusText: 'Not Found' });
    });
});
