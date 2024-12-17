import { Injectable } from '@angular/core';
import { MAX_ACCESS_CODE_LENGTH, MAX_PLAYER_NAME_LENGTH, SocketsSendEvents } from '@app/core/constants/constants';
import { MatchCommunicationService } from '@app/core/http/services/match-communication/match-communication.service';
import { PlayerRequest } from '@app/core/interfaces/player-request';
import { SocketService } from '@app/core/websocket/services/socket-service/socket.service';
import { Observable, of } from 'rxjs';

/**
 * This class allows to handle the business logic for the match before getting to the
 * play view. So, here we can manage the validations before starting a match.
 */
@Injectable({
    providedIn: 'root',
})
export class JoinMatchService {
    // can either be the access code or the name of the player
    // When the access code is not valid it is the accessCode
    input: string = '';
    maxLength: number = MAX_ACCESS_CODE_LENGTH;
    accessCode: string;
    playerName: string;
    isTestingMatch: boolean = false;
    constructor(
        private matchCommunicationService: MatchCommunicationService,
        private socketService: SocketService,
    ) {}

    containsOnlySpaces(): boolean {
        const spaceRegex = /^\s*$/;
        // Use the test method to check if the input contains only spaces
        return spaceRegex.test(this.input);
    }

    isValidAccessCode(): Observable<boolean> {
        const spaceRegex = /^\s*$/;
        if (this.accessCode) return this.matchCommunicationService.isValidAccessCode(this.accessCode);
        else {
            if (spaceRegex.test(this.input)) return of(false);
            return this.matchCommunicationService.isValidAccessCode(this.input);
        }
    }

    isMatchAccessible(): Observable<boolean> {
        return this.matchCommunicationService.isMatchAccessible(this.accessCode);
    }

    validatePlayerName(): Observable<boolean> {
        if (!this.input) return of(false);
        else if (this.containsOnlySpaces()) return of(false);
        else if (this.input.length > MAX_PLAYER_NAME_LENGTH) return of(false);
        return this.matchCommunicationService.validatePlayerName(this.accessCode, this.input);
    }

    removeSpace(): void {
        this.input = this.input.trim();
    }

    joinMatchRoom(): void {
        this.socketService.send<PlayerRequest>(SocketsSendEvents.JoinMatch, { roomId: this.accessCode, name: this.playerName });
    }

    clearInput(): void {
        this.accessCode = '';
        this.playerName = '';
        this.input = '';
    }
}
