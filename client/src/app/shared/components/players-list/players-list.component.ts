import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Team } from '@app/core/classes/match/team';
import { FACTORS, PLAYERS_NAME_COLORS } from '@app/core/constants/constants';
import { Player } from '@app/core/interfaces/player';
import { HistogramService } from '@app/core/services/histogram-service/histogram.service';
import { MatchPlayerService } from '@app/core/services/match-player-service/match-player.service';
import { AppMaterialModule } from '@app/modules/material.module';

/**
 * Component that provides the template for the players list with name and score columns.
 * If its the match results view we add a nBonusObtained column,
 * and players are sorted by score in descending order.
 * The list can also be sorted by the client using arrows next to each column title
 *
 * @class PlayersListComponent
 * @implements {OnInit, AfterViewInit}
 */
@Component({
    selector: 'app-players-list',
    templateUrl: './players-list.component.html',
    styleUrls: ['./players-list.component.scss'],
    standalone: true,
    imports: [AppMaterialModule, FormsModule, CommonModule],
})
export class PlayersListComponent implements OnInit, AfterViewInit {
    @ViewChild(MatSort) sort: MatSort;
    @Input() isResultView: boolean = false;
    displayedColumns: string[] = ['name', 'score'];
    blockedPlayerName: string[];
    isSortingByStateAscending: boolean = false;
    isSortingByPlayersState: boolean = false;

    constructor(
        public matchPlayerService: MatchPlayerService,
        private readonly histogramService: HistogramService,
    ) {}

    ngOnInit(): void {
        this.matchPlayerService.initializePlayersList();
        this.clearSortingByPlayersState();
        this.blockedPlayerName = [];
        if (this.matchPlayerService.match.isTeamMatch) {
            this.displayedColumns = ['team', 'players', 'teamScore'];
            this.matchPlayerService.dataSourceTeam = new MatTableDataSource(this.matchPlayerService.match.teams);
        }
        if (this.isResultView) {
            this.displayedColumns = ['name', 'score', 'nBonusObtained'];
            if (this.matchPlayerService.match.isTeamMatch) {
                this.displayedColumns = ['team', 'players', 'teamScore', 'nBonusObtained'];
            }
            this.sortPlayersListByDefault();
        }
    }

    ngAfterViewInit(): void {
        this.matchPlayerService.dataSource.sort = this.sort;
    }

    hasPlayerResponded(playerName: string): boolean {
        return !!this.histogramService.playersAnswered.find((name) => name === playerName);
    }

    playerHasQuitted(playerName: string): boolean {
        return !!this.histogramService.quittedPlayers.find((name) => name === playerName);
    }

    playerHasFinalAnswer(playerName: string): boolean {
        return !!this.histogramService.playersWithFinalAnswers.find((name) => name === playerName);
    }

    getDisplayColor(playerName: string): string {
        return PLAYERS_NAME_COLORS.black;
    }

    sortPlayersListByDefault(): void {
        this.matchPlayerService.dataSource.data.sort((firstPlayer, nextPlayer) => {
            const scoreComparison = nextPlayer.score - firstPlayer.score;
            if (scoreComparison === 0) {
                return firstPlayer.name.localeCompare(nextPlayer.name);
            }
            return scoreComparison;
        });
        this.matchPlayerService.dataSource.sort = this.sort;
    }

    sortByPlayersState(): void {
        this.sort?.sort({ id: '', start: 'asc', disableClear: false });
        if (!this.isSortingByStateAscending && this.isSortingByPlayersState) {
            this.isSortingByPlayersState = false;
            this.matchPlayerService.dataSource.sort = this.sort;
            return;
        }
        this.isSortingByPlayersState = true;
        this.isSortingByStateAscending = !this.isSortingByStateAscending;
        const factor = this.isSortingByStateAscending ? FACTORS.ascendingSort : FACTORS.descendingSort;
        this.matchPlayerService.dataSource.data.sort((firstPlayer, nextPlayer) => {
            const stateComparison = factor * this.comparePlayersStates(firstPlayer, nextPlayer);
            if (stateComparison === 0) {
                return firstPlayer.name.localeCompare(nextPlayer.name);
            }
            return stateComparison;
        });
        this.matchPlayerService.dataSource.sort = this.sort;
    }

    comparePlayersStates(firstPlayer: Player, nextPlayer: Player): number {
        const colorsOrder: string[] = [PLAYERS_NAME_COLORS.black, PLAYERS_NAME_COLORS.green, PLAYERS_NAME_COLORS.yellow, PLAYERS_NAME_COLORS.red];
        return (
            colorsOrder.findIndex((color) => this.getDisplayColor(firstPlayer.name) === color) -
            colorsOrder.findIndex((color) => this.getDisplayColor(nextPlayer.name) === color)
        );
    }

    clearSortingByPlayersState(): void {
        this.isSortingByPlayersState = false;
        this.isSortingByStateAscending = false;
    }

    // sendChatAccessibility(name: string): void {
    //     this.matchPlayerService.match.players.forEach((player) => {
    //         if (player.name === name) {
    //             player.chatBlocked = !player.chatBlocked;
    //         }
    //     });
    //     this.matchPlayerService.socketService.send<ChatAccessibilityRequest>(SocketsSendEvents.ChangeChatAccessibility, {
    //         matchAccessCode: this.matchPlayerService.match.accessCode,
    //         name,
    //         players: this.matchPlayerService.match.players,
    //     });
    // }

    calculateTeamBonus(team: Team): number {
        const match = this.matchPlayerService.match;
        const players = team.players
            .map(playerName => {
                const index = match.findPlayerIndexByName(playerName);
                return index !== -1 ? match.players[index] : null;
            })
            .filter(player => player !== null);
        return players.reduce((totalBonus, player) => {
            return totalBonus + (player?.nBonusObtained || 0);
        }, 0);
    }
}
