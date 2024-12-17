import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ErrorMessageService } from '@app/core/services/error-message/error-message.service';
import { TranslateService } from '@ngx-translate/core';
import { catchError, finalize, Observable, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (request: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const errorMessageService = inject(ErrorMessageService);
    const translateService = inject(TranslateService);
    const language = translateService.currentLang ?? 'fr';
    let hasError = false;
    return next(request).pipe(
        catchError((returnedError) => {
            hasError = true;
            if (returnedError instanceof HttpErrorResponse) {
                handleServerSideError(returnedError, errorMessageService, language);
            }
            return throwError(() => returnedError);
        }),
        finalize(() => {
            if (!hasError) {
                errorMessageService.shareErrors([]);
            }
        })
    );
};

const handleServerSideError = (errorResponse: HttpErrorResponse, errorMessageService: ErrorMessageService, lang: string) => {
    const errors = extractErrors(errorResponse, lang);

    // If server responds with unknown error, on affiche l'erreur par défaut
    if (errors.length === 0) {
        emitDefaultError(errorMessageService, lang);
        return;
    }
    errorMessageService.shareErrors(errors);
    // On peut faire un traitement différent selon le code d'erreur (400-500 etc)
};

const extractErrors = (errorResponse: HttpErrorResponse, lang: string): string[] => {
    const errors = errorResponse.error || {};

    if (errors['error'] && errors['error'][lang]) {
        return [errors['error'][lang]];
    }

    return [];
};

const emitDefaultError = (errorMessageService: ErrorMessageService, lang: string) => {
    errorMessageService.shareErrors([lang === 'fr' ?
        "L'opération ne peut pas être coplétée. Si le problème persiste, veuillez contacter l'équipe d'assistance."
        : "The operation could not be completed. If the problem persists, please contact support."]);
};
