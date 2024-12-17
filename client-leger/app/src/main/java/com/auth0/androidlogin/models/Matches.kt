package com.auth0.androidlogin.models

data class Matches(
    val accessCode: String,
    val quizName: String,
    val playersCount: Int,
    val observersCount: Int,
    val hasStarted: Boolean,
    val isAccessible: Boolean,
    val isPricedMatch: Boolean,
    val isFriendMatch: Boolean,
    val priceMatch: Number,
    val managerName: String,
    val managerId: String
)
