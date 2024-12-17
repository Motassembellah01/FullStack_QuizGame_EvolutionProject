package constants

const val SERVER_URL = "http://ec2-15-222-235-159.ca-central-1.compute.amazonaws.com:3000"
// "http://ec2-15-222-235-159.ca-central-1.compute.amazonaws.com:3000"

object HTTP_RESPONSES {
    const val OK = 200
    const val CREATED = 201
    const val NO_CONTENT = 204
    const val BAD_REQUEST = 400
    const val UNAUTHORIZED = 401
    const val FORBIDDEN = 403
    const val NOT_FOUND = 404
    const val INTERNAL_SERVER_ERROR = 500
}

object POINTS {
    const val MIN = 10
    const val MAX = 100
    const val INCREMENT = 10
}

const val MAX_PLAYER_NAME_LENGTH = 10
const val MAX_ACCESS_CODE_LENGTH = 4
const val QRL_TIME = 60

object QCM_TIME {
    const val MIN = 10
    const val MAX = 60
}

object CHOICES {
    const val MIN = 2
    const val MAX = 4
}

object MAX_PANIC_TIME_FOR {
    const val QCM = 10
    const val QRL = 20
}

object ERROR_MESSAGE_FOR {
    const val NAME = "\n- Un nom est requis"
    const val NAME_TYPE = "\n- Un nom en format texte est requis"
    const val EXISTING_NAME = "\n- Le nom choisi existe déjà"
    const val DESCRIPTION = "\n- Une description est requise"
    const val DESCRIPTION_TYPE = "\n- Une description en format texte est requise"
    const val QCM_TIME = "\n- Le temps des QCM doit être compris entre 10 et 60 secondes"
    const val QCM_TIME_TYPE = "\n- Un nombre pour le temps de QCM est requis"
    const val QUESTIONS = "\n- Le jeu doit comporter au moins une question valide"
    const val QUESTIONS_TYPE = "\n- Un tableau de questions est requis"
}

object DIALOG {
    const val QUESTION_FORM_WIDTH = "80%"
    const val NEW_NAME_WIDTH = "40%"
    const val TRANSITION_WIDTH = "45rem"
    const val TRANSITION_HEIGHT = "18rem"
    const val END_MATCH_TRANSITION_WIDTH = "55rem"
    const val END_MATCH_TRANSITION_HEIGHT = "24rem"
    const val CONFIRMATION_WIDTH = "40rem"
    const val CONFIRMATION_HEIGHT = "15rem"
}

object DIALOG_MESSAGE {
    const val CANCEL_QUESTION = "annuler la création de la question"
    const val GAME_DELETION = "supprimer ce jeu"
    const val CANCEL_QUESTION_MODIFICATION = "annuler les modification à cette question"
    const val CANCEL_CHOICE_DELETION = "supprimer ce choix de réponse"
    const val CANCEL_GAME_CREATION = "annuler la création de ce jeu"
    const val CANCEL_MODIFY_GAME = "annuler la modification de ce jeu"
    const val CANCEL_MATCH = "annuler cette partie"
    const val FINISH_MATCH = "terminer cette partie"
    const val QUIT_MATCH = "quitter cette partie"
    const val CLEAR_HISTORY = "effacer l'historique des parties"
}

const val SNACKBAR_DURATION = 4000

object SNACKBAR_MESSAGE {
    const val GAME_IMPORTED = "Jeu importé avec succès"
    const val GAME_CREATED = "Jeu créé avec succès"
    const val GAME_UPDATED = "Jeu modifié avec succès"
    const val MIN_QUESTION_NUMBER = "La partie doit avoir au moins 2 questions"
}

object LENGTHS {
    const val QUESTION_ID = 9
    const val GAME_ID = 8
    const val ACCESS_CODE = 4
}

object FACTORS {
    const val ASCENDING_SORT = 1
    const val DESCENDING_SORT = -1
    const val FIRST_CHOICE = 1.2
    const val TIME_PROGRESS_SPINNER = 20
    const val PERCENTAGE = 100
    const val TOLERANCE_PERCENTAGE = 0.25
}

object DURATIONS {
    const val BONUS_MESSAGE = 2500
    const val BACK_TO_MATCH = 1000
    const val TIMER_INTERVAL = 1000
    const val PANIC_MODE_INTERVAL = 250
    const val NOTIFY_CHAT_ACCESSIBILITY = 3500
    const val QRL_HISTOGRAM_UPDATE_INTERVAL = 5
}

object ERRORS {
    const val NO_INDEX_FOUND = -1
}

object CHAR_SETS {
    const val ACCESS_CODE = "0123456789"
    const val ID = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
}

object NAMES {
    const val MANAGER = "Organisateur"
    const val TESTER = "Testeur"
    const val SYSTEM = "Système"
}

object PLAYERS_NAME_COLORS {
    const val RED = "red"
    const val YELLOW = "#FFD700"
    const val GREEN = "green"
    const val BLACK = "black"
}

object TRANSITIONS_DURATIONS {
    const val START_OF_THE_GAME = 5
    const val BETWEEN_QUESTIONS = 3
    const val END_MATCH_AFTER_PLAYERS_LEFT = 5
}

object FEEDBACK_MESSAGES {
    const val SAME_SCORE = "Votre score reste inchangé"
    const val WRONG_ANSWER = "vous n'avez malheureusement pas eu la bonne réponse"
    const val RIGHT_ANSWER = "vous avez eu la bonne réponse !"
    const val HALF_POINTS = "vous avez eu la moitié des points"
    const val BONUS = "Vous êtes le/la premier/ère à avoir la bonne réponse ! +20% bonus"
    const val CHAT_BLOCKED = "Vous ne pouvez plus envoyer des messages pour le moment"
    const val CHAT_UNBLOCKED = "Vous pouvez à nouveau envoyer des messages"
    const val PLAYER_LEFT_MATCH = "a quitté la partie"
    const val POINTS_ADDED_TO_SCORE = "points s'ajoutent à votre score !"
    const val WAITING = "veuillez patienter"
    const val DURING_EVALUATION = "Évaluation de la question en cours"
}

object TRANSITIONS_MESSAGES {
    const val BEGIN_MATCH = "La partie commence dans"
    const val TRANSITION_TO_RESULTS_VIEW = "Présentation des résultats dans"
    const val TRANSITION_TO_NEXT_QUESTION = "Prochaine question dans"
    const val NEXT_QUESTION_TEST_VIEW = "Prochaine question"
    const val MATCH_END_TEST_VIEW = "Fin de la partie"
    const val END_MATCH_AFTER_PLAYERS_LEFT = "Tous les joueurs ont quitté la partie, vous serez dirigé vers la page d'accueil dans"
}

object HISTOGRAM_TEXTS {
    const val PLAYERS_INTERACT = "Ont interagi"
    const val PLAYERS_INTERACTION = "Interactions des joueurs"
    const val PLAYERS_DID_NOT_INTERACT = "N'ont pas interagi"
    const val PERCENTAGES = "Pourcentages attribués"
    const val ANSWERS_CHOICES = "Choix de réponse"
    const val PLAYERS_NUMBER = "Nombre de joueurs"
    const val PLAYERS = "Joueurs"
}


object SocketsSendEvents {
    const val JoinMatch = "joinMatchRoom"
    const val SendMessage = "sendMessage"
    const val SwitchQuestion = "switchQuestion"
    const val UpdateAnswer = "updateAnswer"
    const val StartTimer = "startTimer"
    const val StopTimer = "stopTimer"
    const val CancelGame = "cancelGame"
    const val FinishMatch = "finishMatch"
    const val BeginMatch = "beginMatch"
    const val RemovePlayer = "removePlayer"
    const val UpdateScore = "updatePlayerScore"
    const val SetFinalAnswer = "setFinalAnswer"
    const val PlayerLeftAfterMatchBegun = "playerLeftAfterMatchBegun"
    const val SendChartData = "sendChartData"
    const val BeginQrlEvaluation = "beginQrlEvaluation"
    const val FinishQrlEvaluation = "finishQrlEvaluation"
    const val PanicModeActivated = "panicModeActivated"
    const val ChangeChatAccessibility = "changeChatAccessibility"
    const val HistogramTime = "histogramTime"
    const val CreateTeam = "createTeam"
    const val JoinTeam = "joinTeam"
    const val QuitTeam = "quitTeam"
}

object SocketsOnEvents {
    const val NewPlayer = "newPlayer"
    const val ChatMessage = "chatMessage"
    const val NextQuestion = "nextQuestion"
    const val AnswerUpdated = "answerUpdated"
    const val NewTime = "newTime"
    const val GameCanceled = "gameCanceled"
    const val MatchFinished = "matchFinished"
    const val JoinBegunMatch = "joinMatch"
    const val PlayerRemoved = "playerRemoved"
    const val UpdatedScore = "updatedPlayerScore"
    const val FinalAnswerSet = "finalAnswerSet"
    const val PlayerDisabled = "playerDisabled"
    const val AllPlayersResponded = "allPlayersResponded"
    const val UpdateChartDataList = "updateChartDataList"
    const val QrlEvaluationBegun = "qrlEvaluationBegun"
    const val QrlEvaluationFinished = "qrlEvaluationFinished"
    const val PanicModeActivated = "panicModeActivated"
    const val ChatAccessibilityChanged = "chatAccessibilityChanged"
    const val HistogramTime = "histogramTime"
    const val TeamCreated = "teamCreated"
    const val TeamJoined = "teamJoined"
    const val TeamQuit = "teamQuit"
}

object QUESTION_TYPE {
    const val QCM = "QCM"
    const val QRL = "QRL"
    const val QRE = "QRE"
};


object ChatSocketsEmitEvents {
    const val CreateChatRoom = "generalCreateChatRoom"
    const val JoinChatRoom = "generalJoinChatRoom"
    const val LeaveChatRoom = "generalLeaveChatRoom"
    const val SendMessage = "generalSendMessage"
    const val GetChannels = "generalGetChannels"
    const val UserInfo = "userInfo"
}

object ChatSocketsSubscribeEvents {
    const val NewChatRoom = "generalNewChatRoom"
    const val ChatClosed = "generalChatClosed"
    const val ChatJoined = "generalChatJoined"
    const val ChatLeft = "generalChatLeft"
    const val ChatMessage = "generalChatMessage"
    const val SendOldMessages = "generalSendOldMessages"
    const val ChatRoomList = "generalChatRoomList"
}

enum class ChatRoomType(val type: String) {
    General("general"),
    Public("public"),
    Match("match");
}

object FriendSocketsEmitEvents {
    const val SendFriendRequest = "send_friend_request"       // To send a friend request
    const val AcceptFriendRequest = "accept_friend_request"   // To accept a friend request
    const val RejectFriendRequest = "reject_friend_request"   // To reject a friend request
    const val RemoveFriend = "remove_friend"                 // To remove a friend
}
object FriendSocketsSubscribeEvents {
    const val NewFriendRequest = "new_friend_request"         // Received when a new friend request arrives
    const val FriendRequestAccepted = "friend_request_accepted" // Received when a sent friend request is accepted
    const val FriendRequestRejected = "friend_request_rejected" // Received when a sent friend request is rejected
    const val FriendRemoved = "friend_removed"               // Received when someone removes you as a friend
    const val FriendRequestSent = "friend_request_sent"       // Acknowledgement of sent friend request
    const val FriendsList = "friends_list"                   // Initial or updated friends list
}

