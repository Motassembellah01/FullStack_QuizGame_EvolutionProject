import { Question } from "@app/classes/question/question";

export interface NewQuestionDto {
    accessCode: string;
    question: Question,
}