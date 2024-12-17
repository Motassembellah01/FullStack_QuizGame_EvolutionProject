package com.auth0.androidlogin.models

data class ConnectionEvent(
    val type: String,      // "Signin" or "Signout"
    val dateTime: String   // e.g., "2023-10-01 14:30"
)
