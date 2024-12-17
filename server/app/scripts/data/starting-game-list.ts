import { Question } from '@app/classes/question/question';
import { QUESTION_TYPE } from '@app/constants/constants';
import { Game } from '@app/model/database/game';

/** Default gameList use to populate the database */
export const gameList: Game[] = [
    {
        id: '1a2Zb3cD',
        title: 'La programmation WEB',
        duration: 60,
        lastModification: '2023-09-29 15:54:00',
        isVisible: false,
        description: 'Le web est immense',
        questions: [
            new Question({
                id: '1a2Zb3cD1',
                type: QUESTION_TYPE.qcm,
                text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                points: 40,
                choices: [
                    {
                        text: 'var',
                        isCorrect: true,
                    },
                    {
                        text: 'self',
                        isCorrect: false,
                    },
                    {
                        text: 'this',
                        isCorrect: true,
                    },
                    {
                        text: 'int',
                        isCorrect: true,
                    },
                ],
                timeAllowed: 60,
            }),
            new Question({
                id: '1a2Zb3cD1',
                type: QUESTION_TYPE.qcm,
                text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
                points: 40,
                choices: [
                    {
                        text: 'var',
                        isCorrect: true,
                    },
                    {
                        text: 'self',
                        isCorrect: false,
                    },
                    {
                        text: 'this',
                        isCorrect: true,
                    },
                    {
                        text: 'int',
                        isCorrect: true,
                    },
                ],
                timeAllowed: 60,
            }),
            new Question({
                id: '1a2Zb3cD3',
                type: QUESTION_TYPE.qcm,
                text: "Est-ce qu'on le code suivant lance une erreur : const a = 1/NaN; ?",
                points: 20,
                choices: [
                    {
                        text: 'Non',
                        isCorrect: true,
                    },
                    {
                        text: 'Oui',
                        isCorrect: false,
                    },
                ],
                timeAllowed: 60,
            }),
            new Question({
                id: '1a2Zb3cD4',
                type: QUESTION_TYPE.qcm,
                text: "Quels concepts interviennent dans l'asynchrone",
                points: 20,
                choices: [
                    {
                        text: 'Observable',
                        isCorrect: true,
                    },
                    {
                        text: 'Promise',
                        isCorrect: true,
                    },
                    {
                        text: 'Callback',
                        isCorrect: true,
                    },
                    {
                        text: 'Stub',
                        isCorrect: false,
                    },
                ],
                timeAllowed: 60,
            }),
        ],
        creator: "",
        difficultyMap: [],
        interestMap: [],
        durationMap: [],
        rating: [],
    },

    {
        id: '4S3FGdf8',
        title: 'Le soccer en un quiz',
        duration: 40,
        lastModification: '2023-09-29 15:56:10',
        isVisible: true,
        description: 'Football pas soccer hein !!!!',
        questions: [
            new Question({
                id: '4S3FGdf81',
                type: QUESTION_TYPE.qcm,
                text: "Parmi les pays suivant lequel/lesquels n'ont jamais remporté de coupe du monde",
                points: 20,
                choices: [
                    {
                        text: 'Hollande',
                        isCorrect: true,
                    },
                    {
                        text: 'Espagne',
                        isCorrect: false,
                    },
                    {
                        text: 'Portugal',
                        isCorrect: true,
                    },
                    {
                        text: 'Uruguay',
                        isCorrect: false,
                    },
                ],
                timeAllowed: 60,
            }),
            new Question({
                id: '4S3FGdf83',
                type: QUESTION_TYPE.qcm,
                text: "Quelle est la date de la victoire de l'Olympique de Marseille(OM) en ligue des champions",
                points: 30,
                choices: [
                    {
                        text: '1984',
                        isCorrect: false,
                    },
                    {
                        text: '1991',
                        isCorrect: false,
                    },
                    {
                        text: '1993',
                        isCorrect: true,
                    },
                    {
                        text: '1980',
                        isCorrect: false,
                    },
                ],
                timeAllowed: 60,
            }),
            new Question({
                id: '4S3FGdf84',
                type: QUESTION_TYPE.qcm,
                text: "Combien de fois l'Olympique Lyonnais a-t-il consécutivement remporté la Ligue 1 ",
                points: 40,
                choices: [
                    {
                        text: '10',
                        isCorrect: false,
                    },
                    {
                        text: '7',
                        isCorrect: true,
                    },
                    {
                        text: '12',
                        isCorrect: false,
                    },
                    {
                        text: '5',
                        isCorrect: false,
                    },
                ],
                timeAllowed: 60,
            }),
            new Question({
                id: '4S3FGdf85',
                type: QUESTION_TYPE.qcm,
                text: 'Considéré comme le meilleur championnat au monde la Premier League est un championnat se déroulant:',
                points: 10,
                choices: [
                    {
                        text: 'Angleterre',
                        isCorrect: true,
                    },
                    {
                        text: 'Allemagne',
                        isCorrect: false,
                    },
                    {
                        text: 'Italie',
                        isCorrect: false,
                    },
                    {
                        text: 'Pays de Galles',
                        isCorrect: false,
                    },
                ],
                timeAllowed: 60,
            }),
        ],
        creator: "",
        difficultyMap: [],
        interestMap: [],
        durationMap: [],
        rating: [],
    },
];
