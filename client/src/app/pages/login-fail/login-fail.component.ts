import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@app/core/services/auth-service/auth.service';
import { ErrorMessageService } from '@app/core/services/error-message/error-message.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { ErrorMessageComponent } from '@app/shared/components/error-message/error-message.component';
import { LogoComponent } from '@app/shared/components/logo/logo.component';

/**
 * The `loginFailComponent` is responsible for providing user authentication functionality in the application.
 * Users can input a password to log in, and this component interacts with the authentication service to determine
 * if the provided password is correct. Upon successful login, the user is redirected to the administrative dashboard;
 * otherwise, an error message is displayed.
 *
 * @class AuthenticationComponent
 */

@Component({
    selector: 'app-login-fail',
    templateUrl: './login-fail.component.html',
    styleUrls: ['./login-fail.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, LogoComponent, FormsModule, CommonModule, RouterModule, ErrorMessageComponent],
})
export class LoginFailComponent implements OnInit {
    constructor(
        public auth: AuthService,
        public router: Router,
        private errorMessageService: ErrorMessageService,
    ) {}
    @HostListener('window:keydown.enter', ['$event'])
    onEnterKey(): void {
        this.onLogin();
    }
    ngOnInit(): void {
        this.errorMessageService.errorMessage = "L'utilisateur est déjà connecté avec un autre client";
        this.errorMessageService.shouldResetErrorMessage = false;
    }

    onLogin(): void {
        this.auth.login();
    }
}
