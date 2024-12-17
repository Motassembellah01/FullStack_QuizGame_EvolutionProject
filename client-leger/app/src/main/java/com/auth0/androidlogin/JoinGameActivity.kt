package com.auth0.androidlogin

import JoinMatchDto
import android.content.Intent
import JoinedChatRoom
import MatchService
import constants.SERVER_URL
import android.app.AlertDialog
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import chat.ChannelsFragment
import classes.Match
import classes.MatchAdapter
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.fragments.QuestionsDialogFragment
import com.auth0.androidlogin.models.IQuestion
import com.auth0.androidlogin.utils.AuthUtils
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.services.AccountService
import com.services.ChatSocketService
import com.services.GameService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class JoinGameActivity : BaseActivity(), AccountService.UsernameUpdateListener {

    lateinit var commonHeader: CommonHeader
    private lateinit var accessCodeEditText: EditText
    private lateinit var joinButton: Button
    private lateinit var homeButton: Button
    lateinit var gameService: GameService
    lateinit var accountService: AccountService
    private val matchSrv: MatchService = MatchService
    private var userId: String? = null
    private var userName: String? = null
    private var avatarUrl: String? = ""
    private var chatService: ChatSocketService = ChatSocketService
    private lateinit var chat: ImageButton
    private lateinit var errorMessageTextView: TextView
    private lateinit var currentMatchesRecyclerView: RecyclerView
    private lateinit var startedGamesRecyclerView: RecyclerView
    private lateinit var refreshButton: ImageButton
    private var match: Match? = null
    private var shouldNotifyOnFirstChange: Boolean = false
    private lateinit var shopActivityLauncher: ActivityResultLauncher<Intent>
    private val SHOP_REQUEST_CODE = 1001
    var money: Int = 0
    var matchPrice: Number? = null
    private lateinit var settingsActivityLauncher: ActivityResultLauncher<Intent>
    private val client = OkHttpClient()
    private var isFeeMatch: Boolean = false
    private var userFriends: List<String> = emptyList()
    private var userBlockingMe: List<String> = emptyList()
    private var userBlocked: List<String> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_join_game)

        // Initialize views
        commonHeader = findViewById(R.id.commonHeader)
        accessCodeEditText = findViewById(R.id.accessCodeEditText)
        joinButton = findViewById(R.id.joinButton)
        homeButton = findViewById(R.id.backToHomeButton)
        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService
        // Initialize services
        errorMessageTextView = findViewById(R.id.errorMessageTextView)
        refreshButton = findViewById(R.id.refreshButton)

        currentMatchesRecyclerView = findViewById(R.id.currentMatchesRecyclerView)
        startedGamesRecyclerView = findViewById(R.id.startedGamesRecyclerView)
        currentMatchesRecyclerView.layoutManager = LinearLayoutManager(this)
        startedGamesRecyclerView.layoutManager = LinearLayoutManager(this)

        gameService = GameService()
        accountService = AccountService(this)
        userId = AuthUtils.getUserId(this)
        userName = AuthUtils.getUserName(this)
        avatarUrl = AuthUtils.getUserProfilePictureUrl(this)


        // Set up CommonHeader
        commonHeader.setListener(this)
        if (!userName.isNullOrEmpty()) {
            commonHeader.setWelcomeText(userName!!)
        }

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
        money = AuthUtils.getCookieBalance(this)
        commonHeader.setMoneyBalance(money)

        joinButton.setOnClickListener {
            val accessCode = accessCodeEditText.text.toString().trim()
            when {
                accessCode.isEmpty() -> {
                    showError(R.string.error_no_code)
                }
                !isValidAccessCode(accessCode) -> {
                    showError(R.string.error_4_digit)
                }

                else -> {
                    // TODO: VERIFY IF NAME IS BANNED BEFORE BEING ABLE TO JOIN
                    // IF BANNED, DISPLAY MESSAGE YOU HAVE BEEN BANNED
                    //joinGame(accessCode)
                    handleJoinViaAccessCode(accessCode)

                }
            }
        }

        homeButton.setOnClickListener {
            navigateToHome()
        }

        chat.setOnClickListener {
            this.chatService.toggleChat()
        }

        chat.setImageResource(R.drawable.chat)
        chatService.isChatOpen.observe(this) { isOpen ->
            onChatToggle(isOpen)  // Call onChatToggle when the state changes
        }

        this.chatService.changeChannel.observe(this) { debug ->
            if (debug) {
                updateChatButtonIcon()
            }
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
                        this@JoinGameActivity.showNotification(
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
                Log.d(
                    "HomeActivity",
                    "Channel: ${chatRoom.chatRoomName}, Unread Count: $unreadMessageCount"
                )
                if (unreadMessageCount > 0) {
                    hasUnreadMessage = true
                    Log.d(
                        "HomeActivity",
                        "Unread messages found in channel: ${chatRoom.chatRoomName}"
                    )
                    break
                }
            }

            this.chatService.hasUnreadMessages = hasUnreadMessage
            updateChatButtonIcon()
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
                commonHeader.setMoneyBalance(money)
            }
        }

        refreshButton.setOnClickListener {
            fetchAndDisplayMatches()
        }

        lifecycleScope.launch {
            userFriends = fetchUserFriends()
        }

        fetchAndDisplayMatches()
        updateChatButtonIcon()
        createNotificationChannel()
    }

    private fun handleJoinViaAccessCode(accessCode: String) {
        lifecycleScope.launch {
            try {
                val accessToken = AuthUtils.getAccessToken(this@JoinGameActivity)

                if (accessToken.isNullOrEmpty()) {
                    return@launch
                }
                val usersBlocked = accountService.getBlockedUsers()
                val blockedUsernames = usersBlocked?.mapNotNull { userId ->
                    accountService.getUsernameByUserId(userId!!)
                }
                val match = gameService.getMatchByAccessCode(accessToken!!, accessCode)
                Log.d("JoinGameActivity", "MATCH PRICE = $matchPrice")
                if (match == null) {
                    showError(R.string.error_no_match_found)
                    return@launch
                }

                // Get the list of users blocking you
                val usersBlockingMe = accountService.getUsersBlockingMe()
                val blockingMeUsernames = usersBlockingMe?.mapNotNull { userId ->
                    try {
                        accountService.getUsernameByUserId(userId!!)
                    } catch (e: Exception) {
                        Log.e("BlockingUsers", "Failed to fetch username for userId: $userId", e)
                        null // Skip if username retrieval fails
                    }
                }

                // Check if any match players are blocking you
                val playersBlockingMe = match.players.filter { player ->
                    blockingMeUsernames?.contains(player.name) == true
                }

                if (playersBlockingMe.isNotEmpty()) {
                    Toast.makeText(
                        this@JoinGameActivity,
                        getString(R.string.error_blocking_players_in_game),
                        Toast.LENGTH_SHORT
                    ).show()
                    return@launch
                }

                val blockedPlayers = match.players.filter { player ->
                    blockedUsernames.orEmpty().contains(player.name)
                }

                if (match.isFriendMatch && !userFriends.contains(match.managerId)) {
                    showError(R.string.error_manager_not_friend)
                    return@launch
                }

                matchPrice = match.priceMatch
                Log.d("JoinGameActivity", "MATCH PRICE = $matchPrice")

                if (!match.isAccessible) {
                    showError(R.string.error_not_accessible)
                    return@launch
                }
                this@JoinGameActivity.match = match
                if (match.isPricedMatch) {
                    showFeeConfirmationDialog(
                        price = matchPrice!!,
                        blockedPlayers = blockedPlayers.isNotEmpty(),
                        onConfirm = {
                            if (money < matchPrice!!.toInt()) {
                                showNotEnoughCookiesDialog()
                                return@showFeeConfirmationDialog
                            }
                            lifecycleScope.launch {
                                val currentMoney = accountService.getAccountMoney()
                                val newMoney = currentMoney?.minus(matchPrice!!.toInt())
                                val deductionSuccess = accountService.updateAccountMoney(newMoney!!)
                                if (deductionSuccess) {
                                    commonHeader.setMoneyBalance(money)
                                    joinGame(accessCode)
                                }
                            }
                        },
                        onCancel = {
                            Log.d("JoinGameActivity", "User canceled joining the match.")
                        }
                    )
                }  else {
                if (blockedPlayers.isNotEmpty()) {
                    // Show block warning dialog
                    showBlockWarningDialog(
                        onConfirm = {
                            joinGame(accessCode)
                        },
                        onCancel = {
                            Toast.makeText(
                                this@JoinGameActivity,
                                R.string.canceled_join_game,
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    )
                } else {
                    joinGame(accessCode)
                }
            }

            } catch (e: Exception) {
                Log.e("JoinGameActivity", "Error attempting to join match: ${e.message}")
                showError(R.string.error_no_match_found)
            }
        }
    }

    private fun showBlockWarningDialog(
        onConfirm: () -> Unit,
        onCancel: () -> Unit
    ) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.custom_dialog_block, null)
        val dialog_message = dialogView.findViewById<TextView>(R.id.dialog_message)
        val confirmButton = dialogView.findViewById<Button>(R.id.dialog_positive_button)
        val cancelButton = dialogView.findViewById<Button>(R.id.dialog_negative_button)

        // Set block message
        dialog_message.text = getString(
            R.string.blocked_users_in_match
        )

        val dialogBuilder = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)

        val alertDialog = dialogBuilder.create()
        alertDialog.show()

        confirmButton.setOnClickListener {
            alertDialog.dismiss()
            onConfirm()
        }

        cancelButton.setOnClickListener {
            alertDialog.dismiss()
            onCancel()
        }
    }


    private fun showFeeConfirmationDialog(
        price: Number,
        blockedPlayers: Boolean,
        onConfirm: () -> Unit,
        onCancel: () -> Unit
    ) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_fee_confirmation, null)
        val confirmButton = dialogView.findViewById<Button>(R.id.confirmButton)
        val cancelButton = dialogView.findViewById<Button>(R.id.cancelButton)
        val feeMessageTextView = dialogView.findViewById<TextView>(R.id.feeMessageTextView)
        val blockMessageTextView = dialogView.findViewById<TextView>(R.id.banMessageTextView)
        val banWarningLayout = dialogView.findViewById<View>(R.id.banWarningLayout)
        feeMessageTextView.text = getString(R.string.fee_dialog, price.toInt())

        if (blockedPlayers) {
            blockMessageTextView.text = getString(R.string.blocked_users_in_match)
            banWarningLayout.visibility = View.VISIBLE
        } else {
            banWarningLayout.visibility = View.GONE
        }
        val dialogBuilder = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)

        val alertDialog = dialogBuilder.create()
        alertDialog.show()

        confirmButton.setOnClickListener {
            alertDialog.dismiss()
            onConfirm()
        }

        cancelButton.setOnClickListener {
            alertDialog.dismiss()
            onCancel()
        }
    }

    fun showNotEnoughCookiesDialog() {
        val inflater = LayoutInflater.from(this)
        val dialogView = inflater.inflate(R.layout.dialog_not_enough_cookies, null)

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        val buttonDismiss = dialogView.findViewById<ImageButton>(R.id.buttonDismiss)

        buttonDismiss.setOnClickListener {
            dialog.dismiss()
        }
        dialog.show()
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

    private fun isValidAccessCode(accessCode: String): Boolean {
        val regex = Regex("^[0-9]{4}$")
        return regex.matches(accessCode)
    }

    private fun fetchAndDisplayMatches() {
        lifecycleScope.launch {
            try {
                val accessToken = AuthUtils.getAccessToken(this@JoinGameActivity)
                if (accessToken.isNullOrEmpty()) {
                    return@launch
                }

                val allMatches = gameService.getAllMatches(accessToken)
                if (allMatches != null) {
                    val currentMatches = allMatches.filter { !it.hasStarted }
                    val startedGames = allMatches.filter { it.hasStarted }

                    val userFriends = fetchUserFriends()

                    // Update RecyclerViews on the Main Thread
                    withContext(Dispatchers.Main) {
                        currentMatchesRecyclerView.adapter = MatchAdapter(this@JoinGameActivity, currentMatches, true) { accessCode, isAccessible ->
                                lifecycleScope.launch {
                                    val match =
                                        gameService.getMatchByAccessCode(accessToken, accessCode)
                                    Log.d("JOINGAMEACTIVITY", "$match")

                                    if (match == null) {
                                        showError(R.string.error_no_match_found)
                                        return@launch
                                    }

                                    if (match.isFriendMatch && !userFriends.contains(match.managerId)) {
                                        showError(R.string.error_manager_not_friend)
                                        return@launch
                                    }
                                    showQuestionsForMatch(accessCode, isAccessible)
                                }
                        }

                        startedGamesRecyclerView.adapter = MatchAdapter(this@JoinGameActivity,startedGames, false, null)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        showError(R.string.error_fetching_matches)

                    }
                }
            } catch (e: Exception) {
                Log.e("JoinGameActivity", "Error fetching matches: ${e.message}")
                withContext(Dispatchers.Main) {
                    showError(R.string.error_fetching_matches)
                }
            }
        }
    }

    private fun showQuestionsForMatch(accessCode: String, isAccessible: Boolean) {
        lifecycleScope.launch {
            try {
                val accessToken = AuthUtils.getAccessToken(this@JoinGameActivity)
                if (accessToken.isNullOrEmpty()) {
                    Snackbar.make(findViewById(R.id.joinGameFrame), R.string.snackbar_access_token_missing, Snackbar.LENGTH_SHORT).show()
                    return@launch
                }

                val match = gameService.getMatchByAccessCode(accessToken, accessCode)
                this@JoinGameActivity.match = match
                if (match != null) {

                    matchPrice = match.priceMatch

                    if (match.game.questions.isNotEmpty()) {
                        showQuestionsDialog(match.game.questions, accessCode, isAccessible, match.isPricedMatch,
                            matchPrice!!
                        )
                    } else {
                        Snackbar.make(findViewById(R.id.joinGameFrame), R.string.snackbar_no_questions_found, Snackbar.LENGTH_SHORT).show()
                    }
                } else {
                    Snackbar.make(findViewById(R.id.joinGameFrame), R.string.snackbar_failed_retrieve_match_details, Snackbar.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Snackbar.make(findViewById(R.id.joinGameFrame), R.string.snackbar_error_fetching_match_details, Snackbar.LENGTH_SHORT).show()
            }
        }
    }

    private fun showQuestionsDialog(questions: List<IQuestion>, accessCode: String, isAccessible: Boolean, isPricedMatch: Boolean, matchPrice: Number) {
        val dialog = QuestionsDialogFragment.newInstance(ArrayList(questions), accessCode, isAccessible, isPricedMatch, matchPrice)
        dialog.show(supportFragmentManager, "QuestionsDialog")
    }

    fun joinGame(matchAccessCode: String) {
        errorMessageTextView.visibility = View.GONE
        Log.d("JoinGameActivity", "match access code $matchAccessCode")
        lifecycleScope.launch {
            try {
                Log.d("JoinGameActivity", "Attempt at join Game with code ${matchAccessCode}.")
                val accessToken = AuthUtils.getAccessToken(this@JoinGameActivity)
                if (accessToken.isNullOrEmpty()) {
                    return@launch
                }

                val match = gameService.getMatchByAccessCode(accessToken, matchAccessCode)
                Log.d("JoinGameActivity", "Fetched match: $match")

                if (match == null) {
                    showError(R.string.error_no_match_found)
                    return@launch
                }

                if (!match.isAccessible) {
                    showError(R.string.error_not_accessible)
                    return@launch
                }

                if (userName != null) {
                    MatchService.connect()
                    MatchService.joinMatchRoom(matchAccessCode, userName!!)
                }
                else {
                    Log.d("WaitingRoomActivity", "Missing Username")
                    return@launch
                }
                this@JoinGameActivity.match = match

                MatchService.match = this@JoinGameActivity.match
                Log.d("JoinGameActivity", "Attempt at join match : $match.")
                navigateToWaitingRoom(matchAccessCode)

            } catch (e: Exception) {
                Log.e("JoinGameActivity", "Error joining game: ${e.message}")
                withContext(Dispatchers.Main) {
                }
            }
        }
    }

    private fun showBlockedUsersDialog(blockedUsers: List<String?>) {
        // Inflate the custom dialog layout
        val dialogView = layoutInflater.inflate(R.layout.custom_dialog_block, null)

        val dialogMessage = dialogView.findViewById<TextView>(R.id.dialog_message)
        val negativeButton = dialogView.findViewById<Button>(R.id.dialog_negative_button)
        val positiveButton = dialogView.findViewById<Button>(R.id.dialog_positive_button)

        val dialog = androidx.appcompat.app.AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()


        lifecycleScope.launch {
            val blockedUsernames = withContext(Dispatchers.IO) {
//                blockedUsers.map { userId -> accountService.getUsernameByUserId(userId) ?: userId }
            }
//            val usernameList = blockedUsernames.joinToString(", ")

            withContext(Dispatchers.Main) {
                try {
                    dialogMessage.text = getString(R.string.blocked_users_in_match)
                } catch (e: Exception) {
                    Log.e("BlockedUsersDialog", "Error formatting string: ${e.message}")
//                    dialogMessage.text = "Blocked users: $usernameList"
                }
            }
        }

        negativeButton.setOnClickListener {
            dialog.dismiss()
            Toast.makeText(this, getString(R.string.canceled_join_game), Toast.LENGTH_SHORT).show()
        }
        positiveButton.setOnClickListener {
//            joinGame()
            dialog.dismiss()
        }

        dialog.show()
    }




    private fun navigateToWaitingRoom(accessCode: String) {
        val intent = Intent(this, WaitingRoomPlayerActivity::class.java).apply {
            putExtra("MATCH_ACCESS_CODE", accessCode)
        }
        startActivity(intent)
        finish()
    }

    private fun showError(messageResId: Int) {
        errorMessageTextView.text = getString(messageResId)
        errorMessageTextView.visibility = View.VISIBLE
    }

    // Implementation of CommonHeaderListener
    override fun onSettingsButtonClick() {
        val intent = Intent(this, SettingsActivity::class.java).apply {
            putExtra("USER_ID", userId)
        }
        settingsActivityLauncher.launch(intent)
    }

    private fun navigateToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        startActivity(intent)
        finish()
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

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == SHOP_REQUEST_CODE && resultCode == RESULT_OK) {
            val updatedCookies = data?.getIntExtra("USER_MONEY_BALANCE", money) ?: money
            money = updatedCookies
            // Update the cookies balance display in HomeActivity's UI
            commonHeader.setMoneyBalance(money) // Ensure CommonHeader has this method
        }
    }

    suspend fun joinWaitingRoom(accessCode: String) {
        val url = "$SERVER_URL/api/matches/join-match"

        val playerName = AuthUtils.getUserName(this)
        val accessToken = AuthUtils.getAccessToken(this)
        val body = Gson().toJson(JoinMatchDto(accessCode, playerName!!)).toRequestBody("application/json; charset=utf-8".toMediaTypeOrNull())
        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        return withContext(Dispatchers.IO) {
            try {
                val response = client.newCall(request).execute()

                if (response.isSuccessful) {
                    val responseBody = response.body?.string()
                    Log.d("WaitingRoom", "Response Body: $responseBody")

                    if (responseBody != null) {
                        try {
                            this@JoinGameActivity.matchSrv.joinMatchRoom(accessCode, playerName)
                            Log.d("WaitingRoom", "Sent JoinMatch")
                        } catch (e: Exception) {
                            Log.e("WaitingRoom", "Failed to send JoinMatch")
                            null
                        }
                    } else {
                        Log.e("WaitingRoom", "Response body is null.")
                        null
                    }
                } else {
                    val errorBody = response.body?.string()
                    Log.e("WaitingRoom", "Error: ${response.code} - ${response.message}")
                    Log.e("WaitingRoom", "Error Body: $errorBody")
                    null
                }

            }
            catch(e: Exception) {
                Log.e("WaitingRoom", "Exception during joinWaitingRoom: ${e.localizedMessage}", e)
            }
        }
    }
    private suspend fun fetchUserFriends(): List<String> {
        val userId = AuthUtils.getUserId(this)
        if (userId.isNullOrEmpty()) {
            Log.e("JoinGameActivity", "Access token is missing.")
            return emptyList()
        }

        return try {
            accountService.getFriends()
        } catch (e: Exception) {
            Log.e("JoinGameActivity", "Error fetching friends: ${e.localizedMessage}")
            emptyList()
        }
    }


}
