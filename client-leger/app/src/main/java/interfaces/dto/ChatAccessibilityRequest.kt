package interfaces.dto

import classes.Player
import com.auth0.androidlogin.models.IPlayer

data class ChatAccessibilityRequest(
    val matchAccessCode: String,
    val name: String,
    val players: List<IPlayer>
)
