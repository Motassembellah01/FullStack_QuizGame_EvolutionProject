// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { AuthService } from '@auth0/auth0-angular'; // Use the correct AuthService import here
// import { AppMaterialModule } from '@app/modules/material.module';
// import { LoginFailComponent } from './login-fail.component';

// describe('LoginFailComponent', () => {
//     let component: LoginFailComponent;
//     let fixture: ComponentFixture<LoginFailComponent>;
//     let spyAuthService: jasmine.SpyObj<AuthService>;
//     let spyRouter: jasmine.SpyObj<Router>;

//     beforeEach(() => {
//         spyAuthService = jasmine.createSpyObj('AuthService', ['logout']);
//         spyRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

//         TestBed.configureTestingModule({
//             imports: [AppMaterialModule, FormsModule, LoginFailComponent, CommonModule],
//             providers: [
//                 { provide: AuthService, useValue: spyAuthService },
//                 { provide: Router, useValue: spyRouter },
//                 { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'testID' } } } },
//             ],
//         });
//         fixture = TestBed.createComponent(LoginFailComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it('should call logout when onLogin is called', () => {
//         component.onLogin();
//         expect(spyAuthService.logout).toHaveBeenCalled();
//     });

//     it('should call onLogin when the Enter button is pressed', () => {
//         spyOn(component, 'onLogin');
//         const event = new KeyboardEvent('keydown', { key: 'Enter' });
//         window.dispatchEvent(event);
//         fixture.detectChanges();
//         expect(component.onLogin).toHaveBeenCalled();
//     });
// });
