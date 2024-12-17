package com.auth0.androidlogin.models

import com.google.gson.annotations.SerializedName

open class IChoice(
    @SerializedName("text")
    val text: String?,

    @SerializedName("isCorrect")
    val isCorrect: Boolean
)
