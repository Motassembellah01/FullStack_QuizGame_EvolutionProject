package interfaces.dto

import com.auth0.androidlogin.models.IGame
import com.google.gson.annotations.SerializedName

data class CreateMatchDto (
    @SerializedName("game")
    val game: IGame,

    @SerializedName("managerName")
    val managerName: String,

    @SerializedName("managerId")
    val managerId: String,

    @SerializedName("isTeamMatch")
    val isTeamMatch: Boolean,

    @SerializedName("isPricedMatch")
    val isPricedMatch: Boolean,

    @SerializedName("isFriendMatch")
    val isFriendMatch: Boolean,

    @SerializedName("priceMatch")
    val priceMatch: Number,

)
