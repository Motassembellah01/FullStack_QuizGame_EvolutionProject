package interfaces

data class StopServerTimerRequest(
    val roomId: String,
    val isHistogramTimer: Boolean
)
