import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import classes.Match
import classes.Player
import classes.PlayerAnswers
import classes.Team
import com.auth0.androidlogin.models.IChoice
import com.auth0.androidlogin.models.IMatch
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.models.IQuestion
import com.auth0.androidlogin.models.ITeam
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.services.TimeService
import constants.QUESTION_TYPE
import constants.SocketsOnEvents
import constants.SocketsSendEvents
import constants.TRANSITIONS_DURATIONS
import interfaces.PlayerRequest
import interfaces.dto.ChatAccessibilityRequest
import interfaces.dto.CreateTeamDto
import interfaces.dto.CurrentQuestionIndex
import interfaces.dto.NewPlayerDto
import interfaces.dto.QuestionRequest
import interfaces.dto.UpdateAnswerRequest
import interfaces.dto.UpdatedScoreDto
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale


object MatchService : Service() {

    private val socketService: SocketService = SocketService
    private val timerService: TimeService = TimeService
    private val _newPlayer = MutableLiveData<List<IPlayer>?>()
    private val _changeRoom = MutableLiveData<String>()
    private val _changeQuestion = MutableLiveData<IQuestion>()
    private val _changeState = MutableLiveData<String>()
    private val _changeTeam = MutableLiveData<List<Team>?>()
    private val _answerUpdated = MutableLiveData<List<PlayerAnswers>?>()
    private val _begunMatch = MutableLiveData<String>("null")
    val newPlayer: LiveData<List<IPlayer>?> get() = _newPlayer
    val changeRoom: LiveData<String> get() = _changeRoom
    val changeQuestion: LiveData<IQuestion> get() = _changeQuestion
    val changeState: LiveData<String> get () = _changeState
    val changeTeam: LiveData<List<Team>?> get() = _changeTeam
    val answerUpdated: LiveData<List<PlayerAnswers>?> get() = _answerUpdated
    val begunMatch: MutableLiveData<String> get() = _begunMatch
    private val _match = MutableLiveData<IMatch>()
    var match: Match? = null
    var matchAccessCode: String? = null
    private var username: String? = null
    private var currQuestionIndex: Int? = null
    var hasQuestionEvaluationBegun: Boolean = false
    var score: Float = 0.0F
    private var nBonus: Int = 0
    private var chatBlocked: Boolean = false


    fun connect() {
        this.socketService.connect()
        setUpListeners()
        _changeRoom.postValue("WaitingRoom")
        Log.d("MatchService", "Starting MatchService.")
    }

    override fun onDestroy() {
        super.onDestroy()
        this.leaveMatchRoom()
    }

    private fun setUpListeners() {
        Log.d("MatchService", "Start of Listener")
        this.socketService.on<JSONObject>(SocketsOnEvents.NewPlayer) { newPlayersJson ->
            val jsonString = newPlayersJson.toString()
            val type = object : TypeToken<NewPlayerDto>() {}.type
            val newPlayers: NewPlayerDto = Gson().fromJson(jsonString, type)
            Log.d("MatchService", "New Players : " + newPlayers.toString() + " , Match ? : ${match == null}.")
            this.match?.players = newPlayers.players.toMutableList()
            _newPlayer.postValue(this.match?.players)

            Log.d("MatchService", "New Players: $newPlayers")
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.NextQuestion) { index ->
            Log.d("MatchService", "SocketOnEvents NextQuestion $index")

            val jsonString = index.toString()
            val type = object : TypeToken<CurrentQuestionIndex>() {}.type
            val currentQuestionIndex: CurrentQuestionIndex = Gson().fromJson(jsonString, type)
            this.currQuestionIndex = currentQuestionIndex.currentQuestionIndex

            this.timerService.startTimer(
                TRANSITIONS_DURATIONS.BETWEEN_QUESTIONS,
                this.matchAccessCode!!
            ) { this.onTimerFinished() }
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.PanicModeActivated, { test ->
            Log.d("MatchService", "SocketOnEvents PanicMode$test")
            this._changeState.postValue("Panic")
            // TODO : Change color for timer
        })

        this.socketService.on<JSONArray>(SocketsOnEvents.AnswerUpdated) { answerUpdatedJson ->
            Log.d("MatchService", "AnswerUpdated : $answerUpdatedJson")
            val jsonString = answerUpdatedJson.toString()
            val type = object : TypeToken<List<PlayerAnswers>>() {}.type
            val answerUpdated: List<PlayerAnswers> = Gson().fromJson(jsonString, type)

            this.match!!.playerAnswers = answerUpdated.toMutableList()
            // TODO : Check if we want charts
            this._answerUpdated.postValue(answerUpdated)
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.GameCanceled, { errorMessageJson ->
            Log.d("MatchService", "GameCanceled")
            val jsonString = errorMessageJson.toString()
            val type = object : TypeToken<Any>() {}.type
            val errorMessage: Any = Gson().fromJson(jsonString, type)

            _changeRoom.postValue("MainActivity")
            this.leaveMatchRoom()
        })

        this.socketService.on<JSONObject>(SocketsOnEvents.MatchFinished) { test ->
            if (this.match?.testing == true) {
                _changeRoom.postValue("MainActivity")
                Log.d("MatchService", "MatchFinished")
            } else {
                val player = Player(this.username!!, false, this.score, 0, this.chatBlocked)
                this.socketService.send(
                    SocketsSendEvents.PlayerLeftAfterMatchBegun,
                    QuestionRequest(
                        matchAccessCode!!,
                        player,
                        this.changeQuestion.value!!.id,
                        this.hasQuestionEvaluationBegun
                    )
                )
            }
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.JoinBegunMatch) { matchJson ->
            Log.d("MatchService", "JoinBegunMatch OnEvent")
            val jsonString = matchJson.toString()
            val type = object : TypeToken<IMatch>() {}.type
            val match: IMatch = Gson().fromJson(jsonString, type)
            this.match = Match.parseMatch(match)
            _begunMatch.postValue("start")
            this.timerService.startTimer(
                TRANSITIONS_DURATIONS.START_OF_THE_GAME,
                this.matchAccessCode!!,
                {
                    Log.d("MatchService", "Begin time Done")
                    this.currQuestionIndex = 0
                    _changeQuestion.postValue(match.game.questions.get(this.currQuestionIndex!!))
                    _changeRoom.postValue("GameActivity")
                })
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.PlayerRemoved) { newPlayersJson ->
            val jsonString = newPlayersJson.toString()
            val type = object : TypeToken<NewPlayerDto>() {}.type

            val newPlayers: NewPlayerDto = Gson().fromJson(jsonString, type)

            if (match != null) { // On est deja enlever de la room
                if (newPlayers.players.any{player -> player.name == this.username} || this.match!!.managerName == this.username) {
                    this.match?.players = newPlayers.players.toMutableList()
                    this.match?.teams = newPlayers.teams.toMutableList()
                    _newPlayer.postValue(this.match?.players)
                }
                else {
                    _changeRoom.postValue("MainActivity")
                }
            }

            Log.d("MatchService", "New Players: $newPlayers")
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.UpdatedScore) { updatedPlayerJson ->
            Log.d("MatchService", "UpdatedScore : $updatedPlayerJson")
            Log.d("MatchService", "Current Players : ${Gson().toJson(this.match!!.players)}")
            val jsonString = updatedPlayerJson.toString()
            val type = object : TypeToken<UpdatedScoreDto>() {}.type
            val updatedPlayer: UpdatedScoreDto = Gson().fromJson(jsonString, type)
            val playerIndex = this.match?.players?.indexOfFirst { it.name == updatedPlayer.player.name }

            if (playerIndex != -1 && playerIndex != null) {
                Log.d("MatchService", "Found player: ${this.match?.players?.get(playerIndex)?.name}")

                // Update the player in the list
                val updatedPlayers = this.match?.players!!.toMutableList()
                updatedPlayers[playerIndex] = updatedPlayer.player

                // Reassign the updated list to the match object
                this.match?.players = updatedPlayers
            }
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.AllPlayersResponded) { test ->
            Log.d("MatchService", "AllPlayersResponded")
            if (this.match!!.players.all {player -> !player.isActive}) {
                this._changeRoom.postValue("MainActivity")
                Log.d("MatchService", "All Players Left.")
            }
            else if (this.changeQuestion.value!!.type == "QRL") {this._changeState.postValue("QRL")}
            else if (this.changeQuestion.value!!.type == "QCM") {this._changeState.postValue("QCM")}
            else if (this.changeQuestion.value!!.type == "QRE") {this._changeState.postValue("QRE")}
            this.timerService.stopTimer()
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.FinalAnswerSet) { finalAnswerJSON ->
            Log.d("MatchService", "FinalAnswerSet")
            val jsonString = finalAnswerJSON.toString()
            val type = object : TypeToken<PlayerAnswers>() {}.type
            val finalAnswers: PlayerAnswers = Gson().fromJson(jsonString, type)

            val PAindex = this.match!!.playerAnswers.indexOfFirst{playerAnswers -> playerAnswers.name == finalAnswers.name && playerAnswers.questionId == finalAnswers.questionId}
            if (PAindex > -1) this.match!!.playerAnswers[PAindex] = finalAnswers
            else this.match!!.playerAnswers.add(finalAnswers)
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.PlayerDisabled) { disabledPlayerJson ->
            val jsonString = disabledPlayerJson.toString()
            val type = object : TypeToken<IPlayer>() {}.type
            val disabledPlayer: IPlayer = Gson().fromJson(jsonString, type)

        }

        this.socketService.on<JSONObject>(SocketsOnEvents.ChatAccessibilityChanged) { updatedPlayerJson ->
            val jsonString = updatedPlayerJson.toString()
            val type = object : TypeToken<ChatAccessibilityRequest>() {}.type
            val updatedPlayer: ChatAccessibilityRequest = Gson().fromJson(jsonString, type)

        }

        this.socketService.on<JSONObject>(SocketsOnEvents.QrlEvaluationBegun) { test ->
            Log.d("MatchService", "QrlEvaluationBegun")
            this.hasQuestionEvaluationBegun = true
        }

        this.socketService.on<JSONObject>(SocketsOnEvents.QrlEvaluationFinished) { test ->
            Log.d("MatchService", "QrlEvaluationFinished")
            this.hasQuestionEvaluationBegun = false
        }

        this.socketService.on<JSONArray>(SocketsOnEvents.TeamCreated) { teamsJson ->

            val jsonString = teamsJson.toString()
            Log.d("MatchService", "TeamCreated : $jsonString")
            val type = object : TypeToken<List<Team>>() {}.type
            val teams: List<Team> = Gson().fromJson(jsonString, type)

            this.match!!.teams = teams.toMutableList()
            this._changeTeam.postValue(this.match!!.teams)
        }

        this.socketService.on<JSONArray>(SocketsOnEvents.TeamJoined) { teamsJson ->
            val jsonString = teamsJson.toString()
            val type = object : TypeToken<List<Team>>() {}.type
            val teams: List<Team> = Gson().fromJson(jsonString, type)

            this.match!!.teams = teams.toMutableList()
            this._changeTeam.postValue(this.match!!.teams)
        }

        this.socketService.on<JSONArray>(SocketsOnEvents.TeamQuit) { teamsJson ->
            val jsonString = teamsJson.toString()
            val type = object : TypeToken<List<Team>>() {}.type
            val teams: List<Team> = Gson().fromJson(jsonString, type)

            this.match!!.teams = teams.toMutableList()
            this._changeTeam.postValue(this.match!!.teams)
        }
        Log.d("MatchService", "EndOfListeners")
    }

    fun cleanMatchListeners() {
        Log.d("MatchService", "CleanUp")
        val listeners = listOf(
            SocketsOnEvents.NewPlayer,
            SocketsOnEvents.JoinBegunMatch,
            SocketsOnEvents.NewTime,
            SocketsOnEvents.NextQuestion,
            SocketsOnEvents.GameCanceled,
            SocketsOnEvents.AnswerUpdated,
            SocketsOnEvents.AllPlayersResponded,
            SocketsOnEvents.FinalAnswerSet,
            SocketsOnEvents.MatchFinished,
            SocketsOnEvents.UpdatedScore,
            SocketsOnEvents.UpdateChartDataList,
            SocketsOnEvents.TeamCreated,
            SocketsOnEvents.TeamJoined,
            SocketsOnEvents.TeamQuit,
            SocketsOnEvents.PanicModeActivated,
        )

        listeners.forEach { event ->
            socketService.removeListener(event)
        }
    }

    fun joinMatchRoom(matchAccessCode: String, username: String) {
        this.matchAccessCode = matchAccessCode
        this.username = username
        this.socketService.send(SocketsSendEvents.JoinMatch, Gson().toJson(PlayerRequest(matchAccessCode, username, null)))
        this._changeRoom.postValue("Null")
        Log.d("MatchService", "Joining Match with id ${matchAccessCode}.")
    }

    fun sendSwitchQuestion() {
        this.currQuestionIndex = this.currQuestionIndex!! + 1
        this.socketService.send(SocketsSendEvents.SwitchQuestion, Gson().toJson(mapOf("accessCode" to this.match?.accessCode, "currentQuestionIndex" to this.currQuestionIndex)))
    }

    fun activatePanicMode() {
        this.timerService.startPanicModeTimer(this.match!!.accessCode)
    }

    fun updateAnswer(currentChoices: List<IChoice> = arrayListOf(), qrlAnswer: String = "", qreAnswer: Float = 0.0F, time: Int) {
        this.socketService.send(
            SocketsSendEvents.UpdateAnswer,
            Gson().toJson(UpdateAnswerRequest(this.matchAccessCode!!, PlayerAnswers(this.username!!, time.toString(),
                false, this.changeQuestion.value!!.id, this.score, currentChoices, qrlAnswer, false, qreAnswer))))
    }

    fun cancelGame() {
        this.socketService.send(SocketsSendEvents.CancelGame, Gson().toJson(mapOf("id" to this.match?.accessCode)))
        this.leaveMatchRoom()
    }

    fun finishMatch() {
        this.socketService.send(SocketsSendEvents.FinishMatch, Gson().toJson(mapOf("id" to this.match?.accessCode)))
    }

    fun beginMatch() {
        this.socketService.send(SocketsSendEvents.BeginMatch, Gson().toJson(mapOf("id" to this.match?.accessCode)))
    }

    fun leaveMatchRoom() {
        Log.d("MatchService", "leaveMatchRoom")
        if (username == null) Log.d("Null", "Username")
        if (matchAccessCode == null) Log.d("Null", "AccessCode")
        if (username !== null && matchAccessCode !== null)
            this.socketService.send(SocketsSendEvents.RemovePlayer, Gson().toJson(PlayerRequest(matchAccessCode!!, this.username!!, true)))
        this.matchAccessCode = null
        this.match = null
        // this.username = null
        this.score = 0.0F
        this.hasQuestionEvaluationBegun = false
        _changeRoom.postValue("Null")
        _changeState.postValue("Null")
        _newPlayer.postValue(null)
        _begunMatch.postValue("null")
        this.cleanMatchListeners()
    }

    fun banPlayer(username: String) {
        this.socketService.send(SocketsSendEvents.RemovePlayer, Gson().toJson(PlayerRequest(matchAccessCode!!, username, false)))
    }

    fun updateScore() {
        Log.d("MatchService", "UpdateScore with ${this.score} points.")
        val player = Player(this.username!!, true, this.score, nBonus, this.chatBlocked)
        val questionRequest = QuestionRequest(matchAccessCode!!, player, this.changeQuestion.value!!.id, this.hasQuestionEvaluationBegun)
        this.socketService.send(SocketsSendEvents.UpdateScore,  Gson().toJson(questionRequest))
    }

    fun updatePlayerScore(playerName: String, value: Float) {
        val points = this.changeQuestion.value!!.points * value

        Log.d("MatchService", "UpdateScore for $playerName")
        val player = this.match!!.players.find { player -> player.name == playerName }
        if (player == null) {
            Log.d("MatchService", "Player $playerName not found.")
            return
        }
        player.score += points
        val playerScore = QuestionRequest(matchAccessCode!!, player, this.changeQuestion.value!!.id, this.hasQuestionEvaluationBegun)
        this.socketService.send(SocketsSendEvents.UpdateScore, Gson().toJson(playerScore))
    }

    fun setFinalAnswer(qrlAnswers: String = "", qcmAnswers: List<IChoice>, qreAnswer: Float, time: Int) {
        val answer = UpdateAnswerRequest(this.matchAccessCode!!, PlayerAnswers(this.username!!,
            time.toString(), false, this.changeQuestion.value!!.id, this.score, qcmAnswers, qrlAnswers, false, qreAnswer) )
        this.socketService.send(SocketsSendEvents.SetFinalAnswer, Gson().toJson(answer))
    }

    fun playerLeftAfterMatchBegun() {
        if (this.match?.testing == true) {
            _changeRoom.postValue("MainActivity")
            Log.d("MatchService", "LeftAfterMatch")
        }
        else {
            val player = Player(this.username!!, false, this.score, this.nBonus, this.chatBlocked)
            Log.d("MatchService", "LeftAfterMatch + accessCode : ${this.matchAccessCode}")
            this.socketService.send(
                SocketsSendEvents.PlayerLeftAfterMatchBegun,
                Gson().toJson(QuestionRequest(
                    matchAccessCode!!,
                    player,
                    this.changeQuestion.value!!.id,
                    this.hasQuestionEvaluationBegun
                ))
            )
            _changeRoom.postValue("MainActivity")
        }
        leaveMatchRoom()
    }

    fun changeChatAccessibility(playerName: String) {
        this.socketService.send(
            SocketsSendEvents.ChangeChatAccessibility,
            Gson().toJson(ChatAccessibilityRequest(this.matchAccessCode!!, playerName, this.match!!.players)))
    }

    fun beginQrlEvaluation() {
        this.socketService.send(SocketsSendEvents.BeginQrlEvaluation, Gson().toJson(mapOf("id" to this.match?.accessCode)))
    }

    fun finishQrlEvaluation() {
        this.socketService.send(SocketsSendEvents.FinishQrlEvaluation, Gson().toJson(mapOf("id" to this.match?.accessCode)))
    }

    fun createTeam(teamName: String) {
        this.socketService.send(SocketsSendEvents.CreateTeam, Gson().toJson(CreateTeamDto(this.match!!.accessCode, teamName, this.username!!)))
    }

    fun joinTeam(teamName: String) {
        this.socketService.send(SocketsSendEvents.JoinTeam, Gson().toJson(CreateTeamDto(this.match!!.accessCode, teamName, this.username!!)))
    }

    fun leaveTeam(teamName: String) {
        this.socketService.send(SocketsSendEvents.QuitTeam, Gson().toJson(CreateTeamDto(this.match!!.accessCode, teamName, this.username!!)))
    }


    fun onTimerFinished() {
        Log.d("MatchService", "onTimerFinished with question # ${this.currQuestionIndex}.")
        Log.d("MatchService", "quiz has ${this.match!!.game.questions.size} questions.")
        if (this.match!!.players.all { player -> !player.isActive}) {
            this._changeRoom.postValue("MainActivity")
            Log.d("MatchService", "All Players Left.")
        }
        if (this.match!!.game.questions.size == this.currQuestionIndex) // If it's the last question
        {
            if (this.match!!.testing){
                this.leaveMatchRoom()
                this._changeRoom.postValue("MainActivity")
                Log.d("MatchService", "timerFinished")
            }
            else {
                this._changeRoom.postValue("ResultsActivity") // TODO : Do the layout
            }
        }
        else {
            _changeQuestion.postValue(this.match!!.game.questions[this.currQuestionIndex!!])
            this._changeState.postValue("Questions")
            val timerDuration: Int =
                if (this.match!!.game.questions[this.currQuestionIndex!!].type == QUESTION_TYPE.QRL) { 60 }
                else { this.match!!.game.duration }
            this.timerService.startTimer(timerDuration, this.matchAccessCode!!) {}
        }
    }

    override fun onBind(p0: Intent?): IBinder? {
        return null
    }


    // -------------------- Team Management Methods --------------------


    suspend fun joinTeam(teamName: String, userName: String) {

        withContext(Dispatchers.IO) {
            match?.let {
                val team = it.teams.find { t -> t.name == teamName }
                if (team != null) {
                    team.players.add(userName)
                    Log.d("MatchService", "Player '$userName' joined team '${team.name}'")
                    // Optionally, notify the server about the player joining the team
                } else {
                    Log.e("MatchService", "Team '$teamName' not found.")
                }
            } ?: run {
                Log.e("MatchService", "Cannot join team. Match is null.")
            }
        }
    }

}
