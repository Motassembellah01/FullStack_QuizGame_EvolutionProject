package com.auth0.androidlogin.models

data class Session(
    val _id: String,
    val userId: String,
    val loginAt: String,
    val logoutAt: String,
    val __v: Int
)
