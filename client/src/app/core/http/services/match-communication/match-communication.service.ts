import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CreateMatchDto } from '@app/core/classes/match/dto/create-match.dto';
import { CurrentMatchesDto } from '@app/core/classes/match/dto/current-matches.dto';
import { Match } from '@app/core/classes/match/match';
import { MatchHistory } from '@app/core/interfaces/match-history';
import { Validation } from '@app/core/interfaces/validation';
import { AlertDialogComponent } from '@app/shared/alert-dialog/alert-dialog.component';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * This class allows to centralize la communication with the server during a match.
 */
@Injectable({
    providedIn: 'root',
})
export class MatchCommunicationService {
    constructor(private httpClient: HttpClient, private dialog: MatDialog) {}

    isValidAccessCode(accessCode: string): Observable<boolean> {
        if (!accessCode) return of(false);
        return this.httpClient.get<boolean>(`${environment.serverUrl}/matches/match/validity/${accessCode}`).pipe(
            map((accessCodeExists) => accessCodeExists),
            catchError(() => {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "GENERAL.ERROR",
                        messages: []
                    }
                });
                return of(false);
            }),
        );
    }

    validatePlayerName(accessCode: string, name: string): Observable<boolean> {
        const validationObject: Validation = {
            accessCode,
            name,
        };
        return this.httpClient.post<boolean>(`${environment.serverUrl}/matches/match/playerNameValidity`, validationObject).pipe(
            map((isPlayerNameValidForGame) => isPlayerNameValidForGame),
            catchError(() => {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "GENERAL.ERROR",
                        messages: []
                    }
                });
                return of(false);
            }),
        );
    }

    isMatchAccessible(accessCode: string): Observable<boolean> {
        return this.httpClient.get<boolean>(`${environment.serverUrl}/matches/match/accessibility/${accessCode}`).pipe(
            map((isAccessible) => isAccessible),
            catchError(() => {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "GENERAL.ERROR",
                        messages: []
                    }
                });
                return of(false);
            }),
        );
    }

    setAccessibility(accessCode: string): Observable<unknown> {
        return this.httpClient.patch(`${environment.serverUrl}/matches/match/accessibility/${accessCode}`, {}).pipe(
            catchError(() => {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "GENERAL.ERROR",
                        messages: []
                    }
                });
                return of();
            }),
        );
    }

    createMatch(createMatchDto: CreateMatchDto): Observable<Match> {
        return this.httpClient.post<Match>(`${environment.serverUrl}/matches/match`, createMatchDto);
    }

    getAllMatches(): Observable<CurrentMatchesDto[]> {
        return this.httpClient.get<CurrentMatchesDto[]>(`${environment.serverUrl}/matches`);
    }

    deleteMatchByAccessCode(accessCode: string): Observable<unknown> {
        return this.httpClient.delete<Match | null>(`${environment.serverUrl}/matches/match/${accessCode}`);
    }

    saveMatchHistory(matchAccessCode: string): Observable<unknown> {
        return this.httpClient.post(`${environment.serverUrl}/matches/match/${matchAccessCode}/history`, null);
    }

    getMatchHistory(): Observable<MatchHistory[]> {
        return this.httpClient.get<MatchHistory[]>(`${environment.serverUrl}/matches/history`);
    }

    deleteMatchHistory(): Observable<unknown> {
        return this.httpClient.delete(`${environment.serverUrl}/matches/history`).pipe(
            catchError(() => {
                this.dialog.open(AlertDialogComponent, {
                    data: {
                        title: "GENERAL.ERROR",
                        messages: []
                    }
                });
                return of();
            }),
        );
    }

    joinMatch(accessCode: string, playerName: string): Observable<any> {
        const body = { accessCode, playerName };
        return this.httpClient.post(`${environment.serverUrl}/matches/join-match`, body);
    }
}
