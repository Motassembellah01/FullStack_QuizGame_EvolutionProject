// import { CommonModule } from '@angular/common';
// import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
// import { provideHttpClientTesting } from '@angular/common/http/testing';
// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { ActivatedRoute, RouterModule } from '@angular/router';
// import { AccountService } from '@app/core/http/services/account-service/account.service';
// import { AppMaterialModule } from '@app/modules/material.module';
// import { LogoComponent } from '@app/shared/components/logo/logo.component';
// import { AuthService } from '@auth0/auth0-angular';
// import { MainPageComponent } from './main-page.component';

// describe('MainPageComponent', () => {
//     let component: MainPageComponent;
//     let fixture: ComponentFixture<MainPageComponent>;
//     let spyAccountService: jasmine.SpyObj<AccountService>;
//     let spyAuthService: jasmine.SpyObj<AuthService>;

//     beforeEach(async () => {
//         spyAccountService = jasmine.createSpyObj('AccountService', ['deleteSession']);
//         spyAuthService = jasmine.createSpyObj('AuthService', ['logout']);

//         await TestBed.configureTestingModule({
//             imports: [MainPageComponent, AppMaterialModule, CommonModule, RouterModule, LogoComponent],
//             providers: [
//                 { provide: AccountService, useValue: spyAccountService },
//                 { provide: AuthService, useValue: spyAuthService },
//                 provideHttpClient(withInterceptorsFromDi()),
//                 provideHttpClientTesting(),
//                 { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'testID' } } } },
//             ],
//         }).compileComponents();
//     });

//     beforeEach(() => {
//         fixture = TestBed.createComponent(MainPageComponent);
//         component = fixture.componentInstance;
//         fixture.detectChanges();
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

//     it("should have as title 'CooQuiz'", () => {
//         expect(component.title).toEqual('CooQuiz');
//     });
// });
