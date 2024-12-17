package interfaces

data class TimerRequest(
    val roomId: String,
    val timer: Int,
    val timeInterval: Int? = null,
    val isHistogramTimer: Boolean? = null
)
