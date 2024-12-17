import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { DIALOG_MESSAGE_EN, DIALOG_MESSAGE_FR } from '@app/core/constants/constants';
import { MatchCommunicationService } from '@app/core/http/services/match-communication/match-communication.service';
import { DisplayableMatchHistory } from '@app/core/interfaces/displayable-match-history';
import { MatchHistory } from '@app/core/interfaces/match-history';
import { CancelConfirmationService } from '@app/core/services/cancel-confirmation/cancel-confirmation.service';
import { AppMaterialModule } from '@app/modules/material.module';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';

@Component({
    selector: 'app-history',
    templateUrl: './history.component.html',
    styleUrls: ['./history.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, LogoComponent, CommonModule, RouterModule],
})
export class HistoryComponent implements OnInit {
    @ViewChild(MatSort) sort: MatSort;
    dataSource: MatTableDataSource<DisplayableMatchHistory>;
    displayedColumns: string[] = ['gameName', 'bestScore', 'nStartPlayers', 'startTime'];

    constructor(
        private confirmationService: CancelConfirmationService,
        public matchCommunicationService: MatchCommunicationService,
        private translateService: TranslateService,
    ) {}

    ngOnInit(): void {
        this.setDataSource();
    }

    setDataSource(): void {
        this.matchCommunicationService
            .getMatchHistory()
            .pipe(
                tap((matchHistory) => {
                    this.dataSource = new MatTableDataSource(this.convertToDisplayableMatchHistory(matchHistory));
                    this.dataSource.sort = this.sort;
                }),
            )
            .subscribe();
    }

    deleteMatchHistory(): void {
        let dialogMessage;
        if (this.translateService.currentLang === 'fr') {
            dialogMessage = DIALOG_MESSAGE_FR.clearHistory;
        } else {
            dialogMessage = DIALOG_MESSAGE_EN.clearHistory;
        }

        this.confirmationService.askConfirmation(() => {
            this.matchCommunicationService.deleteMatchHistory().subscribe(this.setDataSource.bind(this));
        }, dialogMessage);
    }

    convertToDisplayableMatchHistory(matchHistory: MatchHistory[]): DisplayableMatchHistory[] {
        return matchHistory.map((data) => {
            return {
                matchAccessCode: data.matchAccessCode,
                bestScore: data.bestScore,
                startTime: new Date(data.startTime),
                nStartPlayers: data.nStartPlayers,
                gameName: data.gameName,
            };
        });
    }
}
