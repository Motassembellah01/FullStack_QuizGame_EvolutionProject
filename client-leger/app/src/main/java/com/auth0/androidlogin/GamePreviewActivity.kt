package com.auth0.androidlogin

import com.services.ChatSocketService
import JoinedChatRoom
import MatchService
import android.app.AlertDialog
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
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import chat.ChannelsFragment
import classes.QuestionAdapter
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.databinding.ActivityGamePreviewBinding
import com.auth0.androidlogin.models.IGame
import com.auth0.androidlogin.models.IPlayer
import interfaces.dto.CreateMatchDto
import com.auth0.androidlogin.utils.AuthUtils
import com.services.GameService
import com.google.android.material.snackbar.Snackbar
import com.services.AccountService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

class GamePreviewActivity : BaseActivity(){

    private lateinit var binding: ActivityGamePreviewBinding
    private lateinit var questionAdapter: QuestionAdapter
    private lateinit var gameService: GameService
    private lateinit var accountService: AccountService
    private var chatService: ChatSocketService = ChatSocketService
    private var userName: String? = null
    private var userId: String? = null
    private var avatarUrl: String? = ""
    private var currentGame: IGame? = null
//    private lateinit var commonHeader: CommonHeader  // Reference to CommonHeader
    private lateinit var chat: ImageButton
    private var money: Int = 0
    private var isTeamMatch: Boolean = false
    private var shouldNotifyOnFirstChange: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityGamePreviewBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userName = AuthUtils.getUserName(this)
        userId = AuthUtils.getUserId(this)
        avatarUrl = AuthUtils.getUserProfilePictureUrl(this)
        money = AuthUtils.getCookieBalance(this)

        accountService = AccountService(this)

        gameService = GameService()
        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService

        chat.setOnClickListener {
            this.chatService.toggleChat()
        }

        this.chatService.newMessage.observe(this) {
            updateChatButtonIcon()
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
                        this@GamePreviewActivity.showNotification(
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

        this.chatService.changeChannel.observe(this) { debug ->
            if (debug) {
                updateChatButtonIcon()
            }
        }

        // Retrieve GAME_ID from Intent
        val gameId = intent.getStringExtra("GAME_ID")
        Log.d("GamePreviewActivity", "Received Game ID: $gameId")

        if (gameId.isNullOrEmpty()) {
            showError("Game ID is missing. Cannot display game details.")
            navigateToCreateGame() // Redirect back to CreateGameActivity
            return
        }

        questionAdapter = QuestionAdapter(mutableListOf())

        binding.backButton.setOnClickListener {
            navigateToCreateGame()
        }

        binding.createMatchButton.setOnClickListener {
            showCreateMatchDialog()
        }

        // Setup RecyclerView for Questions
        setupRecyclerView()

        // Fetch and display game details
        fetchGameDetails(gameId)

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
            Log.d("GamePreviewActivity", "Channel: ${chatRoom.chatRoomName}, Unread Count: $unreadMessageCount")
            if (unreadMessageCount > 0) {
                hasUnreadMessages = true
                Log.d("GamePreviewActivity", "Unread messages found in channel: ${chatRoom.chatRoomName}")
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

    private fun setupRecyclerView() {
        binding.questionsList.layoutManager = LinearLayoutManager(this)
        binding.questionsList.adapter = questionAdapter
    }

    private fun fetchGameDetails(gameId: String) {
        lifecycleScope.launch {

            // Retrieve Access Token
            val accessToken = AuthUtils.getAccessToken(this@GamePreviewActivity)
            Log.d("GamePreviewActivity", "Access Token: $accessToken")

            if (accessToken.isNullOrEmpty()) {
                Log.e("GamePreviewActivity", "Access token is missing. Please log in again.")
                showError("Access token is missing. Please log in again.")
                return@launch
            }

            try {
                // Fetch game details using GameService
                val game: IGame? = gameService.getGameById(accessToken, gameId)

                if (game != null) {
                    Log.d("GamePreviewActivity", "Fetched Game: $game")
                    populateGameDetails(game)
                } else {
                    Log.e("GamePreviewActivity", "Failed to fetch game details.")
                    showError("Failed to fetch game details.")
                }

            } catch (e: Exception) {
                e.printStackTrace()
                val errorMsg = e.localizedMessage ?: "An unexpected error occurred."
                showError("Failed to fetch game details: $errorMsg")
                Log.e("GamePreviewActivity", "Exception during fetchGameDetails", e)
            }
        }
    }

    private fun populateGameDetails(game: IGame) {
        currentGame = game
        binding.titleTextView.text = game.title
        binding.descriptionTextView.text = game.description
        binding.durationTextView.text = getString(R.string.duration) + " : ${game.duration} s"
        questionAdapter.addQuestions(game.questions)
    }

    private fun showCreateMatchDialog() {
        // Créer un AlertDialog avec une vue personnalisée
        val dialogView = layoutInflater.inflate(R.layout.dialog_create_match, null)
        val spinnerMatchType = dialogView.findViewById<Spinner>(R.id.spinnerMatchType)
        val spinnerMatchAccessibility = dialogView.findViewById<Spinner>(R.id.spinnerMatchAccessibility)
        val spinnerMatchPaid = dialogView.findViewById<Spinner>(R.id.spinnerMatchPaid)
        val textViewCookies = dialogView.findViewById<TextView>(R.id.textViewCookiesLabel)
        val editTextCookies = dialogView.findViewById<EditText>(R.id.editTextCookies)

        val matchTypes = arrayOf(getString(R.string.solo), getString(R.string.team))
        val Accessibility = arrayOf(getString(R.string.everyone), getString(R.string.friends))
        val matchPaidOptions = arrayOf(getString(R.string.free), getString(R.string.fee))


        val matchTypeAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, matchTypes)
        matchTypeAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerMatchType.adapter = matchTypeAdapter

        val matchAccessibilityAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, Accessibility)
        matchAccessibilityAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerMatchAccessibility.adapter = matchAccessibilityAdapter

        val matchPaidAdapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, matchPaidOptions)
        matchPaidAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerMatchPaid.adapter = matchPaidAdapter

        // Gérer la visibilité de l'EditText des cookies en fonction de la sélection
        spinnerMatchPaid.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onNothingSelected(parent: AdapterView<*>?) {
                // Ne rien faire
            }

            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selectedPaid = parent?.getItemAtPosition(position).toString()
                if (selectedPaid == getString(R.string.fee)) {
                    textViewCookies.visibility = View.VISIBLE
                    editTextCookies.visibility = View.VISIBLE
                } else {
                    textViewCookies.visibility = View.GONE
                    editTextCookies.visibility = View.GONE
                }
            }
        }

        val dialog = AlertDialog.Builder(this)
            .setTitle(getString(R.string.createMatchDialogTitle))
            .setView(dialogView)
            .setPositiveButton(getString(R.string.createMatch), null) // Listener défini plus tard
            .setNegativeButton(getString(R.string.cancel), null)
            .create()

        dialog.setOnShowListener {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            button.setOnClickListener {
                val selectedMatchType = spinnerMatchType.selectedItem.toString()
                val selectedMatchPaid = spinnerMatchPaid.selectedItem.toString()
                val selectedMatchAccessibility = spinnerMatchAccessibility.selectedItem.toString()

                val selectedCookies = if (selectedMatchPaid == getString(R.string.fee)) {
                    val cookiesText = editTextCookies.text.toString()
                    if (cookiesText.isEmpty()) {
                        editTextCookies.error = getString(R.string.enterFee)
                        return@setOnClickListener
                    }
                    try {
                        val cookies = cookiesText.toInt()
                        if (cookies <= 0) {
                            editTextCookies.error = getString(R.string.enterValidFee)
                            return@setOnClickListener
                        }
                        cookies
                    } catch (e: NumberFormatException) {
                        editTextCookies.error = getString(R.string.enterValidFee)
                        return@setOnClickListener
                    }
                } else {
                    0
                }

                // Clear previous errors
                editTextCookies.error = null

                // Appeler la fonction pour créer le match avec les options sélectionnées
                createMatch(selectedMatchType, selectedMatchAccessibility, selectedMatchPaid, selectedCookies)

                // Dismiss the dialog
                dialog.dismiss()
            }
        }

        dialog.show()
    }


    private fun createMatch(matchType: String, matchAccessibility: String, matchPaid: String, cookies: Int) {
        // Implement match creation logic here
        // For now, let's assume you generate a 4-digit code and create a match on the server
        val game = currentGame
        if (game == null) {
            Log.e("GamePreviewActivity", "Game details are not loaded.")
            showError("Game details are not loaded.")
            return
        }

        lifecycleScope.launch {
            val sharedPreferences = getSharedPreferences("auth_prefs", MODE_PRIVATE)
            val accessToken = sharedPreferences.getString("ACCESS_TOKEN", null)
            Log.d("GamePreviewActivity", "Access Token: $accessToken")

            if (accessToken.isNullOrEmpty()) {
                Log.e("GamePreviewActivity", "Access token is missing. Please log in again.")
                showError("Access token is missing. Please log in again.")
                return@launch
            }

            val isTeamMatch = matchType == getString(R.string.team)
            val isPricedMatch = matchPaid == getString(R.string.fee)
            val isFriendMatch = matchAccessibility == getString(R.string.friends)

            try {
                // Create Match object with all required fields
                val createMatchDto = CreateMatchDto(game, userName!!, userId!!, isTeamMatch, isPricedMatch, isFriendMatch, cookies)

                // Send a request to create the match on the server
                val match = gameService.createMatch(accessToken, createMatchDto)

                if (match != null) {
                    Log.d("GamePreviewActivity", "Match created successfully.")
                    Log.d("MatchValue", match.toString())
                    navigateToWaitingRoom(match.accessCode)
                    MatchService.connect()

                    if (userName != null)
                        MatchService.joinMatchRoom(match.accessCode, userName!!)
                    else {
                        Log.d("WaitingRoomActivity", "Missing Username")
                        return@launch
                    }
                    MatchService.match = match
                } else {
                    Log.e("GamePreviewActivity", "Failed to create match.")
                    showError("Failed to create match.")
                }

            } catch (e: Exception) {
                e.printStackTrace()
                val errorMsg = e.localizedMessage ?: "An unexpected error occurred."
                showError("Failed to create match: $errorMsg")
                Log.e("GamePreviewActivity", "Exception during createMatch", e)
            }
        }
    }

    suspend fun getAllMatches() {
        val url = "$SERVER_URL/matches"
        val accessToken = AuthUtils.getAccessToken(this)

        val request = Request.Builder()
            .url(url)
            .get()
            .addHeader("Authorization", "Bearer $accessToken")
            .build()
        return withContext(Dispatchers.IO) {
            try {
                val response = OkHttpClient().newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                }
                else {
                    Log.e("WaitingRoom", "Response body is null.")
                    null
                }
            } catch (e: Exception) {
                Log.e("WaitingRoom", "Exception during getAllMatches: ${e.localizedMessage}", e)
            }
        }
    }

    /*private fun createOrganizerPlayer(): IPlayer {
        // Retrieve organizer's name and other details from user session or profile
        val organizerName = "Organizer" // Implement this method based on your app's logic
        return IPlayer(
            name = organizerName,
            isActive = true,
            score = 0.0,
            nBonusObtained = 0,
            chatBlocked = false
        )
    }*/

    private fun calculateEndTime(startTime: String, durationInSeconds: Int): String {
        val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.getDefault())
        val startDate = formatter.parse(startTime)
        startDate?.let {
            val calendar = Calendar.getInstance()
            calendar.time = it
            calendar.add(Calendar.SECOND, durationInSeconds)
            val endDate = calendar.time
            return formatter.format(endDate)
        }
        return startTime // Fallback
    }

    private fun getCurrentTime(): String {
        val current = Date()
        val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ", Locale.getDefault())
        return formatter.format(current)
    }

    private fun navigateToWaitingRoom(matchAccessCode: String) {
        val intent = Intent(this, WaitingRoomActivity::class.java).apply {
            putExtra("MATCH_ACCESS_CODE", matchAccessCode)
        }
        startActivity(intent)
        finish()
    }

    private fun navigateToCreateGame() {
        val intent = Intent(this, CreateGameActivity::class.java).apply {
            putExtra("USER_MONEY_BALANCE", money)
        }
        startActivity(intent)
        finish()
    }

    private fun showError(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }


//    // Implementation of CommonHeaderListener
//    override fun onSettingsButtonClick() {
//        val intent = Intent(this, SettingsActivity::class.java).apply {
//            putExtra("USER_ID", intent.getStringExtra("USER_ID"))
//        }
//        startActivity(intent)
//    }
//
//    override fun onProfilePictureClick() {
//        navigateToProfileHistory()
//    }
//
//    private fun navigateToProfileHistory() {
//        val intent = Intent(this, ProfileHistoryActivity::class.java).apply {
//            putExtra("USER_ID", intent.getStringExtra("USER_ID"))
//        }
//        startActivity(intent)
//    }

    private suspend fun getUserThemeFromServer(): String {
        val sharedPreferences = getSharedPreferences("auth_prefs", MODE_PRIVATE)
        val accessToken = sharedPreferences.getString("ACCESS_TOKEN", null)
        var theme = "light"

        if (accessToken != null) {
            theme = accountService.getAccountTheme() ?: "light"
        } else {
            Log.e("HomeActivity", "Access token not found")
        }
        return theme
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

//    override fun onEditUsernameClick() {
//        accountService.showEditUsernameDialog(this)
//    }
//
//    override fun onUsernameUpdated(newUsername: String) {
//        commonHeader.setWelcomeText(newUsername)
//        Log.d("HomeActivity", "NEW USER NAME --- $newUsername")
//    }
//
//    override fun onUsernameUpdateFailed(errorMessage: String) {
//        Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
//    }
}
