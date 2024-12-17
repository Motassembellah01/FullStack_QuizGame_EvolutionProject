import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppMaterialModule } from '@app/modules/material.module';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-alert-dialog',
  standalone: true,
  imports: [TranslateModule, CommonModule, AppMaterialModule],
  templateUrl: './alert-dialog.component.html',
  styleUrl: './alert-dialog.component.scss'
})
export class AlertDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; messages: string[] },
  ) {

  }

}
