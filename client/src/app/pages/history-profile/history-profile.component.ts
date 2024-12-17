import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { SessionHistoryDto } from '@app/core/http/models/account/session-history.dto';
import { AccountService } from '@app/core/http/services/account-service/account.service';
import { Account } from '@app/core/interfaces/account/account';
import { PlayerMatchHistory } from '@app/core/interfaces/account/player-match-history';
import { AppMaterialModule } from '@app/modules/material.module';
import { LogoComponent } from '@app/shared/components/logo/logo.component';
import { PaginatorComponent } from '@app/shared/components/paginator/paginator.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-history-profile',
  standalone: true,
  imports: [LogoComponent, PaginatorComponent, RouterModule, AppMaterialModule, CommonModule, TranslateModule],
  templateUrl: './history-profile.component.html',
  styleUrl: './history-profile.component.scss',
})
export class HistoryProfileComponent implements OnInit {
  constructor(public accountService: AccountService) {}

  displayedColumnsGame: string[] = ['gameName', 'startTime', 'status'];
  displayedColumnsSession: string[] = ['DateHeureConnexion', 'DateHeureDeconnexion'];

  profileSessionHistoryList: SessionHistoryDto[];
  profileMatchHistoryList: PlayerMatchHistory[]


  dataSourceGame: MatTableDataSource<PlayerMatchHistory>;
  dataSourceSession: MatTableDataSource<SessionHistoryDto>;
  defaultPageSize = 4;
  totalGameItems: number;
  totalSessionItems: number;
  ngOnInit(): void {
    this.accountService.getSessionHistory().subscribe((sessionHistory: SessionHistoryDto[]) => {
      this.profileSessionHistoryList = sessionHistory;
      this.dataSourceSession = new MatTableDataSource(sessionHistory);
      this.totalSessionItems = sessionHistory.length;
      this.dataSourceSession.data = sessionHistory.slice(0, this.defaultPageSize);
    });

    this.accountService.getAccount().subscribe((account: Account) => {
      this.profileMatchHistoryList = account.matchHistory;
      this.accountService.account = account;
      this.dataSourceGame = new MatTableDataSource(account.matchHistory);
      this.totalGameItems = account.matchHistory.length;
      this.dataSourceGame.data = account.matchHistory.slice(0, this.defaultPageSize);
    });

  }

  onGamePage(event: PageEvent) {
    const pageIndex = event.pageIndex;
    const pageSize = event.pageSize;
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    this.dataSourceGame.data = this.profileMatchHistoryList.slice(startIndex, endIndex);
  }

  onSessionPage(event: PageEvent) {
    const pageIndex = event.pageIndex;
    const pageSize = event.pageSize;
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    this.dataSourceSession.data = this.profileSessionHistoryList.slice(startIndex, endIndex);
  }
}
