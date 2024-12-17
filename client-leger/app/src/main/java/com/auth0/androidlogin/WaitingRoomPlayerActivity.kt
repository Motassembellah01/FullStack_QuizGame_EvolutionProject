package com.auth0.androidlogin

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
import android.text.Editable
import android.text.InputFilter
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.LinearLayout
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
import com.auth0.androidlogin.databinding.ActivityWaitingRoomPlayerBinding
import com.auth0.androidlogin.models.IMatch
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.models.ITeam
import com.auth0.androidlogin.utils.AuthUtils
import com.services.GameService
import com.google.android.material.snackbar.Snackbar
import com.services.AccountService
import com.services.TimeService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient

class WaitingRoomPlayerActivity : BaseActivity() {

    private lateinit var binding: ActivityWaitingRoomPlayerBinding
    private lateinit var playersAdapter: PlayersAdapter
    private lateinit var gameService: GameService
    private lateinit var teamsAdapter: TeamsAdapter
    private lateinit var timeService: TimeService
    private var avatarUrl: String? = ""
    private val socketService: SocketService = SocketService
    private val matchSrv: MatchService = MatchService
    private var matchAccessCode: String? = null
    private var IMatchDetails: IMatch? = null
    private var userName: String? = null
    private lateinit var accountService: AccountService
//    private lateinit var commonHeader: CommonHeader
    private var chatService: ChatSocketService = ChatSocketService
    private lateinit var chat: ImageButton
    private val client = OkHttpClient()
    private var shouldNotifyOnFirstChange: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        this.matchAccessCode = intent.getStringExtra("MATCH_ACCESS_CODE")
        // Inflate the layout using View Binding
        binding = ActivityWaitingRoomPlayerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        userName = AuthUtils.getUserName(this)

//        commonHeader = findViewById(R.id.commonHeader)
        // commonHeader.setListener(this)

        accountService = AccountService(this)
        gameService = GameService()
        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService
        this.timeService = TimeService
        avatarUrl = AuthUtils.getUserProfilePictureUrl(this)

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
                        this@WaitingRoomPlayerActivity.showNotification(
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

        MatchService.changeRoom.observe(this) {
                roomChange ->
            run { if (roomChange == "MainActivity") navigateToJoinGame()
                if (roomChange == "GameActivity") startGame()
            }
        }
//        MatchService.newPlayer.observe(this) {
//                newPlayer -> populateMatchDetails(newPlayer)
//        }

        MatchService.newPlayer.observe(this) { newPlayer ->
            if (newPlayer != null) {
                Log.d("WaitingRoomPlayer", "$newPlayer")
                updateUI()
            } else {
                Log.e("WaitingRoomPlayer", "Received null newPlayer")
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

        this.matchSrv.begunMatch.observe(this) { value ->
            if(value == "start") this.showCountdownPopup {}
        }

        // Retrieve MATCH_ACCESS_CODE from Intent
        matchAccessCode = intent.getStringExtra("MATCH_ACCESS_CODE")
        Log.d("WaitingRoomActivity", "Received Match Access Code: $matchAccessCode")

        if (matchAccessCode.isNullOrEmpty()) {
            showError("Match Access Code is missing.")
            // navigateToHome()
            return
        }

        // Display the Access Code
        binding.accessCodeTextView.text = getString(R.string.accessCode) + " $matchAccessCode"

        // Initialize PlayersAdapter
        playersAdapter = PlayersAdapter(mutableListOf(), isOrganizer = false, accountService)
        teamsAdapter = TeamsAdapter(
            teams = mutableListOf(),
            onQuitTeamClick = { team ->
                // Handle quitting the team
                quitTeam(team)
            },
            accountService = accountService
        )

        // Optionally, set the Join Team click listener
        teamsAdapter.setOnJoinTeamClickListener { team ->
            joinTeam(team)
            this.matchSrv.joinTeam(team.name)
        }


        // Setup RecyclerViews
        binding.soloPlayersRecyclerView?.layoutManager = LinearLayoutManager(this)
        binding.soloPlayersRecyclerView?.adapter = playersAdapter

        binding.teamsRecyclerView?.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        binding.teamsRecyclerView?.adapter = teamsAdapter

        // setupCommonHeader()
        setupButtons()

//        if (!userName.isNullOrEmpty()) {
//            commonHeader.setWelcomeText(userName!!)
//        }

//        val userProfilePicture = AuthUtils.getUserProfilePictureResourceId(this)
//        if (userProfilePicture != null && userProfilePicture != 0) {
//            commonHeader.setUserProfilePicture(userProfilePicture)
//        }

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

        // Update UI initially after match details are fetched
        updateChatButtonIcon()
        createNotificationChannel()
    }

    private fun updateUI() {
        val currentMatch = MatchService.match
        if (currentMatch != null) {
            Log.d("WaitingRoomPlayer", "Match Access Code: ${currentMatch.accessCode}")
            Log.d("WaitingRoomPlayer", "Is Team Match: ${currentMatch.isTeamMatch}")
            Log.d("WaitingRoomPlayer", "Teams: ${currentMatch.teams}")

            if (currentMatch.isTeamMatch) {
                binding.teamsSection?.visibility = View.VISIBLE
                binding.soloSection?.visibility = View.VISIBLE
                val teams = currentMatch.teams ?: emptyList()
                teamsAdapter.updateTeams(teams)
                playersAdapter.updatePlayers(currentMatch.getSoloPlayers())
            } else {
                binding.teamsSection?.visibility = View.GONE
                binding.soloSection?.visibility = View.VISIBLE
                playersAdapter.updatePlayers(currentMatch.players)
            }
        } else {
            Log.e("WaitingRoomPlayer", "currentMatch is null")
        }
    }

    private fun setupButtons() {
        // Back Button: Deletes the match and redirects to Match Preview
        binding.backToJoinButton.setOnClickListener {
            showCancelConfirmationDialog()
        }
        binding.createTeamButton?.setOnClickListener {
            showCreateTeamDialog()
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
            navigateToJoinGame()
        }

        val alertDialog = builder.create()
        alertDialog.show()

        alertDialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(resources.getColor(R.color.red))
        alertDialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(resources.getColor(R.color.green))
    }

    private fun showCreateTeamDialog() {
        // Implement a dialog to input team name
        val builder = androidx.appcompat.app.AlertDialog.Builder(this)
        builder.setTitle(getString(R.string.createTeam))

        // Create a vertical LinearLayout to hold EditText and character count
        val layout = LinearLayout(this)
        layout.orientation = LinearLayout.VERTICAL
        layout.setPadding(50, 40, 50, 10) // Adjust padding as needed

        // Set up the input
        val input = android.widget.EditText(this)
        input.hint = getString(R.string.createTeamName)
        input.maxLines = 1
        input.inputType = android.text.InputType.TYPE_CLASS_TEXT
        // Apply the 12-character limit
        input.filters = arrayOf(InputFilter.LengthFilter(12))

        // Add EditText to the layout
        layout.addView(input)

        // Add a TextView for character count
        val charCount = android.widget.TextView(this)
        charCount.text = "0/12"
        charCount.setTextColor(android.graphics.Color.GRAY)
        charCount.textSize = 12f
        layout.addView(charCount)

        builder.setView(layout)

        builder.setPositiveButton(getString(R.string.createTeam)) { _, _ ->
            // This will be overridden later
        }
        builder.setNegativeButton(getString(R.string.cancel)) { dialog, _ ->
            dialog.dismiss()
        }

        // Build the dialog
        val dialog = builder.create()
        dialog.show()

        val createButton = dialog.getButton(androidx.appcompat.app.AlertDialog.BUTTON_POSITIVE)
        createButton.isEnabled = false

        // Set up the buttons
        dialog.getButton(androidx.appcompat.app.AlertDialog.BUTTON_POSITIVE).setOnClickListener {
            val teamName = input.text.toString().trim()
            if (teamName.isNotEmpty() && teamName.length <= 12) {
                createTeam(teamName)
                dialog.dismiss()
            } else {
                dialog.getButton(androidx.appcompat.app.AlertDialog.BUTTON_POSITIVE).isEnabled = false
                showError(getString(R.string.charExceeded))
            }
        }


        // Add TextWatcher to handle input validation and character count
        input.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val length = s?.length ?: 0
                charCount.text = "$length/12"

                // Enable "Create" button only if input is valid
                val isValid = length in 1..12
                dialog.getButton(androidx.appcompat.app.AlertDialog.BUTTON_POSITIVE).isEnabled = isValid

                if (length == 12) {
                    Toast.makeText(this@WaitingRoomPlayerActivity, R.string.charExceeded, Toast.LENGTH_SHORT).show()
                }
            }

            override fun afterTextChanged(s: Editable?) {}
        })
    }


    private fun createTeam(teamName: String) {
        lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                MatchService.createTeam(teamName)
            }
            updateUI()
            Snackbar.make(
                binding.root,
                getString(R.string.snackbar_team_created_and_joined, teamName),
                Snackbar.LENGTH_SHORT
            ).show()
        }
    }

    private fun quitTeam(team: Team) {
        lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                MatchService.leaveTeam(team.name)
            }
            updateUI()
            Snackbar.make(
                binding.root,
                getString(R.string.snackbar_quit_team, team.name),
                Snackbar.LENGTH_SHORT
            ).show()
        }
    }

    private fun joinTeam(team: Team) {
        lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                MatchService.joinTeam(team.name, userName!!)
            }
            updateUI()
            Snackbar.make(
                binding.root,
                getString(R.string.snackbar_joined_team, team.name),
                Snackbar.LENGTH_SHORT
            ).show()
        }
    }

    private fun startMatch() {
        lifecycleScope.launch {
            // TODO
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

    private fun navigateToJoinGame() {
        val intent = Intent(this, JoinGameActivity::class.java)
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

//    private fun populateMatchDetails(match: Match) {
//        // Populate other UI elements if necessary
//
//        // Populate Players RecyclerView
//        playersAdapter.updatePlayers(match.players)
//    }
// quit (delete match?)
//    private fun navigateToHome() {
//        val intent = Intent(this, HomeActivity::class.java)
//        startActivity(intent)
//        finish()
//    }

    private fun showError(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }

    // Implementation of CommonHeaderListener
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

//    private fun setupCommonHeader() {
//        binding.commonHeader?.setListener(this)
//    }


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

        timerText.text = "5"
        timerProgressBar.progress = 100

        // Start the countdown timer when the dialog is fully shown
        dialog.setOnShowListener {
            object : CountDownTimer(5000, 1000) {
                override fun onTick(millisUntilFinished: Long) {
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
        val intent = Intent(this, PlayerInMatchActivity::class.java)
        // Optionally, pass necessary extras
        startActivity(intent)
        finish()
    }

//    override fun onEditUsernameClick() {
//        accountService.showEditUsernameDialog(this)
//    }

//    override fun onUsernameUpdated(newUsername: String) {
//        commonHeader.setWelcomeText(newUsername)
//        Log.d("HomeActivity", "NEW USER NAME --- $newUsername")
//    }
//
//    override fun onUsernameUpdateFailed(errorMessage: String) {
//        Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
//    }

//    override fun onEditUsernameClick() {
//        accountService.showEditUsernameDialog(this)
//    }
}
