import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [AuthService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    describe('login', () => {
        it('should set the token and return true when login is successful', () => {
            const mockTokenResponse = { token: 'mockToken' };
            const password = 'password';
            service.login(password).subscribe((result) => {
                expect(result).toBe(true);
                expect(service.isLogged()).toBe(true);
            });
            const req = httpMock.expectOne(`${environment.serverUrl}/auth`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ pwd: password });

            req.flush(mockTokenResponse);
        });

        it('should return false when login fails', () => {
            const password = 'incorrectPassword';

            service.login(password).subscribe((result: boolean) => {
                expect(result).toBe(false);
                expect(service.isLogged()).toBe(false);
            });

            const req = httpMock.expectOne(`${environment.serverUrl}/auth`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ pwd: password });

            req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
        });
    });

    describe('isLogged', () => {
        it('should return true when a token is set', () => {
            service['token'] = 'mockToken';

            const result = service.isLogged();

            expect(result).toBe(true);
        });

        it('should return false when a token is not set', () => {
            service['token'] = '';

            const result = service.isLogged();

            expect(result).toBe(false);
        });
    });
});
