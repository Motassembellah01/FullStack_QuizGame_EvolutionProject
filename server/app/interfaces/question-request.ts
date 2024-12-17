import { Player } from '@app/interfaces/player';
/**
 * interface for request to modify Question objects
 */
export class QuestionRequest {
    matchAccessCode: string;
    player: Player;
    questionId: string;
    hasQrlEvaluationBegun: boolean;
}
