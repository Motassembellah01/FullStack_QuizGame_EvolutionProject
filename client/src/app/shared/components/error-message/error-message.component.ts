import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ErrorMessageService } from '@app/core/services/error-message/error-message.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-error-message',
    standalone: true,
    imports: [MatCardModule, MatIconModule, TranslateModule],
    templateUrl: './error-message.component.html',
    styleUrl: './error-message.component.scss',
})
export class ErrorMessageComponent implements OnInit, OnDestroy {
    @Input() errorMessages: string[] = [];
    constructor(private readonly errorMessageService: ErrorMessageService) {}
    ngOnDestroy(): void {
        if (this.errorMessageService.shouldResetErrorMessage) {
            this.errorMessageService.errorMessage = '';
        }
    }

    ngOnInit(): void {
        this.errorMessageService.sharingServerErrors.subscribe((errors: string[]) => {
            this.errorMessages = errors;
        });

        if (this.errorMessageService.errorMessage.trim() !== '') {
            this.errorMessages = [this.errorMessageService.errorMessage];
        }
        this.errorMessageService.shouldResetErrorMessage = true;
    }
}
