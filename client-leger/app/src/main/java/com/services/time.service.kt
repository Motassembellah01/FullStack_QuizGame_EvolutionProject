package com.services

import SocketService
import androidx.lifecycle.MutableLiveData

import androidx.lifecycle.ViewModel
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import constants.DURATIONS
import constants.SocketsOnEvents
import constants.SocketsSendEvents
import interfaces.StopServerTimerRequest
import interfaces.TimerRequest
import interfaces.dto.NewTimeDto
import org.json.JSONObject
import java.util.*

typealias TimerCallback = () -> Unit

object TimeService : ViewModel() {

    private val socketService: SocketService = SocketService
    private var counter: Int = 0
    private val _newTime = MutableLiveData<Int>()
    val newTime: MutableLiveData<Int> get() = _newTime

    var timer: Int
        get() = counter
        set(value) {
            if (value == 0) stopTimer()
            else counter = value
        }

    /**
     * Action parameter is a function that is going to be called when the time finishes.
     */
    fun startTimer(startValue: Int, matchAccessCode: String, finalAction: TimerCallback) {
        //if (joinMatchService.playerName.isNullOrEmpty()) {
            socketService.send(
                SocketsSendEvents.StartTimer,
                Gson().toJson(TimerRequest(roomId = matchAccessCode, timer = startValue, timeInterval = DURATIONS.TIMER_INTERVAL))
            )
        //}
        counter = startValue

        socketService.on<JSONObject>(SocketsOnEvents.NewTime) { timerRequestJson ->
            val jsonString = timerRequestJson.toString()
            val type = object : TypeToken<NewTimeDto>() {}.type

            val timerRequest: NewTimeDto = Gson().fromJson(jsonString, type)
            counter = timerRequest.timer
            _newTime.postValue(counter)

            if (timerRequest.timer < 1) {
                counter = 0
                socketService.removeListener(SocketsOnEvents.NewTime)
                finalAction()
            }
        }
    }

    fun startPanicModeTimer(matchAccessCode: String) {
        //if (joinMatchService.playerName.isNullOrEmpty()) {
            socketService.send(
                SocketsSendEvents.StartTimer,
                Gson().toJson(TimerRequest(roomId = matchAccessCode, timer = counter, timeInterval = DURATIONS.PANIC_MODE_INTERVAL))
            )
        //}
    }

    fun stopServerTimer(matchAccessCode: String, isHistogramTimer: Boolean = false) {
        socketService.send(
            SocketsSendEvents.StopTimer,
            Gson().toJson(StopServerTimerRequest(roomId = matchAccessCode, isHistogramTimer = isHistogramTimer))
        )
    }

    fun stopTimer() {
        counter = 0
        socketService.removeListener(SocketsOnEvents.NewTime)
    }

    fun resumeTimer(matchAccessCode: String, action: TimerCallback) {
        startTimer(counter, matchAccessCode, action)
    }

    fun getCurrentTime(): String {
        val currentTime = Calendar.getInstance()
        val hours = currentTime.get(Calendar.HOUR_OF_DAY).toString().padStart(2, '0')
        val minutes = currentTime.get(Calendar.MINUTE).toString().padStart(2, '0')
        val seconds = currentTime.get(Calendar.SECOND).toString().padStart(2, '0')
        return "$hours:$minutes:$seconds"
    }
}
