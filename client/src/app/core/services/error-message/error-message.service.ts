import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class ErrorMessageService {
    errorMessage: string = '';
    shouldResetErrorMessage: boolean = true;
    private serverErrorsSubject = new Subject<string[]>();
    // eslint-disable-next-line @typescript-eslint/member-ordering
    sharingServerErrors: Observable<string[]> = this.serverErrorsSubject.asObservable();

    shareErrors(errors: string[]) {
        this.serverErrorsSubject.next(errors);
    }
}
