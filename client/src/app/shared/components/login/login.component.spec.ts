import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { JoinMatchService } from '@app/core/services/join-match/join-match.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let joinMatchService: JoinMatchService;

    beforeEach(() => {
        joinMatchService = jasmine.createSpyObj('JoinMatchService', ['isValidAccessCode']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, FormsModule, LoginComponent],
            providers: [
                { provide: JoinMatchService, useValue: joinMatchService },
                provideHttpClient(withInterceptorsFromDi()),
                { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'testID' } } } },
            ],
        });
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
