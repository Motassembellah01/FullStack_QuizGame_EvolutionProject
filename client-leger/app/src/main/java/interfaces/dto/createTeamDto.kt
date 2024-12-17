package interfaces.dto

data class CreateTeamDto(
    val accessCode: String,
    val teamName: String,
    val playerName: String
)

