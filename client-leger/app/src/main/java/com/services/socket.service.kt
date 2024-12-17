import android.util.Log
import constants.ChatSocketsEmitEvents
import constants.SERVER_URL
import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

object SocketService {
    private var socket: Socket? = null
    private var userId: String = ""
    private val serverUrl = SERVER_URL

    fun setUserId(userId: String) { // Vraiment trash, mais je n'ai pas trouver d'autres moyens atm
        this.userId = userId
    }

    fun getUserId(): String {
        return this.userId
    }
    fun getSocket(): Socket? {
        return socket
    }

    init {
        try {
            if(!isSocketAlive()) socket = IO.socket(this.serverUrl) // TODO : Replace with your server URL
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }

    fun isSocketAlive(): Boolean {
        Log.d("SocketService", "isSocketAlive() has been called.")
        return socket != null && socket!!.connected()
    }

    /**
     * This method should be called before using any other WebSocket feature.
     * You can use isSocketAlive to validate if it's already connected.
     */
    fun connect() {
        if (isSocketAlive()) return
        try {
            Log.d("SocketService", "handshake has been called.")
            socket = IO.socket(this.serverUrl) // TODO : Replace with your server URL
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
        try {
            socket?.connect()
            Log.d("SocketService", "socket has been connected")
            this.send(ChatSocketsEmitEvents.UserInfo, this.userId)
            this.send("register",this.userId)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }


    fun disconnect() {
        this.send("unregister",this.userId)
        this.userId = ""
        socket?.disconnect()
        socket = null
    }

    fun <T> on(event: String, action: (data: T) -> Unit) {
        socket?.off(event) // Remove previous listeners
        socket?.on(event) { args ->
            if (args.isNotEmpty()) {
                action(args[0] as T) // Cast the data to the expected type
            }
        }
    }

    fun removeListener(event: String) {
        socket?.off(event)
    }

    fun <T> send(event: String, data: T? = null) {
        if (data != null) {
            socket?.emit(event, data)
        } else {
            socket?.emit(event)
        }
    }
}
