package com.auth0.androidlogin

import com.services.ChatSocketService
import SocketService
import JoinedChatRoom
import constants.SERVER_URL
import android.app.AlertDialog
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.content.res.Configuration
import android.os.Bundle
import android.text.InputType
import android.util.Log
import com.auth0.android.Auth0
import com.auth0.android.authentication.AuthenticationException
import com.auth0.android.callback.Callback
import com.auth0.android.provider.WebAuthProvider
import com.google.android.material.snackbar.Snackbar
import android.widget.ImageButton
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.lifecycleScope
import chat.ChannelsFragment
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.utils.AuthUtils
import com.bumptech.glide.Glide
import com.bumptech.glide.request.RequestOptions
import com.google.rpc.context.AttributeContext.Auth
import com.services.AccountService
import com.services.FriendSocketService
import kotlinx.coroutines.CoroutineScope
import okhttp3.OkHttpClient
import okhttp3.Request


class HomeActivity : BaseActivity(), RewardDialogFragment.RewardDialogListener {

    private var userName: String? = null
    private var userId: String? = null
    private var socketService: SocketService = SocketService
    private var chatService: ChatSocketService = ChatSocketService
    private lateinit var accountService: AccountService
    private lateinit var currentTheme: String
    private lateinit var commonHeader: CommonHeader
    private lateinit var chat: ImageButton
    private var shouldNotifyOnFirstChange: Boolean = false
    private var isRecreating = false
    private var passedAvatarUrl: String? = null
    private lateinit var friends: ImageButton
    private lateinit var shopActivityLauncher: ActivityResultLauncher<Intent>
    private var money: Int = 0
    private val PREF_HAS_RECEIVED_REWARD = "has_received_sign_in_reward"
    private lateinit var settingsActivityLauncher: ActivityResultLauncher<Intent>
    private var friendSocketService: FriendSocketService = FriendSocketService

    //TODO: delete these buttons when testing done
//    private lateinit var buttonOpenInMatch: Button
//    private lateinit var buttonOpenInMatchPlayer: Button
//    private lateinit var buttonOpenInMatchTeamResults: Button
//    private lateinit var buttonOpenInMatchSoloResults: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        isRecreating = savedInstanceState != null
        Log.d("HomeActivity", "onCreate: isRecreating = $isRecreating")

        lifecycleScope.launch(Dispatchers.IO) {
            currentTheme = AuthUtils.getTheme(this@HomeActivity).toString()
            Log.d("HomeActivityyy", "This is my current theme = $currentTheme")
            withContext(Dispatchers.Main) {
                applyTheme(currentTheme)
            }
        }

        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)
        accountService = AccountService(this)
        // Initialize Auth0 account details

        // Retrieve userId and other details from SharedPreferences
        userId = AuthUtils.getUserId(this)
        userName = AuthUtils.getUserName(this)


        lifecycleScope.launch(Dispatchers.IO) {
            passedAvatarUrl = accountService.getProfilePicture()
            Log.d("HomeActivity", "Profile Picture URI: $passedAvatarUrl")
            if (!passedAvatarUrl.isNullOrEmpty()) {
                if (passedAvatarUrl!!.startsWith("data:image")) {
                    // Stocker l'avatar en base64
                    AuthUtils.storeUserProfilePicture(this@HomeActivity, passedAvatarUrl!!)
                } else {
                    // Map imageUrl to imageResId
                    val avatarID = accountService.getResourceIdFromImageUrl(passedAvatarUrl!!)
                    Log.d("HomeActivity", "Profile Picture ID: $avatarID")
                    if (avatarID != null && avatarID != 0) {
                        AuthUtils.storeUserProfilePicture(this@HomeActivity, avatarID, passedAvatarUrl!!)
                    }
                }
            }
        }

        Log.d("HomeActivity", "User Name: $userName")
        Log.d("HomeActivity", "User ID: $userId")

        //TODO: delete these buttons when testing done
//        buttonOpenInMatch = findViewById(R.id.match)
//        buttonOpenInMatchPlayer = findViewById(R.id.matchPlayer)
//        buttonOpenInMatchTeamResults = findViewById(R.id.matchTeamResults)
//        buttonOpenInMatchSoloResults= findViewById(R.id.matchSoloResults)

        // Bind the CommonHeader component
        commonHeader = findViewById(R.id.commonHeader)
        commonHeader.setListener(this)
        chat =  findViewById(R.id.chatButton)
        friends = findViewById(R.id.friendsButton)

        this.chatService = ChatSocketService

        chat.setOnClickListener {
            this.chatService.toggleChat()
        }

        chat.setImageResource(R.drawable.chat)
        chatService.isChatOpen.observe(this) { isOpen ->
            onChatToggle(isOpen)  // Call onChatToggle when the state changes
        }

//        buttonOpenInMatch.setOnClickListener {
//            val intent = Intent(this, OrgInMatchActivity::class.java)
//            startActivity(intent)
//        }
//        buttonOpenInMatchPlayer.setOnClickListener {
//            val intent = Intent(this, PlayerInMatchActivity::class.java)
//            startActivity(intent)
//        }
//
//        buttonOpenInMatchTeamResults.setOnClickListener {
//            val intent = Intent(this, ResultsPageTeamActivity::class.java)
//            startActivity(intent)
//        }
//        buttonOpenInMatchSoloResults.setOnClickListener {
//            val intent = Intent(this, ResultsPageSoloActivity::class.java)
//            startActivity(intent)
//        }

        chatService.newMessage.observe(this) { message ->
            if (shouldNotifyOnFirstChange) {
                if (message != null && message.chatRoomName != this.chatService.currentChatRoom?.chatRoomName) {
                    val userId = message.data.userId
                    this.chatService.hasUnreadMessages = true
                    chat.setImageResource(R.drawable.chat)
                    Log.d("New Message", "Yes")
                    lifecycleScope.launch {
                        val pseudonym = accountService.getPseudonymByUserId(userId) ?: "Unknown user"
                        this@HomeActivity.showNotification(
                            "New Message",
                            "$pseudonym has sent a new message in ${message.chatRoomName}"
                        )
                    }
                }
            } else {
                shouldNotifyOnFirstChange = true
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

        this.chatService.newMessage.observe(this) {
            updateChatButtonIcon()
        }

        this.chatService.changeChannel.observe(this) { debug ->
            if (debug) {
                updateChatButtonIcon()
            }
        }

        // Set user information in CommonHeader
        if (!userName.isNullOrEmpty()) {
            commonHeader.setWelcomeText(userName!!)
        }

//        if (!passedAvatarUrl.isNullOrEmpty()) {
//            commonHeader.setUserProfilePicture(passedAvatarUrl)
//        }

        lifecycleScope.launch {
            showRewardDialogIfNeeded()
        }
        Log.d("HomeActivity", "ShowReward")

        lifecycleScope.launch {
            val userLanguage = getUserLanguageFromServer()
            AuthUtils.storeUserLanguage(this@HomeActivity, userLanguage)
            val sharedPreferences = getSharedPreferences("auth_prefs", MODE_PRIVATE)
            val storedLanguage = sharedPreferences.getString("SELECTED_LANGUAGE", "fr") ?: "fr"
            if (userLanguage != storedLanguage) {
                with(sharedPreferences.edit()) {
                    putString("SELECTED_LANGUAGE", userLanguage)
                    apply()
                }
            }
        }
        Log.d("HomeActivity", "Language")

        // Set up the logout button
//        logoutButton.setOnClickListener {
//            logout(userId)  // Pass the userId to the logout function
//            socketService.disconnect()
//        }

        // Initialize the ActivityResultLauncher
        shopActivityLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == RESULT_OK) {
                val updatedCookies = result.data?.getIntExtra("USER_MONEY_BALANCE", money) ?: money
                money = updatedCookies
                commonHeader.setMoneyBalance(money)
            }
        }
        Log.d("HomeActivity", "onCreate: Money")


        // Initialize the ActivityResultLauncher
        settingsActivityLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == RESULT_OK) {
                val data = result.data
                val themeChanged = data?.getBooleanExtra("THEME_CHANGED", false) ?: false
                val langChanged = data?.getBooleanExtra("LANG_CHANGED", false) ?: false
                Log.d("HomeActivity", "Received themeChanged: $themeChanged")  // Added log
                if (themeChanged || langChanged) {
                    Log.d("HomeActivity", "Theme changed, recreating activity.")
                    recreate()
                }
            }
        }



        // Set up the Create Game button
        val createGameButton: Button = findViewById(R.id.createGameButton)
        createGameButton.setOnClickListener {
            navigateToCreateGame()
        }

        val joinGameButton: Button = findViewById(R.id.joinGameButton)
        joinGameButton.setOnClickListener {
            navigateToJoinGame()
        }
        updateChatButtonIcon()
        createNotificationChannel()
        fetchAndDisplayMoneyBalance()
        fetchAndDisplayFriendRequestCount()
        Log.d("HomeActivity", "onCreate: isRecreating = $isRecreating")
    }


    private fun fetchAndDisplayMoneyBalance() {
        lifecycleScope.launch {
            try {
                val fetchedMoney = withContext(Dispatchers.IO) {
                    accountService.getAccountMoney()
                }
                fetchedMoney?.let {
                    money = it
                    commonHeader.setMoneyBalance(it)
                    Log.d("HomeActivity", "Money balance fetched: $it")
                } ?: run {
                    Log.e("HomeActivity", "Failed to fetch money balance.")
                    commonHeader.setMoneyBalance(0)
                }
            } catch (e: Exception) {
                Log.e("HomeActivity", "Error fetching money balance: ${e.message}")
                commonHeader.setMoneyBalance(0)
            }
        }
    }

    private fun fetchAndDisplayFriendRequestCount() {
        lifecycleScope.launch {
            try {
                val requestCount = withContext(Dispatchers.IO) {
                    accountService.getFriendRequests().count() // Ensure `accountService` has this method
                }
                requestCount?.let {
                    commonHeader.setRequestCount(it)
                    Log.d("HomeActivity", "Friend request count fetched: $it")
                }
            } catch (e: Exception) {
                Log.e("HomeActivity", "Error fetching friend request count: ${e.message}")
                commonHeader.setRequestCount(0)
            }
        }
    }


    private fun showRewardDialogIfNeeded() {
        val sharedPreferences = getSharedPreferences("shop_prefs", Context.MODE_PRIVATE)
        val hasReceivedReward = sharedPreferences.getBoolean(PREF_HAS_RECEIVED_REWARD, false)
        Log.d("HomeActivity", "HAS RECIEVED REWARD BOOL: $hasReceivedReward")

        if (!hasReceivedReward) {
            showRewardDialog()
            Log.d("HomeActivity", "showRewardNeeded")
            // Mark that the reward has been shown
            sharedPreferences.edit().putBoolean(PREF_HAS_RECEIVED_REWARD, true).apply()
        }
        Log.d("HomeActivity", "showRewardIfNeeded")
    }

    private fun saveCookies(cookies: Int) {
        val sharedPreferences = getSharedPreferences("shop_prefs", Context.MODE_PRIVATE)
        sharedPreferences.edit().putInt("cookies", cookies).apply()
        Log.d("HomeActivity", "Cookies balance saved: $cookies")
    }

    private fun showRewardDialog() {
        Log.d("HomeActivity", "SHOWING REWARD DIALOG1")
        val rewardDialog = RewardDialogFragment()
        rewardDialog.isCancelable = false
        rewardDialog.show(supportFragmentManager, "RewardDialog")
        Log.d("HomeActivity", "SHOWING REWARD DIALOG2")
    }

    override fun onRewardSelected(rewardAmount: Int) {
        money += rewardAmount
        commonHeader.setMoneyBalance(money)
        saveCookies(money)
        lifecycleScope.launch {
            try {
                val success = accountService.updateAccountMoney(money)
                if (success) {
                    Log.d("HomeActivity", "Money balance updated on server successfully.")
                    Toast.makeText(this@HomeActivity, getString(R.string.receivedReward, rewardAmount), Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Log.e("HomeActivity", "Exception while updating money balance: ${e.message}")
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

    override fun onDestroy() {
        Log.d("HomeActivity", "onDestroy: isRecreating = $isRecreating")
        if (!this.isRecreating)
        {
            // socketService.disconnect()
            Log.d("HomeActivity", "Not Recreating")
        }
        super.onDestroy()
    }


    fun updateChatButtonIcon() {
        var hasUnreadMessages = false
        for (chatRoom in chatService.joinedChatRooms.value!!) {
            val unreadMessageCount = this.getUnreadMessageCount(chatRoom).toInt()
            Log.d("HomeActivity", "Channel: ${chatRoom.chatRoomName}, Unread Count: $unreadMessageCount")
            if (unreadMessageCount > 0) {
                hasUnreadMessages = true
                Log.d("HomeActivity", "Unread messages found in channel: ${chatRoom.chatRoomName}")
                break
            }
        }
        Log.d("HomeActivity", "True or False :$hasUnreadMessages")
        if (hasUnreadMessages) {
            chat.setImageResource(R.drawable.unread_chat)
            Log.d("HomeActivity", "True BS")
        } else {
            chat.setImageResource(R.drawable.chat)
            Log.d("HomeActivity", "False BS")
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

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        //setBackground(newConfig.orientation)
    }

    fun hideChannelsContainer() {
        val channelsContainer = findViewById<FrameLayout>(R.id.channelsContainer)
        channelsContainer.visibility = View.GONE
    }

    fun hideChatContainer() {
        val channelsContainer = findViewById<FrameLayout>(R.id.channelsContainer)
        channelsContainer.visibility = View.GONE
    }

    private suspend fun getUserLanguageFromServer(): String {
        val sharedPreferences = getSharedPreferences("auth_prefs", MODE_PRIVATE)
        val accessToken = sharedPreferences.getString("ACCESS_TOKEN", null)
        var language = "fr"

        if (accessToken != null) {
            language = accountService.getAccountLanguage() ?: "fr"
        } else {
            Log.e("HomeActivity", "Access token not found")
        }
        return language
    }

    private fun navigateToCreateGame() {
        val intent = Intent(this, CreateGameActivity::class.java).apply {
            putExtra("USER_ID", userId)
            putExtra("USER_MONEY_BALANCE", money)
        }
        startActivity(intent)
        //finish()
    }

    private fun navigateToJoinGame() {
        val intent = Intent(this, JoinGameActivity::class.java).apply {
            putExtra("USER_MONEY_BALANCE", money)
        }
        startActivity(intent)
        //finish()
    }


}
