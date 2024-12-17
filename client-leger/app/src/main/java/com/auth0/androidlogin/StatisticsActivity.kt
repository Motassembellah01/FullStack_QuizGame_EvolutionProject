package com.auth0.androidlogin

import JoinedChatRoom
import android.app.Activity
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
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.lifecycleScope
import chat.ChannelsFragment
import com.auth0.androidlogin.utils.AuthUtils
import com.services.AccountService
import com.services.ChatSocketService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class StatisticsActivity : BaseActivity() {

    private lateinit var accountService: AccountService

    private lateinit var homeButton: Button
    private lateinit var playedGamesValue: TextView
    private lateinit var wonGamesValue: TextView
    private var chatService: ChatSocketService = ChatSocketService
    private lateinit var chat: ImageButton
    private lateinit var averageCorrectAnswersValue: TextView
    private lateinit var averageTimePerGameValue: TextView
    private var userName: String? = null
    private var shouldNotifyOnFirstChange: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_statistics)
        userName = AuthUtils.getUserName(this)

        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService
        accountService = AccountService(this)

        playedGamesValue = findViewById(R.id.playedGamesValue)
        wonGamesValue = findViewById(R.id.wonGamesValue)
        averageCorrectAnswersValue = findViewById(R.id.averageCorrectAnswersValue)
        averageTimePerGameValue = findViewById(R.id.averageTimePerGameValue)
        homeButton = findViewById(R.id.backToHomeButton)

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
                        this@StatisticsActivity.showNotification(
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

        homeButton.setOnClickListener {
            finish()
        }

        loadUserData()
        updateChatButtonIcon()
        createNotificationChannel()

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

    private fun loadUserData() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val account = accountService.getAccount()
                withContext(Dispatchers.Main) {

                    playedGamesValue.text = account?.gamesPlayed.toString()
                    wonGamesValue.text = account?.gamesWon.toString()
                    averageCorrectAnswersValue.text = account?.avgQuestionsCorrect.toString()
                    val minutes = (account?.avgTimePerGame?.toDouble()?.div(60))?.toInt()
                    val seconds = (account?.avgTimePerGame?.toDouble()?.rem(60))?.toInt()
                    averageTimePerGameValue.text = "${minutes}m${seconds}s"
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@StatisticsActivity,
                        R.string.general_error,
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }
}
