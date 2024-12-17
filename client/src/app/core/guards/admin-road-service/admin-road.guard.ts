import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth-service/auth.service';

@Injectable({
    providedIn: 'root',
})

/**
 * Service that check if the current user has received a token from the dynamic server
 * to give him access or not to the administration/xxx routes
 */
export class AdminRoadGuard {
    constructor(
        private auth: AuthService,
        private router: Router,
    ) {}

    canActivate(): boolean {
        const isLogged = this.auth.isLogged();
        if (!isLogged) this.router.navigateByUrl('administration');
        return isLogged;
    }
}
