// import { Question } from '@app/classes/question/question';
// import { QUESTION_TYPE } from '@app/constants/constants';
// import { CreateGameDto } from '@app/model/dto/game/create-game.dto';

// export const NEW_GAME_STUB = (): CreateGameDto => {
//     return {
//         id: '1a2Zb3cD',
//         title: 'La programmation WEB',
//         duration: 60,
//         lastModification: '2023-09-19T08:20:10.789Z',
//         isVisible: false,
//         description: 'Le web est immense',
//         questions: [
//             new Question({
//                 id: '1a2Zb3cD1',
//                 type: QUESTION_TYPE.qcm,
//                 text: 'Parmi les mots suivants, lesquels sont des mots clés réservés en JS?',
//                 points: 40,
//                 choices: [
//                     {
//                         text: 'var',
//                         isCorrect: true,
//                     },
//                     {
//                         text: 'self',
//                         isCorrect: false,
//                     },
//                     {
//                         text: 'this',
//                         isCorrect: true,
//                     },
//                     {
//                         text: 'int',
//                         isCorrect: true,
//                     },
//                 ],
//                 timeAllowed: 60,
//             }),
//             new Question({
//                 id: '1a2Zb3cD2',
//                 type: QUESTION_TYPE.qrl,
//                 text: "Donnez la différence entre 'let' et 'var' pour la déclaration d'une variable en JS ?",
//                 points: 60,
//                 choices: [
//                     {
//                         text: 'var',
//                         isCorrect: true,
//                     },
//                     {
//                         text: 'self',
//                         isCorrect: false,
//                     },
//                     {
//                         text: 'this',
//                         isCorrect: true,
//                     },
//                     {
//                         text: 'int',
//                         isCorrect: true,
//                     },
//                 ],
//                 timeAllowed: 60,
//             }),
//             new Question({
//                 id: '1a2Zb3cD3',
//                 type: QUESTION_TYPE.qcm,
//                 text: "Est-ce qu'on le code suivant lance une erreur : const a = 1/NaN; ?",
//                 points: 20,
//                 choices: [
//                     {
//                         text: 'Non',
//                         isCorrect: true,
//                     },
//                     {
//                         text: 'Oui',
//                         isCorrect: false,
//                     },
//                 ],
//                 timeAllowed: 60,
//             }),
//             new Question({
//                 id: '1a2Zb3cD4',
//                 type: QUESTION_TYPE.qcm,
//                 text: "Quels concepts interviennent dans l'asynchrone",
//                 points: 20,
//                 choices: [
//                     {
//                         text: 'Observable',
//                         isCorrect: true,
//                     },
//                     {
//                         text: 'Promise',
//                         isCorrect: true,
//                     },
//                     {
//                         text: 'Callback',
//                         isCorrect: true,
//                     },
//                     {
//                         text: 'Stub',
//                         isCorrect: false,
//                     },
//                 ],
//                 timeAllowed: 60,
//             }),
//         ],
//     };
// };
