package com.auth0.androidlogin

import JoinMatchDto
import com.services.ChatSocketService
import JoinedChatRoom
import MatchService
import SocketService
import android.app.AlertDialog
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.EditText
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import chat.ChannelsFragment
import classes.Team
import com.auth0.androidlogin.adapters.PlayersAdapter
import com.auth0.androidlogin.adapters.TeamsAdapter
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.databinding.ActivityWaitingRoomBinding
import com.auth0.androidlogin.models.IMatch
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.models.ITeam
import com.auth0.androidlogin.utils.AuthUtils
import com.services.GameService
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.services.AccountService
import com.services.TimeService
import constants.QUESTION_TYPE
import constants.SERVER_URL
import kotlinx.coroutines.CoroutineScope
import constants.TRANSITIONS_DURATIONS
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient

class WaitingRoomActivity : BaseActivity() {

    private lateinit var binding: ActivityWaitingRoomBinding
    private lateinit var playersAdapter: PlayersAdapter
    private lateinit var teamsAdapter: TeamsAdapter
    private lateinit var gameService: GameService
    private lateinit var timeService: TimeService
    private val socketService: SocketService = SocketService
    private val matchSrv: MatchService = MatchService
    private var matchAccessCode: String? = null
    private var IMatchDetails: IMatch? = null
    private var userName: String? = null
    private lateinit var accountService: AccountService
    //    private lateinit var commonHeader: CommonHeader
    private var chatService: ChatSocketService = ChatSocketService
    private lateinit var chat: ImageButton
    private var avatarUrl: String? = ""
    private val client = OkHttpClient()
    private var shouldNotifyOnFirstChange: Boolean = false
    private lateinit var startMatchButton: Button


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        this.matchAccessCode = intent.getStringExtra("MATCH_ACCESS_CODE")
        // Inflate the layout using View Binding
        binding = ActivityWaitingRoomBinding.inflate(layoutInflater)
        setContentView(binding.root)
        startMatchButton = findViewById(R.id.startMatchButton)
        startMatchButton.isEnabled = false
        startMatchButton.alpha = 0.5f
        userName = AuthUtils.getUserName(this)

//        commonHeader = findViewById(R.id.commonHeader)
        // commonHeader.setListener(this)

        accountService = AccountService(this)
        gameService = GameService()
        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService
        this.timeService = TimeService

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
                        this@WaitingRoomActivity.showNotification(
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

        this.matchSrv.newPlayer.observe(this) { newPlayer ->
            if (newPlayer != null) {
                Log.d("WaitingRoomActivity", "$newPlayer")
                if (this.matchSrv.match!!.isTeamMatch && this.matchSrv.changeTeam.value != null) {
                    val newPlayersAlone = getPlayersNotInTeams(newPlayer, this.matchSrv.changeTeam.value!!)
                    populateMatchDetails(newPlayersAlone)
                }
                else
                    populateMatchDetails(newPlayer)
            } else {
                Log.e("WaitingRoomActivity", "Received null newPlayer")
                // showError("Failed to retrieve player data.")
            }
        }

        this.matchSrv.changeTeam.observe(this) { teams ->
            if (teams != null) {
                updateUI()
            }
            else {
                Log.d("WaitingRoomActivity", "Received null teams")
            }
        }

        matchAccessCode = intent.getStringExtra("MATCH_ACCESS_CODE")
        Log.d("WaitingRoomActivity", "Received Match Access Code: $matchAccessCode")

        this.matchSrv.changeRoom.observe(this) {
                roomChange ->
            run { if (roomChange == "MainActivity") navigateToMatchPreview()
                if (roomChange == "GameActivity") startGame()
            }
        }

        if (matchAccessCode.isNullOrEmpty()) {
            showError("Match Access Code is missing.")
            // navigateToHome()
            return
        }

        startMatchButton.setOnClickListener {
            onBeginMatch()
        }

        // Display the Access Code
        binding.accessCodeTextView.text = getString(R.string.accessCode) + " $matchAccessCode"

        // Initialize PlayersAdapter
        playersAdapter = PlayersAdapter(mutableListOf(), isOrganizer = true, accountService) { player ->
            // TODO: Handle ban
            matchSrv.banPlayer(player.name)
        }
//        teamsAdapter = TeamsAdapter(mutableListOf()) { team -> }
        teamsAdapter = TeamsAdapter(
            teams = mutableListOf(),
            onQuitTeamClick = { team ->
                // Handle quitting the team
                // matchSrv.quitTeam(team)
            },
            accountService = accountService // Pass the AccountService instance
        )

        // Setup RecyclerViews
        binding.soloPlayersRecyclerView?.layoutManager = LinearLayoutManager(this)
        binding.soloPlayersRecyclerView?.adapter = playersAdapter

        binding.teamsRecyclerView?.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        binding.teamsRecyclerView?.adapter = teamsAdapter

        setupButtons()

        lifecycleScope.launch {
            val userTheme = getUserThemeFromServer()
            withContext(Dispatchers.Main) {
                updateTheme(userTheme)
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
        // Join Match
        val playerName = AuthUtils.getUserName(this)
        avatarUrl = AuthUtils.getUserProfilePictureUrl(this)

        this.matchSrv.joinMatchRoom(matchAccessCode!!, playerName!!)

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

    private fun showTimerDialog() {
        // Inflate the custom layout for the dialog
        val dialogView = LayoutInflater.from(this).inflate(R.layout.transition_to_match, null)

        // Find the TextView and ProgressBar in the custom layout
        val timerText = dialogView.findViewById<TextView>(R.id.timerText)
        val timerProgressBar = dialogView.findViewById<ProgressBar>(R.id.timerProgressBar)

        // Create the AlertDialog
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        // Show the dialog
        dialog.show()

        timerText.text = "5"
        timerProgressBar.progress = 100

        // Simulate a countdown timer for the dialog
        val handler = Handler(Looper.getMainLooper())
        var counter = 5
        val countdownRunnable = object : Runnable {
            override fun run() {
                if (counter > 0) {
                    timerText.text = counter.toString()
                    timerProgressBar.progress = (counter * 20)
                    counter--
                    handler.postDelayed(this, 1000) // Update every second
                } else {
                    dialog.dismiss() // Close dialog when countdown reaches zero
                    // TODO : passe a la page de jeu
                }
            }
        }
        handler.post(countdownRunnable)
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
    private fun setupButtons() {
        // Back Button: Deletes the match and redirects to Match Preview
        binding.backButton.setOnClickListener {
            showCancelConfirmationDialog()
        }

        // Lock Button: Locks the waiting room
        binding.lockButton.setOnClickListener {
            toggleLockRoom()
        }

        // Start Match Button: Currently does nothing
        binding.startMatchButton.setOnClickListener {
            // Future implementation
            onBeginMatch()
        }
    }

    private fun showCancelConfirmationDialog() {
        val builder = AlertDialog.Builder(this)
            .setTitle("Confirmation")
            .setMessage(R.string.quitMatch)
            .setCancelable(false)
        builder.setNegativeButton(R.string.no) { dialog, _ ->
            dialog.dismiss()
        }

        builder.setPositiveButton(R.string.yes) { dialog, _ ->
            dialog.dismiss()
            deleteMatch()
        }

        val alertDialog = builder.create()
        alertDialog.show()

        alertDialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(resources.getColor(R.color.red))
        alertDialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(resources.getColor(R.color.green))
    }


    private fun deleteMatch() {
        lifecycleScope.launch {
            try {
                val accessToken = AuthUtils.getAccessToken(this@WaitingRoomActivity)
                if (accessToken.isNullOrEmpty()) {
                    showError("Access token is missing.")
                    // navigateToHome()
                    return@launch
                }

                // Call the deleteMatch API
                val success = gameService.deleteMatch(accessToken, matchAccessCode!!)

                if (success) {
                    Log.d("WaitingRoomActivity", "Match deleted successfully.")
                    navigateToMatchPreview()
                } else {
                    Log.e("WaitingRoomActivity", "Failed to delete match.")
                    showError("Failed to delete match.")
                }

            } catch (e: Exception) {
                e.printStackTrace()
                val errorMsg = e.localizedMessage ?: "An unexpected error occurred."
                showError("Failed to delete match: $errorMsg")
                Log.e("WaitingRoomActivity", "Exception during deleteMatch", e)
            }
        }
    }

    private fun toggleLockRoom() {
        val currentMatch = this.matchSrv.match
        if (currentMatch == null) {
            showError("Match details are not available.")
            return
        }

        val desiredAccessibility = !currentMatch.isAccessible

        lifecycleScope.launch {
            val accessToken = AuthUtils.getAccessToken(this@WaitingRoomActivity)
            if (accessToken.isNullOrEmpty()) {
                showError("Access token is missing.")
                return@launch
            }

            val success = gameService.setMatchAccessibility(accessToken, matchAccessCode!!, desiredAccessibility)
            if (success) {
                // Update the local match state
                currentMatch.isAccessible = desiredAccessibility
                this@WaitingRoomActivity.matchSrv.match = currentMatch

                // Update the button text based on the new state
                binding.lockButton.text = if (currentMatch.isAccessible) getString(R.string.lock) else getString(R.string.unlock)

                startMatchButton.isEnabled = !currentMatch.isAccessible
                startMatchButton.alpha = if (!currentMatch.isAccessible) 1.0f else 0.5f

                // Optionally, show a confirmation message
                Snackbar.make(binding.root, "Match ${if (currentMatch.isAccessible) getString(R.string.lock) else getString(R.string.unlock)}.", Snackbar.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateUI() {
        val currentMatch = this.matchSrv.match
        if (currentMatch != null) {
            // Always show the solo section
            binding.soloSection?.visibility = View.VISIBLE
            playersAdapter.updatePlayers(currentMatch.getSoloPlayers())

            // Show or hide the teams section based on isTeamMatch
            if (currentMatch.isTeamMatch) {
                binding.teamsSection?.visibility = View.VISIBLE
                teamsAdapter.updateTeams(currentMatch.teams)
            } else {
                binding.teamsSection?.visibility = View.GONE
            }

            // Set the lock button text based on isAccessible
            binding.lockButton.text = if (currentMatch.isAccessible) getString(R.string.lock) else getString(R.string.unlock)
            startMatchButton.isEnabled = !currentMatch.isAccessible
            startMatchButton.alpha = if (!currentMatch.isAccessible) 1.0f else 0.5f
        }
    }


    private fun navigateToMatchPreview() {
        val intent = Intent(this, GamePreviewActivity::class.java)
        // Optionally, pass necessary extras
        this.matchSrv.leaveMatchRoom()
        startActivity(intent)
        finish()
    }

    private fun populateMatchDetails(players: List<IPlayer>) {
        // Populate other UI elements if necessary
        updateUI()
        // Populate Players RecyclerView
        playersAdapter.updatePlayers(players)
    }

    private fun showError(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }

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

    fun onBeginMatch() {
        // Check if it's a team match
        if (this.matchSrv.match == null)
            return
        if (this.matchSrv.match!!.isTeamMatch) {
            // Ensure there are enough players
            if (this.matchSrv.match!!.players.size < 4) {
                Toast(this).apply {
                    setText(getString(R.string.errorTeams))
                    duration = Toast.LENGTH_SHORT
                    show()
                }
                return
            }

            // Validate that each team has 2 players and the total number of players matches the sum
            val hasValidTeams = this.matchSrv.match!!.teams.all { team -> team.players.size == 2 } &&
                this.matchSrv.match!!.teams.sumOf { team -> team.players.size } == this.matchSrv.match!!.players.size

            // If teams are not valid, show a message
            if (!hasValidTeams) {
                Toast(this).apply {
                    setText(getString(R.string.incompleteTeam))
                    duration = Toast.LENGTH_SHORT
                    show()
                }
                return
            }
        }
        if(this.matchSrv.match!!.players.size < 1){
            Toast(this).apply {
                setText(getString(R.string.noPlayer))
                duration = Toast.LENGTH_SHORT
                show()
            }
            return
        }

        // Send the BeginMatch event through the socket
        this.matchSrv.beginMatch()


        val timerDuration = if (this.matchSrv.match!!.game.questions[0].type == QUESTION_TYPE.QRL) { 60 }
        else { this.matchSrv.match!!.game.duration }
        showCountdownPopup {
            // Callback after countdown finishes, starting the main match timer
            this.timeService.startTimer(timerDuration, matchAccessCode!!) {
                // Optional: Actions to execute after the timer, e.g., closing a transition dialog
                // TODO : add redirection to the game page
            }
        }

        /** TODO : 1. Start timer
         *         2. Add Cancel Timer
         *         3. Redirect to Quiz on Timer end.
         */
    }

    private fun showCountdownPopup(onCountdownComplete: () -> Unit) {
        // Inflate the custom layout for the dialog
        val dialogView = LayoutInflater.from(this).inflate(R.layout.transition_to_match, null)

        val timerText = dialogView.findViewById<TextView>(R.id.timerText)
        val timerProgressBar = dialogView.findViewById<ProgressBar>(R.id.timerProgressBar)

        // Create the AlertDialog to display the pop-up
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()


        // Set initial display and progress
        timerText.text = "5"
        timerProgressBar.progress = 100

        // Start the countdown timer when the dialog is fully shown
        dialog.setOnShowListener {
            object : CountDownTimer(5000, 1000) {
                override fun onTick(millisUntilFinished: Long) {
                    // Calculate the seconds left, adding 1 to start correctly at 5
                    val secondsLeft = ((millisUntilFinished / 1000) + 1).toInt()
                    timerText.text = secondsLeft.toString()

                    // Update progress smoothly
                    timerProgressBar.progress = ((millisUntilFinished / 5000f) * 100).toInt()
                }

                override fun onFinish() {
                    timerText.text = "0"
                    timerProgressBar.progress = 0

                    timerText.postDelayed({
                        dialog.dismiss()
                        onCountdownComplete()
                    }, 500)
                }
            }.start()
        }

        dialog.show()
    }

    fun startGame() {
            val intent = Intent(this, OrgInMatchActivity::class.java)
            // Optionally, pass necessary extras
            startActivity(intent)
            finish()
    }

    fun getPlayersNotInTeams(allPlayers: List<IPlayer>, teams: List<Team>): List<IPlayer> {
        // Extract all players in teams into a set for efficient lookup
        val playersInTeams = teams.flatMap { it.players }.toSet()

        // Filter allPlayers to include only those not in playersInTeams
        return allPlayers.filter { it.name !in playersInTeams }
    }
}
