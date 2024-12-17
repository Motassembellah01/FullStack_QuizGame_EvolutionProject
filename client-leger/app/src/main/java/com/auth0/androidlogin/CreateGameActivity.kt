package com.auth0.androidlogin

import com.services.ChatSocketService
import JoinedChatRoom
import constants.SERVER_URL
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import chat.ChannelsFragment
import classes.GameAdapter
import com.auth0.android.Auth0
import com.auth0.android.authentication.AuthenticationException
import com.auth0.android.provider.WebAuthProvider
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.databinding.ActivityCreateGameBinding
import com.auth0.androidlogin.models.IGame
import com.auth0.androidlogin.utils.AuthUtils
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.services.AccountService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.*

class CreateGameActivity : BaseActivity(), AccountService.UsernameUpdateListener {

    private lateinit var binding: ActivityCreateGameBinding
    private lateinit var gameAdapter: GameAdapter
    private val client = OkHttpClient()
    private val serverUrlRoot = "$SERVER_URL/api"
    private var userId: String? = null
    private var accessToken: String? = null
    private lateinit var accountService: AccountService
    private var chatService: ChatSocketService = ChatSocketService
    private var userName: String? = null
    private lateinit var commonHeader: CommonHeader  // Reference to CommonHeader
    private lateinit var chat: ImageButton
    private var shouldNotifyOnFirstChange: Boolean = false
    private lateinit var shopActivityLauncher: ActivityResultLauncher<Intent>
    private val SHOP_REQUEST_CODE = 1001
    private var money: Int = 0
    private lateinit var settingsActivityLauncher: ActivityResultLauncher<Intent>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Inflate the layout using View Binding
        binding = ActivityCreateGameBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userName = AuthUtils.getUserName(this)
        // Bind the CommonHeader component
        commonHeader = findViewById(R.id.commonHeader)
        commonHeader.setListener(this)  // Set HomeActivity as the listener

        accountService = AccountService(this)
        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService

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
                        this@CreateGameActivity.showNotification(
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

        userId = AuthUtils.getUserId(this)
        accessToken = AuthUtils.getAccessToken(this)
        Log.d("CreateGameActivity", "Retrieved User ID: $userId, Access Token: $accessToken")

        if (userId.isNullOrEmpty() || accessToken.isNullOrEmpty()) {
            showError("User ID or Access Token is missing. Please log in again.")
            navigateToHome() // Redirect to HomeActivity
            return
        }

        // Set user information in CommonHeader
        if (!userName.isNullOrEmpty()) {
            commonHeader.setWelcomeText(userName!!)
        }

        money = AuthUtils.getCookieBalance(this)
        commonHeader.setMoneyBalance(money)

//        lifecycleScope.launch {
//            withContext(Dispatchers.Main) {
//                commonHeader.updateProfilePicture()
//            }
//        }

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
        money = intent.getIntExtra("USER_MONEY_BALANCE", 0)
        commonHeader.setMoneyBalance(money)

        lifecycleScope.launch {
            val userTheme = AuthUtils.getTheme(this@CreateGameActivity)
            withContext(Dispatchers.Main) {
                updateTheme(userTheme!!)
            }
        }

        lifecycleScope.launch {
            val userLanguage = getUserLanguageFromServer()
            val sharedPreferences = getSharedPreferences("auth_prefs", MODE_PRIVATE)
            val storedLanguage = sharedPreferences.getString("SELECTED_LANGUAGE", "fr") ?: "fr"
            if (userLanguage != storedLanguage) {
                with(sharedPreferences.edit()) {
                    putString("SELECTED_LANGUAGE", userLanguage)
                    apply()
                }
                // The onResume in BaseActivity will handle the recreation
            }
        }
        val shopPrefs = getSharedPreferences("shop_prefs", Context.MODE_PRIVATE)
        money = shopPrefs.getInt("cookies", 200) // Default to 200 if not set
        // Initialize the ActivityResultLauncher
        shopActivityLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) { result ->
            if (result.resultCode == RESULT_OK) {
                val updatedCookies = result.data?.getIntExtra("USER_MONEY_BALANCE", money) ?: money
                money = updatedCookies
                // Update the cookies balance display in HomeActivity's UI
                commonHeader.setMoneyBalance(money) // Ensure CommonHeader has this method
            }
        }
        // Initialize the GameAdapter
        gameAdapter = GameAdapter(mutableListOf()) { selectedGame ->
            onGameClicked(selectedGame)}

        // Setup CommonHeader Click Listeners
        setupCommonHeader()

        // Setup Home Button Click Listener
        binding.homeButton.setOnClickListener {
            navigateToHome()
        }

        // Setup RecyclerView
        setupRecyclerView()

        // Fetch initial games
        fetchGames()

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

    private fun setupCommonHeader() {
        binding.commonHeader.setListener(this)
    }

    private fun setupRecyclerView() {

        val layoutManager = LinearLayoutManager(this)
        binding.gamesList.layoutManager = layoutManager
        binding.gamesList.adapter = gameAdapter
    }


    private fun fetchGames() {
        lifecycleScope.launch {
            val url = "$serverUrlRoot/games"
            Log.d("CreateGameActivity", "Fetching games from URL: $url")

            try {
                val games: List<IGame>? = withContext(Dispatchers.IO) {
                    val request = Request.Builder()
                        .url(url)
                        .get()
                        .addHeader("Authorization", "Bearer $accessToken")
                        .build()

                    val response = client.newCall(request).execute()

                    if (response.isSuccessful) {
                        val responseBody = response.body?.string()
                        Log.d("CreateGameActivity", "Raw Response Body: $responseBody")

                        if (responseBody != null) {
                            try {
                                // Parse JSON array into List<Game>
                                Gson().fromJson(responseBody, Array<IGame>::class.java).toList()
                            } catch (e: Exception) {
                                Log.e("CreateGameActivity", "Exception during parsing", e)
                                null
                            }
                        } else {
                            Log.e("CreateGameActivity", "Response body is null.")
                            null
                        }
                    } else {
                        val errorBody = response.body?.string()
                        Log.e("CreateGameActivity", "Error: ${response.code}")
                        Log.e("CreateGameActivity", "Error Body: $errorBody")
                        if (response.code == 401) {
                            // Unauthorized access
                            withContext(Dispatchers.Main) {
                                showError("Unauthorized access. Please log in again.")
                            }
                        } else {
                            withContext(Dispatchers.Main) {
                                showError("Error fetching games: ${response.code}")
                            }
                        }
                        null
                    }
                }

                val visibleGames = games?.filter { it.isVisible }
                Log.d("CreateGameActivity", "Visible Games: $visibleGames")
                if (visibleGames != null) {
                    Log.d("CreateGameActivity", "Parsed Games: $visibleGames")
                    gameAdapter.addGames(visibleGames)

                } else {
                    Log.e("CreateGameActivity", "Failed to fetch games from server.")
                    showError("Failed to fetch games.")
                }

            } catch (e: Exception) {
                e.printStackTrace()
                val errorMsg = e.localizedMessage ?: "An unexpected error occurred."
                showError("Failed to fetch games: $errorMsg")
                Log.e("CreateGameActivity", "Exception during fetchGames", e)
            }
        }
    }



    private fun showError(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        startActivity(intent)
        finish()
    }

    override fun onSettingsButtonClick() {
        val intent = Intent(this, SettingsActivity::class.java).apply {
            putExtra("USER_ID", userId)
        }
        settingsActivityLauncher.launch(intent)
    }

    private fun onGameClicked(game: IGame) {
        Log.d("CreateGameActivity", "Game clicked: ${game.title}")
        val intent = Intent(this, GamePreviewActivity::class.java).apply {
            putExtra("GAME_ID", game.id)
            putExtra("USER_MONEY_BALANCE", money)
        }
        startActivity(intent)
    }


    private suspend fun getUserLanguageFromServer(): String {
        val sharedPreferences = getSharedPreferences("auth_prefs", MODE_PRIVATE)
        val accessToken = sharedPreferences.getString("ACCESS_TOKEN", null)
        var language = "fr"  // Default to French

        if (accessToken != null) {
            language = accountService.getAccountLanguage() ?: "fr"
        } else {
            Log.e("HomeActivity", "Access token not found")
        }
        return language
    }

    fun onEditUsernameClick() {
        accountService.showEditUsernameDialog(this)
    }

    override fun onUsernameUpdated(newUsername: String) {
        commonHeader.setWelcomeText(newUsername)
        Log.d("HomeActivity", "NEW USER NAME --- $newUsername")
    }

    override fun onUsernameUpdateFailed(errorMessage: String) {
        Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
    }

    override fun onMoneyButtonClick() {
        val intent = Intent(this, ShopActivity::class.java)
        intent.putExtra("USER_MONEY_BALANCE", money)
        shopActivityLauncher.launch(intent)
    }


}
