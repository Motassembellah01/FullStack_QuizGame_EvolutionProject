import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})

/**
 * Service that manages the authentication: validate the password
 */
export class AuthService {
    profile: any;
    token: any;
    constructor() {
        (window as any).electronAPI.getProfile().then((profile: any) => {
            this.profile = profile;
        });

        (window as any).electronAPI.getAccessToken().then((token: any) => {
            this.token = token;
        });
    }

    getProfile() {
        return this.profile;
    }

    async logout() {
        await (window as any).electronAPI.logOut();
    }

    async login() {
        await (window as any).electronAPI.logIn();
    }

    getAccessToken() {
        return this.token;
    }
}
