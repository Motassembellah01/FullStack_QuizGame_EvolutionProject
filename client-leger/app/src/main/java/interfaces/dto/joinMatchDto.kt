import com.google.gson.annotations.SerializedName

data class JoinMatchDto(
    @SerializedName("accessCode")
    val accessCode: String,

    @SerializedName("playerName")
    val playerName: String,
)
