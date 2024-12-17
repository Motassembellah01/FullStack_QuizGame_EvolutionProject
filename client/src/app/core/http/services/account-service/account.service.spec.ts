import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@auth0/auth0-angular';
import { of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AccountService } from './account.service';

describe('AccountService', () => {
    let service: AccountService;
    let httpTestingController: HttpTestingController;
    let mockAuthService: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        mockAuthService = jasmine.createSpyObj('AuthService', [], {
            user$: of({ sub: 'user123' }),
        });

        TestBed.configureTestingModule({
            imports: [],
            providers: [
                AccountService,
                { provide: AuthService, useValue: mockAuthService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(AccountService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send delete request if user has valid sub', () => {
        service.deleteSession().subscribe();

        const req = httpTestingController.expectOne(`${environment.serverUrl}/session/user123`);
        expect(req.request.method).toBe('DELETE');
        req.flush(null);
    });
});
