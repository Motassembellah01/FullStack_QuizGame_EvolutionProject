package interfaces.dto

import com.auth0.androidlogin.models.Account
import interfaces.AccountFriend

data class FriendRequestData(
    val requestId: String,
    val senderBasicInfo: Account?
)
