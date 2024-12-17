import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'login-fail', loadComponent: async () => import('./pages/login-fail/login-fail.component').then((m) => m.LoginFailComponent) },
    { path: 'set-avatar', loadComponent: async () => import('./pages/set-avatar/set-avatar.component').then((m) => m.SetAvatarComponent) },
    {
        path: 'set-player-name',
        loadComponent: async () => import('./pages/set-player-name/set-player-name.component').then((m) => m.SetPlayerNameComponent),
    },

    {
        path: 'chat',
        loadComponent: async () => import('./pages/chat-page/chat-page.component').then((m) => m.ChatPageComponent),
    },
    {
        path: 'chat',
        loadComponent: async () => import('./pages/chat-page/chat-page.component').then((m) => m.ChatPageComponent),
    },
    {
        path: 'home',
        loadComponent: async () => import('./pages/main-page/main-page.component').then((m) => m.MainPageComponent),
    },
    {
        path: 'administration',
        children: [
            {
                path: '',
                loadComponent: async () => import('./pages/administration/administration.component').then((m) => m.AdministrationComponent),
            },
            {
                path: 'create-game',
                children: [
                    {
                        path: '',
                        loadComponent: async () => import('./pages/create-game/create-game.component').then((m) => m.CreateGameComponent),
                    },
                    {
                        path: ':id',
                        loadComponent: async () => import('./pages/create-game/create-game.component').then((m) => m.CreateGameComponent),
                    },
                ],
            },
            {
                path: 'history',
                loadComponent: async () => import('./pages/history/history.component').then((m) => m.HistoryComponent),
            },
        ],
    },
    {
        path: 'profile/history',
        children: [
            {
                path: '',
                loadComponent: async () => import('./pages/history-profile/history-profile.component').then((m) => m.HistoryProfileComponent),
            },
            {
                path: 'home',
                loadComponent: async () => import('./pages/main-page/main-page.component').then((m) => m.MainPageComponent),
            },
        ],
    },
    {
        path: 'profile/statistics',
        children: [
            {
                path: '',
                loadComponent: async () =>
                    import('./pages/statistics-profile/statistics-profile.component').then((m) => m.StatisticsProfileComponent),
            },
            {
                path: 'home',
                loadComponent: async () => import('./pages/main-page/main-page.component').then((m) => m.MainPageComponent),
            },
        ],
    },

    {
        path: 'create',
        children: [
            {
                path: '',
                loadComponent: async () => import('./pages/creation/creation.component').then((m) => m.CreationComponent),
            },
            {
                path: 'wait/game/:id',
                loadComponent: async () =>
                    import('./pages/manager-waiting-room/manager-waiting-room.component').then((m) => m.ManagerWaitingRoomComponent),
            },
            {
                path: 'preview/games/:id',
                loadComponent: async () => import('./pages/game-preview/game-preview.component').then((m) => m.GamePreviewComponent),
            },
        ],
    },
    {
        path: 'play',
        children: [
            {
                path: '',
                loadComponent: async () => import('./pages/join-match/join-match.component').then((m) => m.JoinMatchComponent),
            },
            {
                path: 'manager/match/:id',
                loadComponent: async () =>
                    import('./pages/match-managers-side/match-managers-side.component').then((m) => m.MatchManagersSideComponent),
            },
            {
                path: 'wait/:accessCode',
                loadComponent: async () => import('./pages/waiting-room/waiting-room.component').then((m) => m.WaitingRoomComponent),
            },
            {
                path: 'result/:id',
                loadComponent: async () => import('./pages/match-result/match-result.component').then((m) => m.MatchResultComponent),
            },
            {
                path: 'question-result/:id',
                loadComponent: async () => import('./pages/question-result/question-result.component').then((m) => m.QuestionResultComponent),
            },
            {
                path: 'match/:id',
                loadComponent: async () => import('./pages/on-going-match/on-going-match.component').then((m) => m.OnGoingMatchComponent),
            },
        ],
    },
    { path: '**', redirectTo: '/home' },
];
