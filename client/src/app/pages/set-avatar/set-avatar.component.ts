import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { Router } from '@angular/router';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { AlertDialogComponent } from '@app/shared/alert-dialog/alert-dialog.component';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-set-avatar',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatGridListModule, MatButtonModule, TranslateModule, LogoComponent],
    templateUrl: './set-avatar.component.html',
    styleUrl: './set-avatar.component.scss',
})
export class SetAvatarComponent {
    selectedAvatar: string | null = null;
    constructor(
        public accountService: AccountService,
        private readonly router: Router,
        private dialog: MatDialog,
    ) {}

    avatars = ['m1.png', 'm2.png', 'w1.jpg', 'm3.png'];

    selectAvatar(avatar: string) {
        this.selectedAvatar = avatar;
    }

    submitAvatar() {
        if (this.selectedAvatar) {
            this.accountService.updateAvatar(this.selectedAvatar).subscribe((account) => {
                this.accountService.account = account;
                this.router.navigateByUrl('/home');
            });
        }
    }

    triggerFileInput() {
        document.getElementById('avatar-upload')?.click();
    }

    resizeImage(file: File, maxWidth: number, maxHeight: number, callback: (base64: string) => void) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.floor((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.floor((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    callback(resizedBase64);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (file) {
            const allowedTypes = ['image/png', 'image/jpeg'];
            if (!allowedTypes.includes(file.type)) {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: 'ERROR_MESSAGE_FOR.INVALID_FILE_TYPE',
                        messages: [],
                    },
                });
                return;
            }

            const maxWidth = 100;
            const maxHeight = 100;

            this.resizeImage(file, maxWidth, maxHeight, (resizedBase64) => {
                this.selectedAvatar = resizedBase64;
            });
        }
    }
}
