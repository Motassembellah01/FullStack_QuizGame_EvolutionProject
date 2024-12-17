import android.util.Log
import constants.ChatRoomType
import org.json.JSONArray
import org.json.JSONObject
import kotlin.reflect.KClass

data class JoinedChatRoom (
    val chatRoomName: String,
    val chatRoomType: ChatRoomType,
    val owner: String,
    val messages: ArrayList<MessageInfo>,
    val players: ArrayList<String>,
)

fun toObject(jsonObject: JSONObject, clazz: KClass<JoinedChatRoom>): JoinedChatRoom {
    try {
        val chatRoomName = jsonObject.getString("chatRoomName");
        if (chatRoomName.isEmpty()) throw Exception("'name' is empty.");
        val chatRoomType: ChatRoomType = when (jsonObject.getString("chatRoomType")) {
            "general" -> ChatRoomType.General
            "public" -> ChatRoomType.Public
            "match" -> ChatRoomType.Match
            else -> throw(Error("invalid constants.ChatRoomType"))
        }
        val owner = jsonObject.getString("owner")
        val messages = toObjectList(jsonObject.getJSONArray("messages"), MessageInfo::class)
        val playersJson = jsonObject.getJSONArray("players")
        val players = ArrayList<String>()
        for (i in 0 until playersJson.length()){
            players.add(playersJson.getString(i))
        }
        val joinedChatRoom = JoinedChatRoom(chatRoomName, chatRoomType, owner, messages, players);
        return joinedChatRoom
    }
    catch(error: Exception) {
        Log.e("JoinedChatRoom", error.message ?: "Unknown Error")
        throw Exception("JoinedChatRoom Error in toObject().");
    };
}

fun toObjectList(jsonArray: JSONArray, clazz:KClass<JoinedChatRoom>): ArrayList<JoinedChatRoom> {
    try {
        val objectList = ArrayList<JoinedChatRoom>();
        for (i in 0 until jsonArray.length()) {
            Log.d("JoinedChatRoom", jsonArray.getJSONObject(i).toString());
            val joinedChatRoom = toObject(jsonArray.getJSONObject(i), clazz);
            objectList.add(joinedChatRoom);
        }
        return objectList;
    }
    catch(error: Exception) {
        Log.e("JoinedChatRoom", error.message ?: "Unknown Error");
        throw Exception("JoinedChatRoom Error in toObjectList().");
    }
}

fun toJson(joinedChatRoom: JoinedChatRoom): JSONObject {
    try {
        // Create the main JSONObject for JoinedChatRoom
        val jsonObject = JSONObject()

        // Add the chatRoomName field to the JSONObject
        jsonObject.put("chatRoomName", joinedChatRoom.chatRoomName)

        // Create a JSONArray to store the messages (MessageInfo objects)
        val messagesArray = JSONArray()

        // Loop through the messages and convert each MessageInfo to JSON
        for (messageInfo in joinedChatRoom.messages) {
            val messageJson = toJson(messageInfo.message)  // Reuse the toJson function for MessageInfo
            messagesArray.put(messageJson)
        }

        // Add the messages array to the JSONObject
        jsonObject.put("messages", messagesArray)

        return jsonObject
    } catch (error: Exception) {
        Log.e("JoinedChatRoom", error.message ?: "Unknown Error")
        throw Exception("JoinedChatRoom Error in toJson()")
    }
}



