import { Language, ThemeVisual } from '@app/core/constants/constants';
import { FriendRequestData } from '../friend-request-data';
import { PlayerMatchHistory } from './player-match-history';

export interface Account {
    _id: string;
    userId: string;
    pseudonym: string;
    email: string;
    avatarUrl: string;
    themeVisual: ThemeVisual;
    lang: Language;
    gamesPlayed: number;
    gamesWon: number;
    avgQuestionsCorrect: number;
    avgTimePerGame: number;
    matchHistory: PlayerMatchHistory[];
    money: number;
    friends: string[];
    friendRequests: FriendRequestData[];
    friendsThatUserRequested: string[];
    visualThemesOwned: ThemeVisual[];
    avatarsUrlOwned: string[];
}
