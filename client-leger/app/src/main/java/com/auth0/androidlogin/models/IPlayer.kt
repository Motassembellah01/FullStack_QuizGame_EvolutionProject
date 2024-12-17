package com.auth0.androidlogin.models

import com.google.gson.annotations.SerializedName

open class IPlayer(
    @SerializedName("name")
    val name: String,

    @SerializedName("isActive")
    val isActive: Boolean,

    @SerializedName("score")
    var score: Float,

    @SerializedName("nBonusObtained")
    val nBonusObtained: Int,

    @SerializedName("chatBlocked")
    val chatBlocked: Boolean,

    @SerializedName("prize")
    var prize: Int = 0,

    @SerializedName("avatar")
    val avatar: String? = ""
)
