package com.auth0.androidlogin.models

import classes.Team
import com.google.gson.annotations.SerializedName

open class IMatch(
    @SerializedName("game")
    val game: IGame,

    @SerializedName("begin")
    val begin: String,

    @SerializedName("end")
    val end: String,

    @SerializedName("bestScore")
    val bestScore: Int,

    @SerializedName("accessCode")
    val accessCode: String,

    @SerializedName("testing")
    val testing: Boolean,

    @SerializedName("players")
    var players:  MutableList<IPlayer>,

    @SerializedName("observers")
    var observers:  MutableList<IObserver>,

    @SerializedName("managerName")
    val managerName: String,

    @SerializedName("managerId")
    val managerId: String,

    @SerializedName("isAccessible")
    var isAccessible: Boolean,

    @SerializedName("isFriendMatch")
    var isFriendMatch: Boolean,

    @SerializedName("bannedNames")
    val bannedNames: MutableList<String>,

    @SerializedName("playerAnswers")
    var playerAnswers: MutableList<IPlayerAnswers>,

    @SerializedName("panicMode")
    val panicMode: Boolean,

    @SerializedName("timer")
    val timer: Int,

    @SerializedName("timing")
    val timing: Boolean,

    @SerializedName("isTeamMatch")
    var isTeamMatch: Boolean,

    @SerializedName("isPricedMatch")
    var isPricedMatch: Boolean,

    @SerializedName("priceMatch")
    var priceMatch: Number = 0,

    @SerializedName("nbPlayersJoined")
    var nbPlayersJoined: Number = 0,

    @SerializedName("teams")
    var teams: MutableList<Team> = mutableListOf(),

    @SerializedName("currentQuestionIndex")
    val currentQuestionIndex: Number
)
