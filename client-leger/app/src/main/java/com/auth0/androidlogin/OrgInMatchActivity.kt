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
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import chat.ChannelsFragment
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.models.IChoice
import com.auth0.androidlogin.models.IPlayerAnswers
import com.auth0.androidlogin.models.IQuestion
import com.auth0.androidlogin.utils.AuthUtils
import com.bumptech.glide.Glide
import com.google.android.material.slider.Slider
import com.services.AccountService
import com.services.ChatSocketService
import com.services.GameService
import com.services.TimeService
import constants.QUESTION_TYPE
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.concurrent.timer

class OrgInMatchActivity : BaseActivity() {

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
    private val gameService: GameService = GameService()
    private lateinit var questionImageView: ImageView

    private var currentQuestionIndex = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_org_in_match)
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
        questionImageView = findViewById(R.id.questionImageView)

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
                        this@OrgInMatchActivity.showNotification(
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
                val player = this@OrgInMatchActivity.matchSrv.match!!.players[position]

                // Set player name
                holder.itemView.findViewById<TextView>(R.id.playerName)?.text = player.name

                // Set player score
                holder.itemView.findViewById<TextView>(R.id.playerScore)?.text = player.score.toString()
            }
            override fun getItemCount() = this@OrgInMatchActivity.matchSrv.match!!.players.size
        }

        disablePanicButton()
        disableNextButton()

        panicButton.setOnClickListener {
            enablePanicMode()
        }

        pauseButton.setOnClickListener {
            togglePauseResume()
        }

        nextButton.setOnClickListener {
            this.matchSrv.sendSwitchQuestion()
        }

        quitButton.setOnClickListener {
            // goToHome()
            showCancelConfirmationDialog()
        }

        updateQuestionPoints(this.matchSrv.changeQuestion.value!!.points)

        this.matchSrv.changeQuestion.observe(this) { question -> showQuestion(question)
            updateQuestionPoints(question.points)
        }
        updateChatButtonIcon()
        createNotificationChannel()

        this.matchSrv.changeRoom.observe(this) { roomChange ->
            run { if (roomChange == "MainActivity") navigateToMatchPreview()
                if (roomChange == "ResultsActivity") navigateToResults()
            }}

        this.matchSrv.changeState.observe(this) { state -> run {
            Log.d("OrgInMatch", "changeState : $state")
            if (state == "QCM") {
                playerRecyclerView.adapter?.notifyDataSetChanged()
                Log.d("Button", "1")
                this.enableNextButton()
            }
            if(state == "QRL") {
                setupQRLQuestionWithCorrection()
            }
            if(state == "Panic") {
                disablePanicButton()
            }
            if(state == "Questions") {
                Log.d("Button", "2")
                enableNextButton()
            }
        }}

        this.timeService.newTime.observe(this) { time ->
            this.timeRemaining = time.toLong()
            timerText.text = time.toString()
            timerProgressBar.progress = time
            Log.d("Button",  this.matchSrv.changeState.value.toString())
            if (time <= 20 && this.matchSrv.changeQuestion.value!!.type == "QRL") {
                this.enablePanicButton()
            }

            if ( time <= 10 &&
                (this.matchSrv.changeQuestion.value!!.type == "QCM" || this.matchSrv.changeQuestion.value!!.type == "QRE")){
                this.enablePanicButton()
            }
            if (time == 0) {
                if (this.matchSrv.changeQuestion.value!!.type == "QCM") {
                    playerRecyclerView.adapter?.notifyDataSetChanged()
                    Log.d("Button", "3")
                    this.enableNextButton()
                }
                if(this.matchSrv.changeQuestion.value!!.type == "QRL") {
                    setupQRLQuestionWithCorrection()
                }
                if (this.matchSrv.changeQuestion.value!!.type == "QRE") {
                    playerRecyclerView.adapter?.notifyDataSetChanged()
                    Log.d("Button", "4")
                    this.enableNextButton()
                    this.disablePanicButton()
                }
            }
            else {
                val state = this.matchSrv.changeState.value
                if (state == null) this.disableNextButton()
            }
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
            goToHome()
        }

        val alertDialog = builder.create()
        alertDialog.show()

        alertDialog.getButton(AlertDialog.BUTTON_NEGATIVE).setTextColor(resources.getColor(R.color.red))
        alertDialog.getButton(AlertDialog.BUTTON_POSITIVE).setTextColor(resources.getColor(R.color.green))
    }

    override fun onDestroy() {
        super.onDestroy()
        this.deleteMatch()
        this.matchSrv.finishMatch()
    }

    private fun deleteMatch() {
        lifecycleScope.launch {
            try {
                val accessToken = AuthUtils.getAccessToken(this@OrgInMatchActivity)
                if (accessToken.isNullOrEmpty()) {
                    // navigateToHome()
                    return@launch
                }

                // Call the deleteMatch API
                val success = this@OrgInMatchActivity.gameService.deleteMatch(accessToken,
                    this@OrgInMatchActivity.matchSrv.matchAccessCode!!)

                if (success) {
                    Log.d("WaitingRoomActivity", "Match deleted successfully.")
                    navigateToMatchPreview()
                } else {
                    Log.e("WaitingRoomActivity", "Failed to delete match.")
                }

            } catch (e: Exception) {
                e.printStackTrace()
                Log.e("WaitingRoomActivity", "Exception during deleteMatch", e)
            }
        }
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

        val channelFragment = ChannelsFragment()
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
        this.matchSrv.cancelGame()
        startActivity(intent)
        finish()
    }

    private fun disablePanicButton() {
        panicButton.isEnabled = false
        panicButton.setBackgroundColor(Color.GRAY)
        panicButton.setTextColor(Color.DKGRAY)
    }

    private fun disableNextButton(){
        nextButton.isEnabled = false
        nextButton.setBackgroundColor(Color.GRAY)
        nextButton.setTextColor(Color.DKGRAY)
    }

    private fun enablePanicButton() {
        panicButton.isEnabled = true
        panicButton.setBackgroundColor(ContextCompat.getColor(this, R.color.red))
        panicButton.setTextColor(Color.WHITE)
    }
    private fun enableNextButton() {
        Log.d("Button", "Pressed")
        nextButton.isEnabled = true
        nextButton.setBackgroundColor(ContextCompat.getColor(this, R.color.lightGreen))
        nextButton.setTextColor(Color.WHITE)
    }

    private fun disablePauseButton() {
        pauseButton.isEnabled = false
        pauseButton.setBackgroundColor(Color.GRAY)
        pauseButton.setColorFilter(Color.DKGRAY)
    }
    private fun enablePauseButton() {
        pauseButton.isEnabled = true
        pauseButton.setBackground(ContextCompat.getDrawable(this, R.drawable.rectangle_light_green))
        pauseButton.clearColorFilter()
    }

    private fun enablePanicMode() {
        isPanicModeEnabled = true
        panicButton.isEnabled = false
        this.matchSrv.activatePanicMode()
        disablePauseButton()
        disablePanicButton()
    }



    private fun updateQuestionPoints(points: Int) {
        questionPointsText.text = "${getString(R.string.questionPoints)} $points points"
    }

    private fun togglePauseResume() {
        runOnUiThread{
        if (isPaused) {
            pauseButton.background = ContextCompat.getDrawable(this, R.drawable.rectangle_light_green)
            pauseButton.setImageResource(R.drawable.ic_pause)
            TimeService.startTimer(timeRemaining.toInt(), this.matchSrv.matchAccessCode!!) {
                runOnUiThread {
                if (this.matchSrv.changeQuestion.value!!.type == "QCM" ||
                    this.matchSrv.changeQuestion.value!!.type == "QRE") {
                    playerRecyclerView.adapter?.notifyDataSetChanged()
                    Log.d("Button", "5")
                    this.enableNextButton()
                }
                if(this.matchSrv.changeQuestion.value!!.type  == "QRL") {
                    setupQRLQuestionWithCorrection()
                }}
            }
        } else {
            pauseButton.background = ContextCompat.getDrawable(this, R.drawable.rectangle_light_green)
            pauseButton.setImageResource(R.drawable.ic_play)
            TimeService.stopServerTimer(this.matchSrv.matchAccessCode!!)
        }
        isPaused = !isPaused
        }
    }

    private fun showQuestion(question : IQuestion) {
            enablePauseButton()
            disableNextButton()
            questionTextView.text = question.text
            val image = this.matchSrv.changeQuestion.value!!.image
            if (!question.image.isNullOrEmpty()) {
                questionImageView.visibility = View.VISIBLE
                if (question.image.startsWith("data:image")) {
                    Glide.with(this)
                        .load(image)
                        .error(R.drawable.image_not_found)
                        .into(questionImageView)
                } else {
                    val imageResId = resources.getIdentifier(question.image, "drawable", packageName)
                    if (imageResId != 0) {
                        questionImageView.setImageResource(imageResId)
                    } else {
                        questionImageView.visibility = View.GONE
                        Log.e("OrgInMatchActivity", "Image resource not found: ${question.image}")
                    }
                }
            } else {
                questionImageView.visibility = View.GONE
            }
            answersContainer.removeAllViews()

            when (question.type) {
                "QCM" -> setupQCMQuestion(question.choices)
                "QRL" -> answersContainer.removeAllViews()
                "QRE" -> Log.d("OrgInMatchActivity", "StartingQRE")
            }
    }

    private fun setupQCMQuestion(answers: List<IChoice>) {
        // Clear any previous views
        val correctAnswerIndices = mutableListOf<Int>()

        for (i in answers.indices)
        {
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


    private fun setupQRLQuestionWithCorrection() {
        this.disableNextButton()
        this.matchSrv.beginQrlEvaluation()
        for(i in 0 until this.matchSrv.match!!.playerAnswers.size){
            if(this.matchSrv.match!!.playerAnswers[i].questionId == this.matchSrv.changeQuestion.value!!.id)
            {
                setUpEvaluation(i, this.matchSrv.match!!.playerAnswers[i])
                return
            }
        }
        Log.d("Button", "6")
        this.enableNextButton()
        Log.d("OrgInMatchActivity", "No Evaluations")
        this.matchSrv.finishQrlEvaluation()
        answersContainer.removeAllViews()
    }

    private fun setUpEvaluation(playerIndex: Int, playerAnswers: IPlayerAnswers) {
        answersContainer.removeAllViews()

        // Inflate the correction_qrl_box layout and get references to its elements
        val correctionView = layoutInflater.inflate(R.layout.correction_qrl_box, null)
        val playerResponseTextView = correctionView.findViewById<TextView>(R.id.playerResponseTextView)

        // Simulate player response (In real implementation, fetch actual player response)
        Log.d("OrgInMatch", "setUpEvaluation : ${playerAnswers.qrlAnswer}")
        playerResponseTextView.text = playerAnswers.qrlAnswer

        val evaluation0Button = correctionView.findViewById<Button>(R.id.note0Button)
        val evaluation50Button = correctionView.findViewById<Button>(R.id.note50Button)
        val evaluation100Button = correctionView.findViewById<Button>(R.id.note100Button)

        evaluation0Button.setOnClickListener {
            evaluateAnswer(playerAnswers.name,0F, playerIndex)
        }
        evaluation50Button.setOnClickListener {
            evaluateAnswer(playerAnswers.name, 0.5F, playerIndex)
        }
        evaluation100Button.setOnClickListener {
            evaluateAnswer(playerAnswers.name, 1F, playerIndex)
        }

        // Add the correction view to the answers container
        answersContainer.addView(correctionView)
    }

    private fun evaluateAnswer(playerName: String, score: Float, playerIndex: Int) {
        // Implement evaluation logic, such as storing the score or updating the UI
        this.matchSrv.updatePlayerScore(playerName, score)
        Log.d("OrgInMatchActivity", "Answer evaluated with score: $score")
        for(i in playerIndex + 1 until this.matchSrv.match!!.players.size){
            if(this.matchSrv.match!!.playerAnswers[i].questionId == this.matchSrv.changeQuestion.value!!.id)
            {
                setUpEvaluation(i, this.matchSrv.match!!.playerAnswers[i])
                return
            }
        }
        Log.d("Button", "7")
        enableNextButton()
        this.matchSrv.finishQrlEvaluation()
        Log.d("OrgInMatchActivity", "Done with evaluations.")
        answersContainer.removeAllViews()
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

//    override fun onUsernameUpdated(newUsername: String) {
//        commonHeader.setWelcomeText(newUsername)
//        Log.d("HomeActivity", "NEW USER NAME --- $newUsername")
//    }

//    override fun onUsernameUpdateFailed(errorMessage: String) {
//        Toast.makeText(this, errorMessage, Toast.LENGTH_SHORT).show()
//    }
}
