package com.auth0.androidlogin.models

import com.google.gson.annotations.SerializedName

class IObserver(
    @SerializedName("name")
    var name:  String,

    @SerializedName("observedName")
    var observedName:  String
)
