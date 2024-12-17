package interfaces

data class MatchHistoryEvent(
    val gameName: String,
    val startTime: String, // Using String for simplicity; consider using Date or LocalDateTime
    val status: String
)
