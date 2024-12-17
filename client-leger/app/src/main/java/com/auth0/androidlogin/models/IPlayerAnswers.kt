package com.auth0.androidlogin.models

import classes.Choice
import com.google.gson.annotations.SerializedName

open class IPlayerAnswers(
    @SerializedName("name")
    val name: String,

    @SerializedName("lastAnswerTime")
    val lastAnswerTime: String,

    @SerializedName("final")
    val final: Boolean,

    @SerializedName("questionId")
    val questionId: String,

    @SerializedName("obtainedPoints")
    val obtainedPoints: Float,

    @SerializedName("qcmAnswers")
    val qcmAnswers: List<IChoice>?,

    @SerializedName("qrlAnswer")
    val qrlAnswer: String,

    @SerializedName("isTypingQrl")
    val isTypingQrl: Boolean,

    @SerializedName("qreAnswer")
    val qreAnswer: Float,

    @SerializedName("isFirstAttempt")
    val isFirstAttempt: Boolean? = null // Optional field
)
