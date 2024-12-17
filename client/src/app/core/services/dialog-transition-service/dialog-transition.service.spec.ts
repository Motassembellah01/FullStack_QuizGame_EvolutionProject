import { TestBed } from '@angular/core/testing';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DIALOG, TRANSITIONS_DURATIONS, TRANSITIONS_MESSAGES } from '@app/core/constants/constants';
import { TransitionDialogComponent } from '@app/shared/components/transition-dialog/transition-dialog.component';
import { DialogTransitionService } from './dialog-transition.service';

describe('DialogTransitionService', () => {
    let service: DialogTransitionService;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;
    let matDialogRefSpy: jasmine.SpyObj<MatDialogRef<TransitionDialogComponent>>;

    beforeEach(() => {
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

        TestBed.configureTestingModule({
            providers: [
                { provide: MatDialog, useValue: matDialogSpy },
                { provide: MatDialogRef, useValue: matDialogRefSpy },
            ],
        });
        service = TestBed.inject(DialogTransitionService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should open dialog transition with right parameters', () => {
        const config = {
            width: DIALOG.transitionWidth,
            height: DIALOG.transitionHeight,
            disableClose: true,
            data: { transitionText: TRANSITIONS_MESSAGES.beginMatch, maxTime: TRANSITIONS_DURATIONS.startOfTheGame },
        };
        service.openTransitionDialog(TRANSITIONS_MESSAGES.beginMatch, TRANSITIONS_DURATIONS.startOfTheGame);
        expect(service.dialog.open).toHaveBeenCalledWith(TransitionDialogComponent, config);
    });
});
