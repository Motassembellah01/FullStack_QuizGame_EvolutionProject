import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth-service/auth.service';
import { AdminRoadGuard } from './admin-road.guard';

describe('adminRoadGuard', () => {
    let service: AdminRoadGuard;
    let spyRouter: jasmine.SpyObj<Router>;
    let spyAuthService: jasmine.SpyObj<AuthService>;
    beforeEach(() => {
        spyAuthService = jasmine.createSpyObj('AuthService', ['isLogged']);
        spyRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: spyAuthService },
                { provide: Router, useValue: spyRouter },
            ],
        });
        service = TestBed.inject(AdminRoadGuard);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should allow users if they are authenticated', () => {
        spyAuthService.isLogged.and.returnValue(true);
        expect(service.canActivate()).toEqual(true);
    });
    it('should redirect users to home if they are not authenticated', () => {
        spyAuthService.isLogged.and.returnValue(false);
        service.canActivate();
        expect(spyRouter.navigateByUrl).toHaveBeenCalledWith('administration');
    });
});
