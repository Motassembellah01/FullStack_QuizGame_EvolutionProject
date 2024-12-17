import { Player } from '@app/core/interfaces/player';

/**
 * Interface to represent the
 * request of a question in a
 * room and a player.
 */
export class QuestionRequest {
    matchAccessCode: string;
    player: Player;
    questionId: string;
    hasQrlEvaluationBegun: boolean;
}
