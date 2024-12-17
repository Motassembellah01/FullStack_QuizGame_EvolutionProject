package interfaces

import com.google.gson.annotations.SerializedName

data class PlayerRequest(
    @SerializedName("roomId")
    val roomId: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("hasPlayerLeft")
    val hasPlayerLeft: Boolean?
)
