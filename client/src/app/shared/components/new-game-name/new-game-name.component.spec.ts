import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { GameServiceService } from '@app/core/http/services/game-service/game-service.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { NewGameNameComponent } from './new-game-name.component';

describe('NewNameComponent', () => {
    let component: NewGameNameComponent;
    let fixture: ComponentFixture<NewGameNameComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameServiceService>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<NewGameNameComponent>>;

    beforeEach(() => {
        gameServiceSpy = jasmine.createSpyObj('GameServiceService', ['currentGame', 'resetCurrentGame']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [AppMaterialModule, FormsModule, NewGameNameComponent],
            providers: [
                { provide: GameServiceService, useValue: gameServiceSpy },
                { provide: MatDialogRef, useValue: matDialogRefSpy },
            ],
        });
        fixture = TestBed.createComponent(NewGameNameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update current game name and close dialog onSave', () => {
        component.name = 'Name';
        component.onSave();
        expect(gameServiceSpy.currentGame.title).toEqual('Name');
        expect(matDialogRefSpy.close).toHaveBeenCalled();
    });

    it('should cancel modification when onCancel is called', () => {
        gameServiceSpy.resetCurrentGame.and.stub();
        component.onCancel();
        expect(gameServiceSpy.adminCanceledImport).toEqual(true);
        expect(gameServiceSpy.resetCurrentGame).toHaveBeenCalled();
        expect(matDialogRefSpy.close).toHaveBeenCalled();
    });
});
