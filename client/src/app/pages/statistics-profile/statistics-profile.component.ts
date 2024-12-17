import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { StatisticsProfileDto } from '@app/core/http/models/account/statistics-profile.dto';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { Account } from '@app/core/interfaces/account/account';
import { AppMaterialModule } from '@app/modules/material.module';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-statistics-profile',
    standalone: true,
    imports: [LogoComponent, MatCardModule, RouterModule, AppMaterialModule, TranslateModule, CommonModule],
    templateUrl: './statistics-profile.component.html',
    styleUrl: './statistics-profile.component.scss',
})
export class StatisticsProfileComponent implements OnInit {
    constructor(public accountService: AccountService) {}
    displayedColumns: string[] = ['numberPlayedGames', 'numberWonGames', 'averageCorrectAnswers', 'averageTimePerGame'];
    dataSource: MatTableDataSource<StatisticsProfileDto>;
    profileStatistics: StatisticsProfileDto = {
        numberPlayedGames: 0,
        numberWonGames: 0,
        averageCorrectAnswers: 0,
        averageTimePerGameMinute: 0,
        averageTimePerGameSecond: 0,
    };

    ngOnInit(): void {
        this.accountService.getAccount().subscribe((account: Account) => {
            this.profileStatistics.averageCorrectAnswers = account.avgQuestionsCorrect;
            this.profileStatistics.averageTimePerGameMinute = Math.floor(account.avgTimePerGame / 60);
            this.profileStatistics.averageTimePerGameSecond = Math.round(account.avgTimePerGame % 60);
            this.profileStatistics.numberPlayedGames = account.gamesPlayed;
            this.profileStatistics.numberWonGames = account.gamesWon;
            this.dataSource = new MatTableDataSource([this.profileStatistics]);
            this.accountService.account = account;
        });
    }
}
