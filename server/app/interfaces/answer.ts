/**
 * Representation of the answer of a game
 */
export interface Answer {
    text: string; // is exported to JSON
    isCorrect: boolean; // is exported to JSON
    playerId?: string;
    didPlayerAnswer?: boolean;
    questionId?: string;
    point?: number;
    lastAnswerTime?: Date;
    final?: boolean;
    points?: number;
}
