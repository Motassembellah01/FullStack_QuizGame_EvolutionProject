package interfaces.dto

import classes.Player
import classes.Team
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.models.ITeam
import com.google.gson.annotations.SerializedName

data class NewPlayerDto (
    @SerializedName("players")
    val players: List<Player>,

    @SerializedName("isTeamMatch")
    val isTeamMatch: Boolean,

    @SerializedName("teams")
    val teams: List<Team>,

    @SerializedName("isPricedMatch")
    val isPricedMatch: Boolean,

    @SerializedName("nbPlayersJoined")
    val nbPlayersJoined: Number,

    @SerializedName("priceMatch")
    val priceMatch: Number,
)


