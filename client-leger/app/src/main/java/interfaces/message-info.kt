import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import kotlin.reflect.KClass

data class MessageInfo(
    val message: ChatMessage,
    var read: Boolean
)

fun toObject(jsonObject: JSONObject, clazz: KClass<MessageInfo>): MessageInfo {
    try {
        val message = toObject(jsonObject.getJSONObject("message"), ChatMessage::class);
        val read = jsonObject.getBoolean("read");
        val messageInfo = MessageInfo(message, read);
        return messageInfo;
    }
    catch(error: Exception) {
        Log.e("MessageInfo", error.message ?: "Unknown Error")
        throw Exception("MessageInfo Error in toObject().");
    };
}

fun toObjectList(jsonArray: JSONArray, clazz:KClass<MessageInfo>): ArrayList<MessageInfo> {
    try {
        val objectList = ArrayList<MessageInfo>();
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

fun toJson(messageInfo: MessageInfo): JSONObject {
    try {
        // Create the main JSONObject for MessageInfo
        val jsonObject = JSONObject()

        // Convert the ChatMessage part of MessageInfo to JSONObject
        val messageJson = toJson(messageInfo.message)

        // Add the ChatMessage JSON to the main JSONObject
        jsonObject.put("message", messageJson)

        // Add the 'read' status to the JSONObject
        jsonObject.put("read", messageInfo.read)

        return jsonObject
    } catch (error: Exception) {
        Log.e("MessageInfo", error.message ?: "Unknown Error")
        throw Exception("MessageInfo Error in toJson()")
    }
}

