package interfaces.dto

import com.auth0.androidlogin.models.IPlayer

data class QuestionRequest(
    val matchAccessCode: String,
    val player: IPlayer,
    val questionId: String,
    val hasQrlEvaluationBegun: Boolean
)
