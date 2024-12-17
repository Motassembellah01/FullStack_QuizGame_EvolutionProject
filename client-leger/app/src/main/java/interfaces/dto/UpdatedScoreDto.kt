package interfaces.dto

import classes.Team
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.models.ITeam
import com.google.gson.annotations.SerializedName

data class UpdatedScoreDto (
    @SerializedName("teams")
    val teams: List<Team>,

    @SerializedName("player")
    val player: IPlayer
)
