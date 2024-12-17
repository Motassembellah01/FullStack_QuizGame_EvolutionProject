package com.auth0.androidlogin

import JoinedChatRoom
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import chat.ChannelsFragment
import classes.ConnectionHistoryAdapter
import classes.MatchHistoryAdapter
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.models.MatchHistory
import interfaces.MatchHistoryEvent
import com.auth0.androidlogin.models.Session
import com.auth0.androidlogin.services.SessionService
import com.auth0.androidlogin.utils.AuthUtils
import com.services.AccountService
import com.services.ChatSocketService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ProfileHistoryActivity : BaseActivity() {

//    private lateinit var commonHeader: CommonHeader
    private lateinit var homeButton: Button
    private lateinit var connectionHistoryRecyclerView: RecyclerView
    private lateinit var connectionHistoryAdapter: ConnectionHistoryAdapter
    private lateinit var matchHistoryRecyclerView: RecyclerView
    private lateinit var matchHistoryAdapter: MatchHistoryAdapter
    private lateinit var sessionService: SessionService
    private lateinit var accountService: AccountService
    private var userId: String? = null
    private var userName: String? = null
    private var chatService: ChatSocketService = ChatSocketService
    private lateinit var chat: ImageButton
    private var shouldNotifyOnFirstChange: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile_history)

//        commonHeader = findViewById(R.id.commonHeader)
        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService
        userId = AuthUtils.getUserId(this)
        userName = AuthUtils.getUserName(this)
        accountService = AccountService(this)

        // Initialize views
        homeButton = findViewById(R.id.backToHomeButton)
        connectionHistoryRecyclerView = findViewById(R.id.connectionHistoryRecyclerView)
        matchHistoryRecyclerView = findViewById(R.id.playedGamesHistoryRecyclerView)

        // Initialize service
        sessionService = SessionService(this)

        // Set up Home Button
        homeButton.setOnClickListener {
            finish() // Close current activity and return to the previous one
        }

        // Set up RecyclerView
        connectionHistoryAdapter = ConnectionHistoryAdapter()
        connectionHistoryRecyclerView.layoutManager = LinearLayoutManager(this)
        connectionHistoryRecyclerView.adapter = connectionHistoryAdapter

        // Set up Played Games History RecyclerView
        matchHistoryAdapter = MatchHistoryAdapter()
        matchHistoryRecyclerView.layoutManager = LinearLayoutManager(this)
        matchHistoryRecyclerView.adapter = matchHistoryAdapter

        chat.setOnClickListener {
            this.chatService.toggleChat()
        }

        chat.setImageResource(R.drawable.chat)
        chatService.isChatOpen.observe(this) { isOpen ->
            onChatToggle(isOpen)  // Call onChatToggle when the state changes
        }

        chatService.newMessage.observe(this) { message ->
            if (shouldNotifyOnFirstChange) {
                if (message != null && message.chatRoomName != this.chatService.currentChatRoom?.chatRoomName) {
                    val userId = message.data.userId
                    this.chatService.hasUnreadMessages = true
                    chat.setImageResource(R.drawable.chat)
                    Log.d("New Message", "Yes")
                    lifecycleScope.launch {
                        val pseudonym = accountService.getPseudonymByUserId(userId) ?: "Unknown user"
                        this@ProfileHistoryActivity.showNotification(
                            "New Message",
                            "$pseudonym has sent a new message in ${message.chatRoomName}"
                        )
                    }
                }
            } else {
                shouldNotifyOnFirstChange = true
            }
        }
        this.chatService.changeChannel.observe(this) { debug ->
            if (debug) {
                updateChatButtonIcon()
            }
        }

        this.chatService.joinedChatRoomsSubject.observe(this) { joinedChatRooms ->
            var hasUnreadMessage = false
            for (chatRoom in joinedChatRooms) {
                val unreadMessageCount = chatRoom.messages.count { msg -> !msg.read }
                if (unreadMessageCount > 0) {
                    hasUnreadMessage = true
                    break
                }
            }

            this.chatService.hasUnreadMessages = hasUnreadMessage
            updateChatButtonIcon()
        }

        // Load Session History
        loadSessionHistory()
        loadPlayedGamesHistory()
        updateChatButtonIcon()
        createNotificationChannel()
    }

    private fun loadSessionHistory() {
        lifecycleScope.launch(Dispatchers.IO) {
            val sessions: List<Session>? = sessionService.getSessionHistory()
            withContext(Dispatchers.Main) {
                if (sessions != null && sessions.isNotEmpty()) {
                    connectionHistoryAdapter.setData(sessions)
                } else if (sessions != null && sessions.isEmpty()) {
                    // Show "No history available" message
                    Toast.makeText(this@ProfileHistoryActivity, getString(R.string.no_history_available), Toast.LENGTH_SHORT).show()
                } else {
                    Log.e("ProfileHistoryActivity", "Failed to load session history.")
                    Toast.makeText(this@ProfileHistoryActivity, getString(R.string.error_loading_history), Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "My Notification Channel"
            val descriptionText = "Channel description"
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel("MY_CHANNEL_ID", name, importance).apply {
                description = descriptionText
            }
            val notificationManager: NotificationManager =
                this.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager // Use 'this' to refer to the Service instance
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun showNotification(title: String, message: String) {
        val notificationBuilder = NotificationCompat.Builder(this, "MY_CHANNEL_ID")
            .setSmallIcon(R.drawable.logo)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)

        val notificationManager = NotificationManagerCompat.from(this)
        notificationManager.notify(1, notificationBuilder.build())
    }
    private fun loadPlayedGamesHistory() {
        lifecycleScope.launch(Dispatchers.IO) {
            val matches: List<MatchHistory>? = sessionService.getPlayedGamesHistory()
            withContext(Dispatchers.Main) {
                if (matches != null && matches.isNotEmpty()) {
                    matchHistoryAdapter.setData(matches)
                } else if (matches != null && matches.isEmpty()) {
                    // Show "No history available" message
                    Toast.makeText(this@ProfileHistoryActivity, getString(R.string.no_history_available), Toast.LENGTH_SHORT).show()
                } else {
                    Log.e("ProfileHistoryActivity", "Failed to load session history.")
                    Toast.makeText(this@ProfileHistoryActivity, getString(R.string.error_loading_history), Toast.LENGTH_SHORT).show()
                }
            }
        }
    }


    fun updateChatButtonIcon() {
        var hasUnreadMessages = this.chatService.hasUnreadMessages
        for (chatRoom in chatService.joinedChatRooms.value!!) {
            val unreadMessageCount = this.getUnreadMessageCount(chatRoom).toInt()
            Log.d("HomeActivity", "Channel: ${chatRoom.chatRoomName}, Unread Count: $unreadMessageCount")
            if (unreadMessageCount > 0) {
                hasUnreadMessages = true
                Log.d("HomeActivity", "Unread messages found in channel: ${chatRoom.chatRoomName}")
                break
            }
        }
        if (hasUnreadMessages) {
            chat.setImageResource(R.drawable.unread_chat)
        } else {
            chat.setImageResource(R.drawable.chat)
        }
    }

    fun getUnreadMessageCount(channel: JoinedChatRoom): Number {
        return this.chatService.getUnreadMessageCount(channel)
    }

    fun onChatToggle(isOpen: Boolean) {
        val channelsContainer = findViewById<FrameLayout>(R.id.channelsContainer)

        val animation = if (isOpen) {
            AnimationUtils.loadAnimation(this, R.anim.open_chat)
        } else {
            // Load slide-out animation
            AnimationUtils.loadAnimation(this, R.anim.close_chat)
        }

        updateChatButtonIcon()

        channelsContainer.startAnimation(animation)
        channelsContainer.visibility = if (isOpen) View.VISIBLE else View.GONE

        var channelFragment = ChannelsFragment()
        val bundle = Bundle()
        bundle.putString("USER_NAME", this.userName)
        channelFragment.arguments = bundle


        if (isOpen) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.channelsContainer, channelFragment)
                .commit()
        }
    }
}
