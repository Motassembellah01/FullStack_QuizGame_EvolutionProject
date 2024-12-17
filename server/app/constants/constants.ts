/** This file is a directory of all constants used in the server */
export const ERRORS = {
    noIndexFound: -1,
};

export const FACTORS = {
    firstChoice: 0.2,
};

export const CHAR_SETS = {
    token: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*-+=@#$%?&*()_',
};

export const LENGTHS = {
    token: 10,
};

export const NAMES = {
    manager: 'Organisateur',
    tester: 'Testeur',
};

export const QUESTION_TYPE = {
    qcm: 'QCM',
    qrl: 'QRL',
    qre: 'QRE',
};

export enum SocketsSubscribeEvents {
    JoinMatch = 'joinMatchRoom',
    JoinMatchObserver = 'joinMatchObserver',
    SendMessage = 'sendMessage',
    SwitchQuestion = 'switchQuestion',
    UpdateAnswer = 'updateAnswer',
    StartTimer = 'startTimer',
    StopTimer = 'stopTimer',
    CancelGame = 'cancelGame',
    FinishMatch = 'finishMatch',
    BeginMatch = 'beginMatch',
    RemovePlayer = 'removePlayer',
    UpdateScore = 'updatePlayerScore',
    SetFinalAnswer = 'setFinalAnswer',
    PlayerLeftAfterMatchBegun = 'playerLeftAfterMatchBegun',
    SendChartData = 'sendChartData',
    BeginQrlEvaluation = 'beginQrlEvaluation',
    FinishQrlEvaluation = 'finishQrlEvaluation',
    PanicModeActivated = 'panicModeActivated',
    ChangeChatAccessibility = 'changeChatAccessibility',
    HistogramTime = 'histogramTime',
    CreateTeam = 'createTeam',
    JoinTeam = 'joinTeam',
    QuitTeam = 'quitTeam',
    RemoveObserver = 'removeObserver',
    UpdateMoney = 'updateMoney',
    GameEvaluation = 'gameEvaluation',
}

export enum SocketsEmitEvents {
    NewPlayer = 'newPlayer',
    JoinedMatchObserver = 'joinedMatchObserver',
    ChatMessage = 'chatMessage',
    NextQuestion = 'nextQuestion',
    AnswerUpdated = 'answerUpdated',
    NewTime = 'newTime',
    GameCanceled = 'gameCanceled',
    MatchFinished = 'matchFinished',
    JoinBegunMatch = 'joinMatch',
    PlayerRemoved = 'playerRemoved',
    UpdatedScore = 'updatedPlayerScore',
    FinalAnswerSet = 'finalAnswerSet',
    PlayerDisabled = 'playerDisabled',
    AllPlayersResponded = 'allPlayersResponded',
    UpdateChartDataList = 'updateChartDataList',
    QrlEvaluationBegun = 'qrlEvaluationBegun',
    QrlEvaluationFinished = 'qrlEvaluationFinished',
    PanicModeActivated = 'panicModeActivated',
    ChatAccessibilityChanged = 'chatAccessibilityChanged',
    HistogramTime = 'histogramTime',
    ChatRoomList = 'ChatRoomList',
    TeamCreated = 'teamCreated',
    TeamJoined = 'teamJoined',
    TeamQuit = 'teamQuit',
    ObserverRemoved = 'observerRemoved',
    UpdateMoney = 'updateMoney',
    SendWinnerName = 'sendWinnerName',
}

export enum Passwords {
    DeleteAllMatches = 'Team205',
}

export enum ChatSocketsSubscribeEvents {
    CreateChatRoom = 'generalCreateChatRoom',
    DeleteChatRoom = 'generalDeleteChatRoom',
    JoinChatRoom = 'generalJoinChatRoom',
    LeaveChatRoom = 'generalLeaveChatRoom',
    SendMessage = 'generalSendMessage',
    GetOldMessages = 'generalGetOldMessages',
    GetChannels = 'generalGetChannels',
    UserInfo = 'userInfo',
}

export enum ChatSocketsEmitEvents {
    NewChatRoom = 'generalNewChatRoom',
    ChatClosed = 'generalChatClosed',
    ChatJoined = 'generalChatJoined',
    ChatLeft = 'generalChatLeft',
    ChatMessage = 'generalChatMessage',
    SendOldMessages = 'generalSendOldMessages',
    ChatRoomList = 'generalChatRoomList',
}

export enum ChatRoomType {
    General = 'general',
    Public = 'public',
    Match = 'match',
}

export enum ThemeVisual {
    DARK = 'dark',
    LIGHT = 'light',
    CHRISTMAS = 'christmas',
    VALENTINES = 'valentines'
}

export enum Language {
    EN = 'en',
    FR = 'fr',
}
