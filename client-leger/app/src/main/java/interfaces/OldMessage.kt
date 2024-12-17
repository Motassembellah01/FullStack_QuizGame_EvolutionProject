package interfaces
import ChatMessage
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import toObjectList
import kotlin.reflect.KClass

data class OldMessage(
    val chatRoomName: String,
    var messages: ArrayList<ChatMessage>
)

fun toObject(jsonObject: JSONObject, clazz: KClass<OldMessage>): OldMessage {
    try {
        val chatRoomName = jsonObject.getString("chatRoomName");
        val messages = toObjectList(jsonObject.getJSONArray("messages"), ChatMessage::class)
        val oldMessage = OldMessage(chatRoomName, messages);
        return oldMessage;
    }
    catch(error: Exception) {
        Log.e("MessageInfo", error.message ?: "Unknown Error")
        throw Exception("MessageInfo Error in toObject().");
    };
}

fun toObjectList(jsonArray: JSONArray, clazz:KClass<OldMessage>): ArrayList<OldMessage> {
    try {
        val objectList = ArrayList<OldMessage>();
        for (i in 0 until jsonArray.length()) {
            val messageInfo = toObject(jsonArray.getJSONObject(i), clazz);
            objectList.add(messageInfo);
        }
        return objectList;
    }
    catch(error: Exception) {
        Log.e("MessageInfo", error.message ?: "Unknown Error");
        throw Exception("MessageInfo Error in toObjectList().");
    }
}

fun toJson(oldMessages: OldMessage): JSONObject {
    try {
        val jsonObject = JSONObject()

        jsonObject.put("chatRoomName", oldMessages.chatRoomName)
        val jsonArray = JSONArray()
        for (message in oldMessages.messages) {
            val messageJson = JSONObject()
            messageJson.put("userId", message.userId)
            messageJson.put("time", message.time)
            messageJson.put("data", message.data)
            jsonArray.put(messageJson)
        }
        jsonObject.put("messages", jsonArray)

        return jsonObject
    } catch (error: Exception) {
        Log.e("MessageInfo", error.message ?: "Unknown Error")
        throw Exception("Error in toJson()")
    }
}
