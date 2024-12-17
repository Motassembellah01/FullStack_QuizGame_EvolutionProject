import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import kotlin.reflect.KClass

data class ChatRoomMessageData(
    val chatRoomName: String,
    val data: ChatMessage
)

fun toObject(jsonObject: JSONObject, clazz: KClass<ChatRoomMessageData>): ChatRoomMessageData {
    try {
        val chatRoomName = jsonObject.getString("chatRoomName");
        val data = toObject(jsonObject.getJSONObject("data"), ChatMessage::class)
        val chatRoomMessageData = ChatRoomMessageData(chatRoomName, data);
        return chatRoomMessageData;
    }
    catch(error: Exception) {
        Log.e("ChatRoomMessageData", error.message ?: "Unknown Error")
        throw Exception("ChatRoomMessageData Error in toObject().");
    };
}

fun toObjectList(jsonArray: JSONArray, clazz:KClass<ChatRoomMessageData>): ArrayList<ChatRoomMessageData> {
    try {
        val objectList = ArrayList<ChatRoomMessageData>();
        for (i in 0 until jsonArray.length()) {
            val chatRoomMessageData = toObject(jsonArray.getJSONObject(i), clazz);
            objectList.add(chatRoomMessageData);
        }
        return objectList;
    }
    catch(error: Exception) {
        Log.e("ChatRoomMessageData", error.message ?: "Unknown Error");
        throw Exception("ChatRoomMessageData Error in toObjectList().");
    }
}

fun toJson(chatRoomMessageData: ChatRoomMessageData): JSONObject {
    try {
        val jsonObject = JSONObject()

        jsonObject.put("chatRoomName", chatRoomMessageData.chatRoomName)
        val messageJson = toJson(chatRoomMessageData.data)
        jsonObject.put("data", messageJson)

        return jsonObject
    } catch (error: Exception) {
        Log.e("ChatRoomMessageData", error.message ?: "Unknown Error")
        throw Exception("ChatRoomMessageData Error in toJson()")
    }
}
