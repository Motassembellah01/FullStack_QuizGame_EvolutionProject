import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Language, ThemeVisual } from '@app/core/constants/constants';
import { Account } from '@app/core/interfaces/account/account';
import { FriendRequestData } from '@app/core/interfaces/friend-request-data';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SessionHistoryDto } from '../../models/account/session-history.dto';

@Injectable({
    providedIn: 'root',
})
export class AccountService {
    auth0Id: string;
    account: Account;
    isLightMode: boolean | null = null;
    theme: string;
    money: number;
    ownedThemes: string[];
    ownedAvatars: string[];
    isWinnerPlayerName: boolean = false;

    isInGame: boolean = false;
    isInHomePage: boolean = false;
    constructor(private readonly http: HttpClient) {}

    deleteSession() {
        return this.http.delete(`${environment.serverUrl}/sessions/${this.auth0Id}`);
    }

    getAccount(userID: string = this.auth0Id) {
        return this.http.get<Account>(`${environment.serverUrl}/accounts/${userID}`);
    }

    getAccountByPseudonym(pseudo: string) {
        return this.http.get<Account>(`${environment.serverUrl}/accounts/pseudonym/${pseudo}`);
    }

    getSomeAccounts(userIds: string[]): Observable<{ userId: string; pseudonym: string; avatarUrl: string }[]> {
        return this.http.post<{ userId: string; pseudonym: string; avatarUrl: string }[]>(`${environment.serverUrl}/accounts/batch`, {
            userIds,
        });
    }

    getAccounts() {
        return this.http.get<Account[]>(`${environment.serverUrl}/accounts`);
    }

    changeLang(lang: Language) {
        return this.http.patch<Account>(`${environment.serverUrl}/accounts/${this.auth0Id}/lang/${lang}`, {});
    }

    updateAvatar(avatarUrl: string) {
        return this.http.patch<Account>(`${environment.serverUrl}/accounts/${this.auth0Id}/avatar`, {
            avatarUrl,
        });
    }

    updateTheme(themeVisual: ThemeVisual) {
        return this.http.patch<Account>(`${environment.serverUrl}/accounts/${this.auth0Id}/theme/${themeVisual}`, {});
    }

    updateMoney(money: number): Observable<Account> {
        return this.http.patch<Account>(`${environment.serverUrl}/accounts/${this.auth0Id}/money`, { money });
    }

    updateOwnedThemes(theme: ThemeVisual[]) {
        return this.http.patch<Account>(`${environment.serverUrl}/accounts/${this.auth0Id}/ownedThemes`, { ownedThemes: theme });
    }

    updateOwnedAvatars(avatar: string[]) {
        return this.http.patch<Account>(`${environment.serverUrl}/accounts/${this.auth0Id}/ownedAvatars`, { ownedAvatars: avatar });
    }

    updateName(newName: string) {
        return this.http.patch<Account>(`${environment.serverUrl}/accounts/${this.auth0Id}/pseudonym`, { newPseudonym: newName });
    }

    getSessionHistory() {
        return this.http.get<SessionHistoryDto[]>(`${environment.serverUrl}/sessions/history/${this.auth0Id}`);
    }

    getLocalAvatar(avatarUrl: string = this.account.avatarUrl) {
        if (this.isBase64DataURL(avatarUrl)) {
            return avatarUrl;
        } else {
            return 'assets/avatars/' + avatarUrl;
        }
    }

    isBase64DataURL(dataUrl: string): boolean {
        const base64Regex = /^data:image\/(png|jpeg|jpg|gif);base64,/;
        return base64Regex.test(dataUrl);
    }

    getFriends() {
        return this.http.get<string[]>(`${environment.serverUrl}/accounts/${this.auth0Id}/friends`);
    }

    getFriendRequests() {
        return this.http.get<FriendRequestData[]>(`${environment.serverUrl}/accounts/${this.auth0Id}/friend-requests`);
    }

    getFriendsThatUserRequested() {
        return this.http.get<string[]>(`${environment.serverUrl}/accounts/${this.auth0Id}/friends-requested`);
    }

    isThemeOwned(theme: string): boolean {
        return this.ownedThemes?.includes(theme) ?? false;
    }

    isAvatarOwned(avatar: string): boolean {
        return this.ownedAvatars?.includes(avatar) ?? false;
    } 

    getBlockedUsers() {
        return this.http.get<string[]>(`${environment.serverUrl}/accounts/${this.auth0Id}/blockedUsers`);
    }

    getBlockedBy() {
        return this.http.get<string[]>(`${environment.serverUrl}/accounts/${this.auth0Id}/blockedBy`);
    }
}
