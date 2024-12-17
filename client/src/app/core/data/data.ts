import { Question } from '@app/core/classes/question/question';
import { QUESTION_TYPE } from '@app/core/constants/constants';
import { Choice } from '@app/core/interfaces/choice';
import { IGame } from '@app/core/interfaces/game';
import { MatchHistory } from '@app/core/interfaces/match-history';
import { Player } from '@app/core/interfaces/player';
import { PlayerAnswers } from '@app/core/interfaces/player-answers';

export const OPTIONS: Choice[] = [
    {
        text: 'option 1',
        isCorrect: false,
    },
    {
        text: 'option 2',
        isCorrect: false,
    },
    {
        text: 'option 3',
        isCorrect: true,
    },
    {
        text: 'option 4',
        isCorrect: false,
    },
];

export const CORRECT_OPTIONS: Choice[] = [
    {
        text: 'option 1',
        isCorrect: true,
    },
    {
        text: 'option 2',
        isCorrect: true,
    },
    {
        text: 'option 3',
        isCorrect: true,
    },
    {
        text: 'option 4',
        isCorrect: true,
    },
];

export const BAD_CHOICES: Choice[] = [
    {
        text: '  ',
        isCorrect: false,
    },
    {
        text: '',
        isCorrect: true,
    },
];

export const NO_GOOD_CHOICE: Choice[] = [
    {
        text: 'option 1',
        isCorrect: false,
    },
    {
        text: 'option 2',
        isCorrect: false,
    },
];

export const NO_BAD_CHOICE: Choice[] = [
    {
        text: 'option 1',
        isCorrect: true,
    },
    {
        text: 'option 2',
        isCorrect: true,
    },
];

export const SAME_TEXT: Choice[] = [
    {
        text: 'option',
        isCorrect: true,
    },
    {
        text: 'option',
        isCorrect: true,
    },
];

export const UNIQUE_TEXTS = [
    {
        text: 'option 1',
        isCorrect: false,
    },
    {
        text: 'option 2',
        isCorrect: true,
    },
];

export const PLAYER_ANSWERS: PlayerAnswers = {
    name: 'test',
    lastAnswerTime: 'test',
    final: false,
    questionId: '0',
    obtainedPoints: 10,
    qcmAnswers: Object.assign(OPTIONS),
    qrlAnswer: '',
    isTypingQrl: false,
};

export const INVALID_QUESTIONS: Question[] = [
    new Question({
        id: '0',
        type: QUESTION_TYPE.qcm,
        text: 'question text 0',
        points: -5, // invalid points
        choices: Object.assign(OPTIONS),
        timeAllowed: 60,
    }),
    new Question({
        id: '1',
        type: QUESTION_TYPE.qcm,
        text: '', // invalid question text for QCM
        points: 20,
        choices: NO_BAD_CHOICE,
        timeAllowed: 60,
    }),
    new Question({
        id: '2',
        type: 'invalid type', // invalid type
        text: 'question text 2',
        points: 10,
        choices: Object.assign(OPTIONS),
        timeAllowed: 60,
    }),
    new Question({
        id: '3',
        type: QUESTION_TYPE.qrl,
        text: '', // invalid question text for QRL
        points: 10,
        choices: Object.assign(OPTIONS),
        timeAllowed: 60,
    }),
];

export const QUESTIONS: Question[] = [
    new Question({
        id: '0',
        type: QUESTION_TYPE.qcm,
        text: 'question text 0',
        points: 10,
        choices: Object.assign(OPTIONS),
        timeAllowed: 60,
    }),
    new Question({
        id: '1',
        type: QUESTION_TYPE.qcm,
        text: 'question text 1',
        points: 20,
        choices: Object.assign(OPTIONS),
        timeAllowed: 60,
    }),
    new Question({
        id: '2',
        type: QUESTION_TYPE.qcm,
        text: 'question text 2',
        points: 10,
        choices: Object.assign(OPTIONS),
        timeAllowed: 60,
    }),
    new Question({
        id: '3',
        type: QUESTION_TYPE.qcm,
        text: 'question text 3',
        points: 40,
        choices: Object.assign(OPTIONS),
        timeAllowed: 60,
    }),
    new Question({
        id: '4',
        type: QUESTION_TYPE.qcm,
        text: 'question text 4',
        points: 10,
        choices: Object.assign(OPTIONS),
        timeAllowed: 60,
    }),
    new Question({
        id: '5',
        type: QUESTION_TYPE.qrl,
        text: 'question text 5',
        points: 10,
        choices: [],
        timeAllowed: 60,
    }),
];

export const QRL_QUESTIONS: Question[] = [
    new Question({
        id: '5',
        type: QUESTION_TYPE.qrl,
        text: 'question text 5',
        points: 10,
        choices: [],
        timeAllowed: 60,
    }),
];

export const GAMES: IGame[] = [
    {
        id: '0',
        title: 'game title 0',
        description: 'game description 0',
        duration: 60,
        lastModification: '2023-09-18 12:00:00',
        questions: Object.assign(QUESTIONS),
        isVisible: false,
    },
    {
        id: '1',
        title: 'game title 1',
        description: 'game description 1',
        duration: 50,
        lastModification: '2023-09-18 12:00:00',
        questions: Object.assign(QUESTIONS),
        isVisible: false,
    },
    {
        id: '2',
        title: 'game title 2',
        description: 'game description 2',
        duration: 40,
        lastModification: '2023-09-18 12:00:00',
        questions: Object.assign(QUESTIONS),
        isVisible: false,
    },
];

export const PLAYER: Player = {
    name: 'test player',
    isActive: true,
    score: 0,
    nBonusObtained: 0,
    chatBlocked: false,
};

export const ACTIVE_PLAYERS: Player[] = [
    {
        name: 'player 1',
        isActive: false,
        score: 40,
        nBonusObtained: 2,
        chatBlocked: false,
    },
    {
        name: 'player 2',
        isActive: true,
        score: 40,
        nBonusObtained: 2,
        chatBlocked: false,
    },
];

export const EVALUATION_PLAYERS: Player[] = [
    {
        name: 'player 1',
        isActive: true,
        score: 40,
        nBonusObtained: 2,
        chatBlocked: false,
    },
    {
        name: 'player 2',
        isActive: true,
        score: 100,
        nBonusObtained: 0,
        chatBlocked: false,
    },
    {
        name: 'player 3',
        isActive: false,
        score: 60,
        nBonusObtained: 1,
        chatBlocked: false,
    },
];

export const EVALUATION_ACTIVE_PLAYERS: Player[] = [
    {
        name: 'player 1',
        isActive: true,
        score: 40,
        nBonusObtained: 2,
        chatBlocked: false,
    },
    {
        name: 'player 2',
        isActive: true,
        score: 100,
        nBonusObtained: 0,
        chatBlocked: false,
    },
];

export const EXAMPLES = {
    accessCode: '1234',
    playerName: 'player',
    qrlFullNote: 100,
    qrlHalfNote: 50,
    playerAnswer: 'Valid Answer',
    validNumber: 20,
};

export const QCM_TIME = {
    valid: 50,
    invalid: 8,
};

export const MATCHES_HISTORY: MatchHistory[] = [
    {
        matchAccessCode: '',
        bestScore: 10,
        startTime: '2023-11-22 18:18:59',
        nStartPlayers: 5,
        gameName: 'gameNameMock',
    },
];
