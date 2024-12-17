import { Game } from '@app/core/classes/game/game';
import { Player } from '@app/core/interfaces/player';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';
import { Team } from '../classes/match/team';
import { Observer } from '../classes/match/observer';

/**
 * Interface to represent a match and
 * contains all the informations of
 * a match. This interface is implemented
 * by the class Match.
 */
export interface IMatch {
    game: Game;
    begin: string;
    end: string;
    bestScore: number;
    accessCode: string;
    testing: boolean;
    players: Player[];
    observers: Observer[];
    managerName: string;
    managerId: string;
    isAccessible: boolean;
    isFriendMatch: boolean;
    bannedNames: string[];
    playerAnswers: PlayerAnswers[];
    panicMode: boolean;
    timer: number;
    timing: boolean;
    isTeamMatch: boolean;
    isPricedMatch: boolean;
    priceMatch: number;
    nbPlayersJoined: number;
    teams: Team[];
    currentQuestionIndex: number;
    isEvaluatingQrl: boolean;
}
