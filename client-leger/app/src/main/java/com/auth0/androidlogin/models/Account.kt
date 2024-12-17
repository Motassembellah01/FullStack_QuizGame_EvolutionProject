// Account.kt
package com.auth0.androidlogin.models

import com.google.gson.annotations.SerializedName
import interfaces.dto.FriendRequestData

data class Account(
    @SerializedName("friends")
    val friends: List<String>,

    @SerializedName("friendRequests")
    val friendRequests: List<FriendRequestData>,

    @SerializedName("friendsThatUserRequested")
    val friendsThatUserRequested: List<String>,

    @SerializedName("_id")
    val id: String,

    @SerializedName("userId")
    val userId: String,

    @SerializedName("pseudonym")
    val pseudonym: String,

    @SerializedName("avatarUrl")
    val avatarUrl: String?,

    @SerializedName("matchHistory")
    val matchHistory: List<MatchHistory>,

    @SerializedName("money")
    val money: Int,

    @SerializedName("gamesPlayed")
    val gamesPlayed: Int,

    @SerializedName("gamesWon")
    val gamesWon: Int,

    @SerializedName("avgQuestionsCorrect")
    val avgQuestionsCorrect: Number,

    @SerializedName("avgTimePerGame")
    val avgTimePerGame: Number,

    @SerializedName("themeVisual")
    val themeVisual: String,

    @SerializedName("visualThemesOwned")
    val visualThemesOwned: List<String>,

    @SerializedName("avatarsUrlOwned")
    val avatarsUrlOwned: List<String>,

    @SerializedName("lang")
    val lang: String,

    @SerializedName("UsersBlocked")
    val blocked: List<String?>,

    @SerializedName("UsersBlockingMe")
    val blockingMe: List<String?>,

    @SerializedName("__v")
    val version: Int? = null // Optional field
)
