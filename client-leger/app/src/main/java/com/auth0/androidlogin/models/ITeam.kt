package com.auth0.androidlogin.models

interface ITeam {
    val name: String
    val players: MutableList<String>
    val teamScore: Float
}
