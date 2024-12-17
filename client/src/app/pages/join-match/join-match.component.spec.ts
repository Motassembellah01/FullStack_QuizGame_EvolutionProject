import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MAX_ACCESS_CODE_LENGTH } from '@app/core/constants/constants';
import { JoinMatchService } from '@app/core/services/join-match/join-match.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { of } from 'rxjs';
import { JoinMatchComponent } from './join-match.component';

describe('JoinMatchComponent', () => {
    let component: JoinMatchComponent;
    let fixture: ComponentFixture<JoinMatchComponent>;
    let joinMatchService: jasmine.SpyObj<JoinMatchService>;
    let matchPlayerService: jasmine.SpyObj<MatchPlayerService>;
    let router: jasmine.SpyObj<Router>;
    @Component({
        selector: 'app-login',
    })
    class MockLoginComponent {
        @Input() title: string;
        @Input() text: string;
        @Input() inputType: string;
        @Input() label: string;
    }

    beforeEach(() => {
        joinMatchService = jasmine.createSpyObj('JoinMatchService', ['isValidAccessCode', 'isMatchAccessible', 'validatePlayerName', 'removeSpace']);
        matchPlayerService = jasmine.createSpyObj('MatchPlayerService', ['hasJoinMatch']);
        router = jasmine.createSpyObj('Router', ['navigateByUrl']);

        TestBed.configureTestingModule({
            declarations: [MockLoginComponent],
            imports: [AppMaterialModule, FormsModule, JoinMatchComponent, LogoComponent, CommonModule],
            providers: [
                { provide: JoinMatchService, useValue: joinMatchService },
                { provide: MatchPlayerService, useValue: matchPlayerService },
                { provide: Router, useValue: router },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'testID' } } } },
            ],
        });

        fixture = TestBed.createComponent(JoinMatchComponent);
        component = fixture.componentInstance;
        spyOn(window, 'alert').and.stub();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should set maxLength', () => {
        component.ngOnInit();
        expect(joinMatchService.maxLength).toEqual(MAX_ACCESS_CODE_LENGTH);
    });

    it('should call onAccessCodeEntry when Enter key is pressed', () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        spyOn(component, 'onAccessCodeEntry').and.callFake(() => {
            return;
        });

        window.dispatchEvent(event);

        expect(component.onAccessCodeEntry).toHaveBeenCalled();
    });

    it('onEnterKey should call onJoinMatch when Enter key is pressed and accessCodeIsValid is true', () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        component.accessCodeIsValid = true;
        spyOn(component, 'onJoinMatch').and.callFake(() => {
            return;
        });
        window.dispatchEvent(event);

        expect(component.onJoinMatch).toHaveBeenCalled();
    });

    it('onAccessCodeEntry should set accessCodeIsValid to true if access code is valid', () => {
        joinMatchService.isValidAccessCode.and.returnValue(of(true));
        joinMatchService.isMatchAccessible.and.returnValue(of(true));

        component.onAccessCodeEntry();

        expect(component.accessCodeIsValid).toBe(true);
    });
    it('onAccessCodeEntry should display an error if the match is not accessible', () => {
        joinMatchService.isValidAccessCode.and.returnValue(of(true));
        joinMatchService.isMatchAccessible.and.returnValue(of(false));
        component.onAccessCodeEntry();

        expect(component.accessCodeIsValid).toBe(false);
        expect(window.alert).toHaveBeenCalled();
    });

    it('onAccessCodeEntry should set accessCodeError to true if access code is invalid', () => {
        joinMatchService.isValidAccessCode.and.returnValue(of(false));

        component.onAccessCodeEntry();

        expect(component.accessCodeError).toBe(true);
    });

    it('onJoinMatch should navigate to the correct URL when match is accessible and player name is valid', () => {
        joinMatchService.isValidAccessCode.and.returnValue(of(true));
        joinMatchService.isMatchAccessible.and.returnValue(of(true));
        joinMatchService.isValidAccessCode.and.returnValue(of(true));
        joinMatchService.validatePlayerName.and.returnValue(of(true));
        joinMatchService.input = 'ValidName';
        joinMatchService.accessCode = '1234';

        component.onJoinMatch();

        expect(router.navigateByUrl).toHaveBeenCalledWith(`play/wait/${joinMatchService.accessCode}`);
    });

    it('onJoinMatch should set nameError to true if player name is invalid', () => {
        joinMatchService.isValidAccessCode.and.returnValue(of(true));
        joinMatchService.isMatchAccessible.and.returnValue(of(true));
        joinMatchService.isValidAccessCode.and.returnValue(of(true));
        joinMatchService.validatePlayerName.and.returnValue(of(false));
        joinMatchService.input = 'InvalidName';

        component.onJoinMatch();

        expect(component.nameError).toBe(true);
    });

    it('onJoinMatch should show an alert if the match is not accessible', () => {
        joinMatchService.isValidAccessCode.and.returnValue(of(true));
        joinMatchService.isMatchAccessible.and.returnValue(of(false));
        joinMatchService.isValidAccessCode.and.returnValue(of(true));
        component.onJoinMatch();

        expect(window.alert).toHaveBeenCalledWith("L'organisateur a verrouillé cette partie");
    });
    it('onJoinMatch should reset parameter service if match is not accessible', () => {
        joinMatchService.isValidAccessCode.and.returnValue(of(false));
        component.onJoinMatch();

        expect(joinMatchService.maxLength).toEqual(MAX_ACCESS_CODE_LENGTH);
        expect(joinMatchService.input).toEqual('');
        expect(joinMatchService.accessCode).toEqual('');
        expect(matchPlayerService.hasJoinMatch).toEqual(false);
    });
});
