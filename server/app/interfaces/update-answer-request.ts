import { PlayerAnswers } from '@app/classes/player-answers/player-answers';
/**
 * Used to update the answer of a player
 */
export interface UpdateAnswerRequest {
    matchAccessCode: string;
    playerAnswers: PlayerAnswers;
}
