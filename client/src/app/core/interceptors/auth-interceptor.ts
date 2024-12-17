import { HttpInterceptorFn } from '@angular/common/http';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    if (req.headers.has('Authorization')) {
        return next(req);
    }



    return from((window as any).electronAPI.getAccessToken()).pipe(
        switchMap((token) => {
            const clonedRequest = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${token}`),
            });
            return next(clonedRequest);
        }),
    );
};
