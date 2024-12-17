package interfaces

import constants.ChatRoomType
import android.util.Log
import org.json.JSONObject

data class ChatRoomInfo(
    val chatRoomName: String,
    val chatRoomType: ChatRoomType
)

fun toJson(chatRoomInfo: ChatRoomInfo): JSONObject {
    try {
        val jsonObject = JSONObject()

        jsonObject.put("chatRoomName", chatRoomInfo.chatRoomName)
        jsonObject.put("chatRoomType", chatRoomInfo.chatRoomType.type)
        Log.d("Public", chatRoomInfo.chatRoomType.type)
        return jsonObject
    } catch (error: Exception) {
        Log.e("ChatRoomInfo", error.message ?: "Unknown Error")
        throw Exception("Error in toJson()")
    }
}
