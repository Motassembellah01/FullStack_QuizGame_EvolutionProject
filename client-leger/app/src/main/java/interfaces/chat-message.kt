import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import kotlin.reflect.KClass

data class ChatMessage (
    val userId: String,
    val time: String,
    val data: String,
)

fun toObject(jsonObject: JSONObject, clazz: KClass<ChatMessage>): ChatMessage {
    try {
        val userId = jsonObject.optString("userId");
        val time = jsonObject.getString("time");
        val data = jsonObject.getString("data");
        val chatMessage = ChatMessage(userId, time, data);
        return chatMessage;
    }
    catch(error: Exception) {
        Log.e("ChatMessage", error.message ?: "Unknown Error");
        throw Exception("ChatMessage Error in toObject().");
    };
}

fun toObjectList(jsonArray: JSONArray, clazz:KClass<ChatMessage>): ArrayList<ChatMessage> {
    try {
        val objectList = ArrayList<ChatMessage>();
        for (i in 0 until jsonArray.length()) {
            val chatMessage = toObject(jsonArray.getJSONObject(i), clazz);
            objectList.add(chatMessage);
        }
        return objectList;
    }
    catch(error: Exception) {
        Log.e("ChatMessage", error.message ?: "Unknown Error");
        throw Exception("ChatMessage Error in toObjectList().");
    }
}

fun toJson(chatMessage: ChatMessage): JSONObject {
    try {
        val jsonObject = JSONObject()
        jsonObject.put("userId", chatMessage.userId)
        jsonObject.put("time", chatMessage.time)
        jsonObject.put("data", chatMessage.data)
        return jsonObject
    } catch (error: Exception) {
        Log.e("ChatMessage", error.message ?: "Unknown Error")
        throw Exception("ChatMessage Error in toJson()")
    }
}
