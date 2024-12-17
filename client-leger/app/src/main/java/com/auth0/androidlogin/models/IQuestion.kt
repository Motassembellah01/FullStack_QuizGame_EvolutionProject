package com.auth0.androidlogin.models

import classes.Choice
import com.google.gson.annotations.SerializedName

open class IQuestion(
    @SerializedName("id")
    val id: String,

    @SerializedName("type")
    val type: String,

    @SerializedName("text")
    val text: String,

    @SerializedName("points")
    val points: Int,

    @SerializedName("choices")
    val choices: List<IChoice>,

    @SerializedName("timeAllowed")
    val timeAllowed: Int,

    @SerializedName("tolerance")
    val tolerance: Float,

    @SerializedName("lowerBound")
    val lowerBound: Float,

    @SerializedName("upperBound")
    val upperBound: Float,

    @SerializedName("image")
    val image: String?,
)
