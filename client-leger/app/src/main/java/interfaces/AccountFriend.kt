package interfaces

import org.json.JSONObject

data class AccountFriend(
    val userId: String,
    val pseudonym: String?,
    val avatarUrl: String?,
    val isFriend: Boolean,
    val isRequestReceived: Boolean,
    val isRequestSent: Boolean,
    val isBlocked: Boolean,
    val isBlockingMe: Boolean
)
