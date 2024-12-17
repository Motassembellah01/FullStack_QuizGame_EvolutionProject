// import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
// import { provideHttpClientTesting } from '@angular/common/http/testing';
// import { TestBed } from '@angular/core/testing';
// import { provideAuth0 } from '@auth0/auth0-angular';
// import { AppComponent } from './app.component';

// describe('AppComponent', () => {
//     beforeEach(async () => {
//         await TestBed.configureTestingModule({
//             imports: [AppComponent],
//             providers: [
//                 provideHttpClient(withInterceptorsFromDi()),
//                 provideHttpClientTesting(),
//                 provideAuth0({
//                     domain: 'polyquiz.ca.auth0.com',
//                     clientId: 'G1cCt7EvlLE6kM2E21oTBc1nfmDbvD8P',
//                     authorizationParams: {
//                         audience: 'https://polyquiz.com/api',
//                         // eslint-disable-next-line @typescript-eslint/naming-convention
//                         redirect_uri: 'http://localhost:4200/home',
//                     },
//                     cacheLocation: 'localstorage',
//                     useRefreshTokens: true,
//                 }),
//             ]
//         }).compileComponents();
//     });

//     it('should create the app', () => {
//         const fixture = TestBed.createComponent(AppComponent);
//         const app = fixture.componentInstance;
//         expect(app).toBeTruthy();
//     });
// });
