import { PlayerAnswers } from './player-answers';

/**
 * Interface to represent the update
 * of the answers of the players in
 * a match.
 */
export interface UpdateAnswerRequest {
    matchAccessCode: string;
    playerAnswers: PlayerAnswers;
}
