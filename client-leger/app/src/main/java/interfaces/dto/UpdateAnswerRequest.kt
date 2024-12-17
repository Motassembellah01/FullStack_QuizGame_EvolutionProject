package interfaces.dto

import classes.PlayerAnswers

data class UpdateAnswerRequest(
    val matchAccessCode: String,
    val playerAnswers: PlayerAnswers
)
