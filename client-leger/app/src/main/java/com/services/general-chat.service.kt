package com.services

import ChatMessage
import ChatRoomMessageData
import constants.ChatRoomType
import constants.ChatSocketsEmitEvents
import constants.ChatSocketsSubscribeEvents
import JoinedChatRoom
import MessageInfo
import SocketService
import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import interfaces.ChatRoomInfo
import interfaces.OldMessage
import interfaces.toJson
import interfaces.toObject
import okio.IOException
import org.json.JSONObject
import toJson
import toObject


object ChatSocketService: Service() {
    private val _isChatOpen = MutableLiveData<Boolean>()
    val isChatOpen: LiveData<Boolean> get() = _isChatOpen
    private var channels = MutableLiveData<ArrayList<String>>(ArrayList())
    var joinedChatRooms = MutableLiveData<ArrayList<JoinedChatRoom>>(ArrayList())
    var currentChatRoom: JoinedChatRoom? = null

    private val _newMessage = MutableLiveData<ChatRoomMessageData?>()
    val newMessage: MutableLiveData<ChatRoomMessageData?> get() = _newMessage

    private val _changeChannel = MutableLiveData<Boolean>()
    val changeChannel: LiveData<Boolean> get() = _changeChannel

    val channelsSubject: LiveData<ArrayList<String>> get() = channels

    val joinedChatRoomsSubject: LiveData<ArrayList<JoinedChatRoom>> get() = joinedChatRooms

    private val socketService: SocketService = SocketService

    var hasUnreadMessages: Boolean = false

    //Section tp override Service
   override fun onBind(intent: Intent?): IBinder? {
        return null
   }

    init {
        _newMessage.postValue(null)
        _isChatOpen.postValue(false)
        currentChatRoom = null
        Runtime.getRuntime().addShutdownHook(Thread {
            try {
                SocketService.disconnect()
            }
            catch (e: IOException)
            {
                Log.e("ChatSocketService",e.toString())
            }
        })
    }

    fun connect() {
        SocketService.connect()
        Log.d("ChatSocketService", "connect() has been called.")
        setUpSocketListeners()
    }

    fun resetService(){
        _newMessage.postValue(null)
        _isChatOpen.postValue(false)
        currentChatRoom = null
        channels = MutableLiveData<ArrayList<String>>()
        joinedChatRooms = MutableLiveData<ArrayList<JoinedChatRoom>>(ArrayList())
        SocketService.disconnect()
    }

    private fun getChannels() {
        SocketService.send(ChatSocketsEmitEvents.GetChannels, null)
    }

    fun toggleChat() {
        if (_isChatOpen.value != null) {
            _isChatOpen.value = !_isChatOpen.value!!
            currentChatRoom = null
            _isChatOpen.postValue(_isChatOpen.value)
            _newMessage.postValue(null)
        } else {
            _isChatOpen.postValue(true)
        }
    }

    fun sendMessage(chatMsg: ChatRoomMessageData) {
        val msg = toJson(chatMsg)
        SocketService.send(ChatSocketsEmitEvents.SendMessage, msg)
    }

    fun selectChatRoom(chatRoomName: String) {
        val chatRoom = joinedChatRooms.value?.find { chatRoom -> chatRoom.chatRoomName == chatRoomName }
        Log.d("chatRooms", joinedChatRooms.value.toString())
        Log.d("chatRoomName", chatRoomName)
        _changeChannel.postValue(true)
        currentChatRoom = chatRoom
        Log.d("selectChannel", currentChatRoom.toString())
        chatRoom?.messages?.forEach { msg ->
            if (!msg.read) {
                msg.read = true
            }
        }
    }

    fun getUnreadMessageCount(channel: JoinedChatRoom): Number {
        return channel.messages.count { msg -> !msg.read }
    }

    fun backToChannels() {
        currentChatRoom = null
        this.newMessage.postValue(null)
    }

    private fun addMessageToChannel(msg: ChatRoomMessageData) {
        val chatroom = joinedChatRooms.value?.find{ c -> c.chatRoomName == msg.chatRoomName}
        if (chatroom != null) {
            addMessage(chatroom, msg.data)
        }
    }

    fun addMessage(channel: JoinedChatRoom, msg: ChatMessage) {
        channel.messages.add(MessageInfo(msg, channel == currentChatRoom))
            joinedChatRooms.postValue(joinedChatRooms.value)
            channels.postValue(channels.value)
    }

    fun setUpChannels(channels: JSONObject) {
        val channelsArray = channels.getJSONArray("channels")
        val joinedRoomsArray = channels.getJSONArray("joinedRooms")
        for(i in 0 until channelsArray.length())
        {
            val channel = channelsArray.getString(i)
            this.channels.value?.add(channel)
        }
        for(i in 0 until joinedRoomsArray.length())
        {
            val room = joinedRoomsArray.getJSONObject(i)
            val chatRoomName = room.getString("chatRoomName")
            if (!this.joinedChatRooms.value!!.any{chatRoom -> chatRoom.chatRoomName == chatRoomName}) {
                val messages = room.getJSONArray("messages")
                val chatRoomType: ChatRoomType = when (room.getString("chatRoomType")) {
                    "general" -> ChatRoomType.General
                    "public" -> ChatRoomType.Public
                    "match" -> ChatRoomType.Match
                    else -> throw(Error("invalid constants.ChatRoomType")) // or throw an exception if the type is not valid
                }
                val owner = room.getString("owner")
                val playersJson = room.getJSONArray("players")

                val messageInfos = ArrayList<MessageInfo>()
                for (j in 0 until messages.length()) {
                    val messageInfo = toObject(messages.getJSONObject(j), ChatMessage::class)
                    messageInfos.add(
                        MessageInfo(messageInfo, currentChatRoom?.chatRoomName == chatRoomName)
                    )
                }
                val players = ArrayList<String>()
                for (j in 0 until playersJson.length()){
                    players.add(playersJson.getString(j))
                }
                val joinedChatRoom =
                    JoinedChatRoom(chatRoomName, chatRoomType, owner, messageInfos, players)
                joinedChatRooms.value?.add(joinedChatRoom)
            }
        }
        this.channels.postValue(this.channels.value)
        joinedChatRooms.postValue(joinedChatRooms.value)
    }

    fun removeChannel(channelName: String) {
        joinedChatRooms.value = joinedChatRooms.value?.filter { joinedChatRoom -> joinedChatRoom.chatRoomName != channelName }
            ?.let { ArrayList(it) }
        channels.value = channels.value?.filter { channel -> channel != channelName }
            ?.let { ArrayList(it) }

        SocketService.send(ChatSocketsEmitEvents.LeaveChatRoom, channelName)
        joinedChatRooms.postValue(joinedChatRooms.value)
        channels.postValue(channels.value)
    }

    fun addChannel(channelName: String) {
        channels.value?.add(channelName)
        channels.postValue(channels.value)
    }

    fun joinChannel(chatRoomName: String) {
        SocketService.send(ChatSocketsEmitEvents.JoinChatRoom, chatRoomName)
    }

    fun createChannel(chatRoomInfo: ChatRoomInfo) {
        SocketService.send(ChatSocketsEmitEvents.CreateChatRoom, toJson(chatRoomInfo))
    }

    fun getMessages(): ArrayList<MessageInfo>? {
        return currentChatRoom?.messages
    }

    private fun setUpSocketListeners() {
        SocketService.on<String>(ChatSocketsSubscribeEvents.NewChatRoom) { name ->
            try {
                addChannel(name)
            } catch (error: Exception) {
                Log.e("ChatSocketService0", error.message ?: "Unknown Error")
            }
            Log.d("setUpSocketListeners", "Lambda2")
        }

        SocketService.on<String>(ChatSocketsSubscribeEvents.ChatClosed) { name ->
            removeChannel(name)
            Log.d("setUpSocketListeners", "Lambda3")
        }

        SocketService.on<JSONObject>(ChatSocketsSubscribeEvents.ChatJoined) { msg ->
            try {
                val chatRoomName = msg.getString("chatRoomName")
                if (joinedChatRooms.value!!.any{room -> room.chatRoomName == chatRoomName}) {
                    Log.d("ChatSocketService", "Already has $chatRoomName")
                } else {
                val messages = msg.getJSONArray("messages")
                Log.d("constants.ChatRoomType", msg.getString("chatRoomType"))
                Log.d("msg", msg.toString())
                val chatRoomType: ChatRoomType = when (msg.getString("chatRoomType")) {
                    "general" -> ChatRoomType.General
                    "public" -> ChatRoomType.Public
                    "match" -> ChatRoomType.Match
                    else -> throw (Error("invalid constants.ChatRoomType")) // or throw an exception if the type is not valid
                }
                val owner = msg.getString("owner")
                val playersJson = msg.getJSONArray("players")
                val messageInfos = ArrayList<MessageInfo>()
                for (i in 0 until messages.length()) {
                    val messageInfo = toObject(messages.getJSONObject(i), ChatMessage::class)
                    messageInfos.add(
                        MessageInfo(
                            messageInfo,
                            currentChatRoom?.chatRoomName == chatRoomName
                        )
                    )
                }
                val players = ArrayList<String>()
                for (i in 0 until playersJson.length()) {
                    players.add(playersJson.getString(i))
                }
                val joinedChatRoom =
                    JoinedChatRoom(chatRoomName, chatRoomType, owner, messageInfos, players)
                Log.d("ChatSocketService", "joinedChatRoom is '$joinedChatRoom'")
                joinedChatRooms.value?.add(joinedChatRoom)
                joinedChatRooms.postValue(joinedChatRooms.value)
                Log.d(
                    "ChatSocketService",
                    "joinedChatRooms values are '" + joinedChatRooms.value.toString() + "'"
                )
                }
            } catch (error: Exception) {
                Log.e("ChatSocketService1", error.message ?: "Unknown Error")
            }
        }

        SocketService.on<String?>(ChatSocketsSubscribeEvents.ChatLeft) { chatRoomName ->
            try {
                if (chatRoomName != null) {
                    channels.value?.add(chatRoomName)
                    channels.postValue(channels.value)
                }
            } catch (error: Exception) {
                Log.e("ChatSocketService2", error.message ?: "Unknown Error")
            }
        }

        SocketService.on<JSONObject>(ChatSocketsSubscribeEvents.ChatMessage) { msg ->
            try {
                val chatMessage = toObject(msg, ChatRoomMessageData::class)
                addMessageToChannel(chatMessage)
                hasUnreadMessages =
                    currentChatRoom?.chatRoomName !== chatMessage.chatRoomName || hasUnreadMessages
                Log.d(
                    "ChatSocketService",
                    currentChatRoom?.chatRoomName + " : " + chatMessage.chatRoomName
                )
                _newMessage.postValue(chatMessage)
               } catch (error: Exception) {
                Log.e("ChatSocketService", error.message ?: "Unknown Error")
            }
            Log.d("setUpSocketListeners", "Lambda1")
        }

        SocketService.on<JSONObject>(ChatSocketsSubscribeEvents.SendOldMessages) { msg ->
            try {
                val oldMessages = toObject(msg, OldMessage::class)
                val chatRoom =
                    joinedChatRooms.value?.find { joinedChatRoom -> joinedChatRoom.chatRoomName === oldMessages.chatRoomName }
                chatRoom?.let {
                    for (i in oldMessages.messages.indices.reversed()) {
                        it.messages.add(0, MessageInfo(oldMessages.messages[i], false))
                    }
                }
            } catch (error: Exception) {
                Log.e("ChatSocketService3", error.message ?: "Unknown Error")
            }
        }

        SocketService.on<JSONObject>(ChatSocketsSubscribeEvents.ChatRoomList) { cs ->
            try {
                setUpChannels(cs)
            } catch (error: Exception) {
                Log.e("ChatSocketService4", error.message ?: "Unknown Error")
            }
        }
    }
}
