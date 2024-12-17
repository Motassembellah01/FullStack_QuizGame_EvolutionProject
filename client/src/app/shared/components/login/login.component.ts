import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Component that provides the template for the login :
 * To enter match access code and to enter the player's name
 *
 * @class LoginComponent
 */
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, FormsModule, RouterModule, TranslateModule],
})
export class LoginComponent {
    @Input() title: string;
    @Input() text: string;
    @Input() inputType: string;
    @Input() label: string;
    constructor() {}
}
