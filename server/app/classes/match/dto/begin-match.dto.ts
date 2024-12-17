import { Question } from "@app/classes/question/question";
import { Game } from "@app/model/database/game";

export interface BeginMatchDto {
    accessCode: string,
    firstQuestion: Question,
    game: Game,
    managerName: string,
}