package interfaces

import com.auth0.androidlogin.models.MatchHistory
import com.google.gson.annotations.SerializedName
import interfaces.dto.FriendRequestData

data class PartialAccount (
    @SerializedName("friends")
    val friends: List<String>?,

    @SerializedName("friendRequests")
    val friendRequests: List<FriendRequestData>?,

    @SerializedName("friendsThatUserRequested")
    val friendsThatUserRequested: List<String>?,

    @SerializedName("_id")
    val id: String?,

    @SerializedName("userId")
    val userId: String?,

    @SerializedName("pseudonym")
    val pseudonym: String?,

    @SerializedName("avatarUrl")
    val avatarUrl: String?,

    @SerializedName("matchHistory")
    val matchHistory: List<MatchHistory>?,

    @SerializedName("money")
    val money: Int?,

    @SerializedName("themeVisual")
    val themeVisual: String?,

    @SerializedName("blocked")
    val blocked: List<String?>?,

    @SerializedName("visualThemesOwned")
    val visualThemesOwned: List<String>?,

    @SerializedName("avatarsUrlOwned")
    val avatarsUrlOwned: List<String>?,

    @SerializedName("lang")
    val lang: String?,

    @SerializedName("__v")
    val version: Int? = null

){
    fun toObject(partialObject:PartialAccount): AccountFriend {
        return AccountFriend(
            userId = partialObject.userId!!,
            pseudonym = partialObject.pseudonym,
            avatarUrl = partialObject.avatarUrl,
            isBlocked = false,
            isFriend = false,
            isRequestReceived = false,
            isRequestSent = false,
            isBlockingMe = false
        )
    }
}
