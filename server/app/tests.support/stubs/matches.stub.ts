/**
 * Fake data for tests purpose */
import { GAMES_STUB } from './games.stub';

import { Match } from '@app/classes/match/match';

export const MATCHES_STUB = (): Match[] => {
    return [
        new Match({
            game: Object.assign(GAMES_STUB())[0],
            begin: '2023-01-01T12:00:00Z',
            end: '2023-01-01T14:00:00Z',
            bestScore: 100,
            accessCode: 'ABC123',
            testing: true,
            players: [
                {
                    name: 'player1',
                    isActive: true,
                    score: 0,
                    nBonusObtained: 0,
                    chatBlocked: false,
                },
                {
                    name: 'player2',
                    isActive: true,
                    score: 0,
                    nBonusObtained: 0,
                    chatBlocked: false,
                },
            ],
            managerName: 'ManagerName',
            isAccessible: true,
            bannedNames: [],
            playerAnswers: [],
            panicMode: false,
            timer: 60,
            timing: true,
        }),
        new Match({
            game: Object.assign(GAMES_STUB())[1],
            begin: '2023-01-02T15:00:00Z',
            end: '2023-01-02T17:30:00Z',
            bestScore: 85,
            accessCode: 'XYZ789',
            testing: true,
            players: [
                {
                    name: 'player3',
                    isActive: true,
                    score: 0,
                    nBonusObtained: 0,
                    chatBlocked: false,
                },
                {
                    name: 'player4',
                    isActive: true,
                    score: 0,
                    nBonusObtained: 0,
                    chatBlocked: false,
                },
            ],
            managerName: 'AnotherManager',
            isAccessible: true,
            bannedNames: [],
            playerAnswers: [],
            panicMode: true,
            timer: 90,
            timing: false,
        }),
        new Match({
            game: Object.assign(GAMES_STUB())[0],
            begin: '2023-01-02T15:00:00Z',
            end: '2023-01-02T17:30:00Z',
            bestScore: 85,
            accessCode: 'XYZ789',
            testing: true,
            players: [
                {
                    name: 'player5',
                    isActive: true,
                    score: 0,
                    nBonusObtained: 0,
                    chatBlocked: false,
                },
                {
                    name: 'player6',
                    isActive: true,
                    score: 0,
                    nBonusObtained: 0,
                    chatBlocked: false,
                },
            ],
            managerName: 'Manager',
            isAccessible: true,
            bannedNames: [],
            playerAnswers: [],
            panicMode: true,
            timer: 90,
            timing: false,
        }),
    ];
};
