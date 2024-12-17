package com.auth0.androidlogin.models

import classes.Question
import com.google.gson.annotations.SerializedName

open class IGame(
    @SerializedName("id")
    val id: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("isVisible")
    val isVisible: Boolean,

    @SerializedName("description")
    val description: String,

    @SerializedName("duration")
    val duration: Int,

    @SerializedName("questions")
    val questions: List<IQuestion>,

    // Add other fields if necessary
    @SerializedName("creator")
    val creator: String?,

    @SerializedName("lastModification")
    val lastModification: String,
)

data class MapEntry(
    @SerializedName("key")
    val key: String,

    @SerializedName("value")
    val value: Int
)
