package com.auth0.androidlogin

import JoinedChatRoom
import android.app.AlertDialog
import MatchService
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import androidx.lifecycle.lifecycleScope
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.InputFilter
import android.text.TextWatcher
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.AnimationUtils
import android.view.animation.LinearInterpolator
import android.widget.AdapterView
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.content.res.ResourcesCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import chat.ChannelsFragment
import classes.Player
import classes.PlayerAnswers
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.models.IChoice
import com.auth0.androidlogin.models.IPlayer
import com.auth0.androidlogin.models.IPlayerAnswers
import com.auth0.androidlogin.models.IQuestion
import com.auth0.androidlogin.utils.AuthUtils
import com.google.android.material.slider.Slider
import com.services.AccountService
import com.services.ChatSocketService
import com.services.TimeService
import constants.QUESTION_TYPE
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.concurrent.timer

class ObserverInMatchActivity : BaseActivity() {
//    private lateinit var commonHeader: CommonHeader

    private lateinit var selectedPlayer: Player
    private var userId: String? = null
    private var chatService: ChatSocketService = ChatSocketService
    private lateinit var chat: ImageButton
    private var userName: String? = null
    private lateinit var accountService: AccountService
    private var shouldNotifyOnFirstChange: Boolean = false
    private lateinit var timerText: TextView
    private lateinit var questionPointsText: TextView
    private lateinit var timerProgressBar: ProgressBar
    private lateinit var panicButton: Button
    private lateinit var pauseButton: ImageButton
    private lateinit var nextButton: Button
    private lateinit var quitButton: Button

    private lateinit var questionTextView: TextView
    private lateinit var answersContainer: LinearLayout  // Container pour les réponses

    private var timerDuration: Long = 30000
    private var isPanicModeEnabled = false
    private var isPaused = false
    private var timeRemaining: Long = timerDuration
    private lateinit var playerRecyclerView: RecyclerView
    private val matchSrv: MatchService = MatchService
    private val timeService: TimeService = TimeService

    private var currentQuestionIndex = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_observer_in_match)
        userId = AuthUtils.getUserId(this)

//        commonHeader = findViewById(R.id.commonHeader)
        // commonHeader.setListener(this)
        userName = AuthUtils.getUserName(this)
        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService
        accountService = AccountService(this)

        timerText = findViewById(R.id.timerText)
        questionPointsText = findViewById(R.id.questionPoints)
        timerProgressBar = findViewById(R.id.timerProgressBar)
        panicButton = findViewById(R.id.panicButton)
        pauseButton = findViewById(R.id.pauseButton)
        nextButton = findViewById(R.id.nextButton)
        quitButton = findViewById(R.id.quitButton)
        questionTextView = findViewById(R.id.question)
        answersContainer = findViewById(R.id.answersContainer)
        playerRecyclerView = findViewById(R.id.recyclerView)
        playerRecyclerView.layoutManager = LinearLayoutManager(this)

//        val userProfilePicture = AuthUtils.getUserProfilePictureResourceId(this)
//        if (userProfilePicture != null && userProfilePicture != 0) {
//            commonHeader.setUserProfilePicture(userProfilePicture)
//        }

        // Set user information in CommonHeader
//        if (!userName.isNullOrEmpty()) {
//            commonHeader.setWelcomeText(userName!!)
//        }

        lifecycleScope.launch {
            val userTheme = getUserThemeFromServer()
            withContext(Dispatchers.Main) {
                updateTheme(userTheme)
            }
        }

        lifecycleScope.launch {
            this@ObserverInMatchActivity.setUpSpinner()
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
            }
        }

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
                        this@ObserverInMatchActivity.showNotification(
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
                Log.d(
                    "HomeActivity",
                    "Channel: ${chatRoom.chatRoomName}, Unread Count: $unreadMessageCount"
                )
                if (unreadMessageCount > 0) {
                    hasUnreadMessage = true
                    Log.d(
                        "CreateGameActivity",
                        "Unread messages found in channel: ${chatRoom.chatRoomName}"
                    )
                    break
                }
            }

            this.chatService.hasUnreadMessages = hasUnreadMessage
            updateChatButtonIcon()
        }

        playerRecyclerView.adapter = object : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
                val view = LayoutInflater.from(parent.context).inflate(R.layout.match_players_tab, parent, false)
                return object : RecyclerView.ViewHolder(view) {}
            }

            override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
                val player = this@ObserverInMatchActivity.matchSrv.match!!.players[position]

                // Set player name
                holder.itemView.findViewById<TextView>(R.id.playerName)?.text = player.name

                // Set player score
                holder.itemView.findViewById<TextView>(R.id.playerScore)?.text = player.score.toString()
            }
            override fun getItemCount() = this@ObserverInMatchActivity.matchSrv.match!!.players.size
        }

        quitButton.setOnClickListener {
            goToHome()
        }

        updateQuestionPoints(0)

        this.matchSrv.changeQuestion.observe(this) { question -> setUpView(this.selectedPlayer) }
        updateChatButtonIcon()
        createNotificationChannel()

        this.matchSrv.changeRoom.observe(this) { roomChange ->
            run { if (roomChange == "MainActivity") navigateToMatchPreview()
                if (roomChange == "ResultsActivity") navigateToResults()
            }}

        this.matchSrv.changeState.observe(this) { state -> run {
            Log.d("ObserverInMatchActivity", "changeState : $state")
            if (state == "QCM") {
                playerRecyclerView.adapter?.notifyDataSetChanged()
            }
            if(state == "QRL") {

            }
            if(state == "Panic") {

            }
            if(state == "Questions") {

            }
        }}

        this.matchSrv.answerUpdated.observe(this) { state -> run {
            // setUpView(this.)
        }}

        this.timeService.newTime.observe(this) { time ->
            this.timeRemaining = time.toLong()
            timerText.text = time.toString()
            timerProgressBar.progress = time
        }
    }

    override fun onDestroy() {
        super.onDestroy()
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



    private fun goToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        startActivity(intent)
        finish()
    }

    private fun updateQuestionPoints(points: Int) {
        questionPointsText.text = "${getString(R.string.questionPoints)} $points points"
    }




    private fun updateIconsColor(banIcon: ImageView, unbanIcon: ImageView, isChecked: Boolean) {
        val greyColor = ContextCompat.getColor(this, R.color.lightGrey)
        if (isChecked) {
            unbanIcon.clearColorFilter()
            banIcon.setColorFilter(greyColor)
        } else {
            unbanIcon.setColorFilter(greyColor)
            banIcon.clearColorFilter()
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

    private fun showCountdownPopup(onCountdownComplete: () -> Unit) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.question_transition, null)
        val nextQuestion = dialogView.findViewById<TextView>(R.id.nextQuestion)
        val timerText = dialogView.findViewById<TextView>(R.id.timerText)
        val timerProgressBar = dialogView.findViewById<ProgressBar>(R.id.timerProgressBar)

        // Create the AlertDialog to display the pop-up
        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        nextQuestion.text = getString(R.string.nextQuestion)
        timerText.text = "3"
        timerProgressBar.progress = 100

        dialog.setOnShowListener {
            object : CountDownTimer(3000, 1000) {
                override fun onTick(millisUntilFinished: Long) {
                    val secondsLeft = ((millisUntilFinished / 1000) + 1).toInt()
                    timerText.text = secondsLeft.toString()

                    // Update progress smoothly
                    timerProgressBar.progress = ((millisUntilFinished / 3000f) * 100).toInt()
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
//    fun onEditUsernameClick() {
//        accountService.showEditUsernameDialog(this)
//    }

    private fun navigateToMatchPreview() {
        val intent = Intent(this, GamePreviewActivity::class.java)
        // Optionally, pass necessary extras
        this.matchSrv.leaveMatchRoom()
        startActivity(intent)
        finish()
    }

    private fun navigateToResults(){
        val intent = if(!this.matchSrv.match!!.isTeamMatch)
            Intent(this, ResultsPageSoloActivity::class.java)
        else
            Intent(this, ResultsPageTeamActivity::class.java)
        // Optionally, pass necessary extras
        startActivity(intent)
        finish()
    }

    private fun setUpSpinner() {
        val playerSpinner: Spinner = findViewById(R.id.topLeftSpinner)
        val players = this.matchSrv.match!!.players
        val organizer = Player("Organizer", true, 0.0F, 0, false, 0)
        players.add(organizer)

        // val adapter =
        // playerSpinner.adapter = adapter
        playerSpinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(p0: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val selectedPlayer = players[position]
                setUpView(selectedPlayer)
            }

            override fun onNothingSelected(parent: AdapterView<*>) {}
        }

    }

    private fun setUpView(player: IPlayer) {
        val question = this.matchSrv.changeQuestion.value!!
        val playerAnswers = this.matchSrv.match!!.playerAnswers
        val currentPlayerAnswers: IPlayerAnswers? = playerAnswers.find{
            playerAnswer -> playerAnswer.name == player.name &&
            playerAnswer.questionId == question.id
        }
        answersContainer.removeAllViews()
        if (currentPlayerAnswers == null) {
            return;
        } else if (player.name != "organizer") {
            when (question.type) {
                "QCM" -> setupQCMQuestionOrg(question)
                "QRL" -> setupQRLQuestionOrg(question)
                "QRE" -> setupQREQuestionOrg(question)
            }
        } else {
            when (question.type) {
                "QCM" -> setupQCMQuestionPlayer(currentPlayerAnswers, question)
                "QRL" -> setupQRLQuestionPlayer(currentPlayerAnswers, question)
                "QRE" -> setupQREQuestionPlayer(currentPlayerAnswers, question)
            }
        }
    }

    private fun setupQCMQuestionPlayer(playerAnswers: IPlayerAnswers, question: IQuestion) {
        val answers = playerAnswers.qcmAnswers!!
        val options = this.matchSrv.changeQuestion.value!!.choices
        options.forEachIndexed { index, option ->
            val answerButton = createQCMAnswerButton(option.text!!, index, answers)
            answerButton.isEnabled = true
            answersContainer.addView(answerButton)
        }
    }

    private fun createQCMAnswerButton(answerText: String, answerIndex: Int, answers: List<IChoice>): Button {
        return Button(this).apply {
            text = "${answerIndex + 1}. $answerText" // Afficher le numéro avant la réponse
            if (!answers.any{answer -> answer.text == answerText}) {setBackgroundResource(R.drawable.rectangle_orange_box)}
            else {setBackgroundResource(R.drawable.selected_answer_border)}// Fond par défaut
            setTextColor(Color.BLACK)
            textSize = 20f
            isAllCaps = false
            gravity = android.view.Gravity.START
            typeface = ResourcesCompat.getFont(this@ObserverInMatchActivity, R.font.roboto_regular)
            setPadding(20, 20, 20, 20)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 8, 0, 8)
            }
        }
    }

    private fun setupQRLQuestionPlayer(playerAnswers: IPlayerAnswers, question: IQuestion) {
        answersContainer.removeAllViews()
        answersContainer.addView(createQRLAnswerBox())
    }

    private fun createQRLAnswerBox(): View {
        // Inflate qrl_box layout as a View and find required components
        val qrlBox = layoutInflater.inflate(R.layout.qrl_box, null)
        val answerEditText = qrlBox.findViewById<EditText>(R.id.qrlEditText)
        val characterCounter = qrlBox.findViewById<TextView>(R.id.characterCounter)

        // Set the text you want programmatically
        val predefinedText = "This is the predefined text that will appear in the EditText."
        answerEditText.setText(predefinedText)

        // Disable the EditText to prevent user typing
        answerEditText.isFocusable = false
        answerEditText.isClickable = false
        answerEditText.isCursorVisible = false

        // Set character limit (optional) and add a TextWatcher to display the current length
        answerEditText.filters = arrayOf(InputFilter.LengthFilter(200))
        answerEditText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val length = s?.length ?: 0
                characterCounter.text = "$length/200"

                // Change color based on character limit
                if (length >= 200) {
                    characterCounter.setTextColor(Color.RED)
                } else {
                    characterCounter.setTextColor(Color.GRAY) // Default color
                }
            }

            override fun afterTextChanged(s: Editable?) {}
        })

        return qrlBox
    }


    private fun setupQREQuestionPlayer(playerAnswers: IPlayerAnswers, question: IQuestion) {
        val nonInteractiveSlider = Slider(this).apply {
            valueFrom = 0f
            valueTo = 100f
            stepSize = 10f
            value = 50f
            setPadding(20, 20, 20, 20)
            isEnabled = false // Disable interaction
        }
        answersContainer.addView(nonInteractiveSlider)
    }

    private fun setupQCMQuestionOrg(question: IQuestion) {
        // Clear any previous views
        val correctAnswerIndices = mutableListOf<Int>()

        val answers = question.choices

        for (i in answers.indices) {
            if (answers[i].isCorrect)
                correctAnswerIndices.add(i)
        }
        answersContainer.removeAllViews()

        // Iterate through each answer and set up the answer view
        answers.forEachIndexed { index, answerText ->
            val answerTextView = TextView(this).apply {
                text = "${index + 1}. ${answerText.text}"
                setTextColor(Color.BLACK)
                textSize = 18f
                gravity = Gravity.CENTER_VERTICAL
                setPadding(20, 20, 20, 20)
                setBackgroundResource(R.drawable.rectangle_orange_box) // Default background

                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, 8, 0, 8)
                }
            }

            // Immediately set the background color based on correctness
            if (index in correctAnswerIndices) {
                answerTextView.setBackgroundResource(R.drawable.correct_answer_border)
            } else {
                answerTextView.setBackgroundResource(R.drawable.incorrect_answer_border)
            }

            // Add each TextView to the container
            answersContainer.addView(answerTextView)
        }
    }

    private fun setupQRLQuestionOrg(question: IQuestion) {
        if (this.matchSrv.hasQuestionEvaluationBegun) {
            this.setupQRLQuestionWithCorrection()
        } else {
            this.setupQRLEmpty()
        }
    }

    private fun setupQRLQuestionWithCorrection() {
        for(i in 0 until this.matchSrv.match!!.playerAnswers.size){
            if(this.matchSrv.match!!.playerAnswers[i].questionId == this.matchSrv.changeQuestion.value!!.id)
            {
                setUpEvaluation(i, this.matchSrv.match!!.playerAnswers[i])
                return
            }
        }
        Log.d("ObserverInMatchActivity", "No Evaluations")
        answersContainer.removeAllViews()
    }

    private fun setUpEvaluation(playerIndex: Int, playerAnswers: IPlayerAnswers) {
        answersContainer.removeAllViews()

        // Inflate the correction_qrl_box layout and get references to its elements
        val correctionView = layoutInflater.inflate(R.layout.correction_qrl_box, null)
        val playerResponseTextView = correctionView.findViewById<TextView>(R.id.playerResponseTextView)

        // Simulate player response (In real implementation, fetch actual player response)
        Log.d("ObserverInMatchActivty", "setUpEvaluation : ${playerAnswers.qrlAnswer}")
        playerResponseTextView.text = playerAnswers.qrlAnswer


        // Add the correction view to the answers container
        answersContainer.addView(correctionView)
    }

    private fun setupQREQuestionOrg(question: IQuestion) {

    }

    private fun setupQRLEmpty() {
        answersContainer.removeAllViews()
    }
}
