import { NAMES } from '@app/core/constants/constants';
import { Player } from './player';

/**
 * Interface to represent the accessibility
 * of a match. It contains the informations
 * needed to control the access of the match
 * as the access code, if it's locked or not,
 * the banned names et it contains the list
 * of the players in the match.
 */
export class AccessMatch {
    accessCode: string;
    players: Player[] = [];
    isAccessible: boolean;
    bannedNames: string[] = [NAMES.manager.toLowerCase()];
}
