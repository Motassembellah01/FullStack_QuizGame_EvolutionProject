import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { Game } from '@app/core/classes/game/game';
import { QCM_TIME } from '@app/core/constants/constants';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { CreateQuestionComponent } from '@app/shared/components/create-question/create-question.component';
import { QuestionListComponent } from '@app/shared/components/question-list/question-list.component';
import { Subject } from 'rxjs';
import { GameFormComponent } from './game-form.component';

describe('GameFormComponent', () => {
    let component: GameFormComponent;
    let fixture: ComponentFixture<GameFormComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameServiceService>;
    let spyGame: jasmine.SpyObj<Game>;
    let matDialogSpy: unknown;
    let routerSpy: { events: Subject<NavigationEnd> };

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameServiceService', ['validateQcmTime', 'validateTextField', 'resetCurrentGame']);
        spyGame = jasmine.createSpyObj('Game', ['validateQcmTime', 'validateTextField', 'validateOtherAttributes', 'hasAtLeastOneQuestion']);
        gameServiceSpy.currentGame = spyGame;
        routerSpy = { events: new Subject<NavigationEnd>() };
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, FormsModule, GameFormComponent, QuestionListComponent, CommonModule],
            providers: [
                { provide: GameServiceService, useValue: gameServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });
        fixture = TestBed.createComponent(GameFormComponent);
        component = fixture.componentInstance;
        spyOn(window, 'alert').and.stub();
        matDialogSpy = spyOn(component['dialog'], 'open');
    });

    it('should create', () => {
        fixture.detectChanges();
        const navigationEndEvent = new NavigationEnd(1, 'url', 'urlAfterRedirects');
        routerSpy.events.next(navigationEndEvent);
        expect(component).toBeTruthy();
        expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
    });

    it('should call gameService.validateQcmTime when calling validateQcmTime', () => {
        component.validateQcmTime();
        expect(gameServiceSpy.currentGame.validateQcmTime).toHaveBeenCalled();
    });

    it('should send alert when gameService.validateQcmTime returns false', () => {
        spyGame.validateQcmTime.and.returnValue(false);
        component.validateQcmTime();
        expect(window.alert).toHaveBeenCalled();
    });

    it('should set currentGame.duration to QCM_TIME_MAX when its greater than the limit', () => {
        spyGame.validateQcmTime.and.returnValue(false);
        gameServiceSpy.currentGame.duration = 70;
        component.validateQcmTime();
        expect(gameServiceSpy.currentGame.duration).toEqual(QCM_TIME.max);
    });

    it('should set currentGame.duration to QCM_TIME_MIN when its smaller than the limit', () => {
        spyGame.validateQcmTime.and.returnValue(false);
        gameServiceSpy.currentGame.duration = 5;
        component.validateQcmTime();
        expect(gameServiceSpy.currentGame.duration).toEqual(QCM_TIME.min);
    });

    it('should call gameService.validateTextField when calling validateQcmTime', () => {
        component.validateNameInput();
        expect(gameServiceSpy.currentGame.validateTextField).toHaveBeenCalled();
    });

    it('should call gameService.validateTextField when calling validateDescriptionInput', () => {
        component.validateDescriptionInput();
        expect(gameServiceSpy.currentGame.validateTextField).toHaveBeenCalled();
    });

    it('should call dialog.open when calling onOpenQuestionForm', () => {
        component.onOpenQuestionForm();
        expect(matDialogSpy).toHaveBeenCalledWith(CreateQuestionComponent, { width: '80%', disableClose: true });
    });
});
