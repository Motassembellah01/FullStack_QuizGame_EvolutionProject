package com.auth0.androidlogin

import JoinedChatRoom
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.InputFilter
import android.text.InputType
import android.text.TextWatcher
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.AnimationUtils
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Switch
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.content.res.ResourcesCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import chat.ChannelsFragment
import com.auth0.androidlogin.components.CommonHeader
import com.auth0.androidlogin.utils.AuthUtils
import com.google.android.material.slider.Slider
import com.services.AccountService
import com.services.ChatSocketService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import MatchService
import android.Manifest
import classes.Choice
import classes.PlayerAnswers
import com.auth0.androidlogin.models.IChoice
import com.auth0.androidlogin.models.IQuestion
import com.services.TimeService
import android.app.AlertDialog
import android.content.pm.PackageManager
import android.widget.Toast
import constants.QUESTION_TYPE
import androidx.core.app.ActivityCompat
import com.bumptech.glide.Glide
import kotlinx.coroutines.CoroutineScope

class PlayerInMatchActivity: BaseActivity() {
    //    private lateinit var commonHeader: CommonHeader
    private var userId: String? = null
    private var chatService: ChatSocketService = ChatSocketService
    private val timeService: TimeService = TimeService
    private lateinit var chat: ImageButton
    private var userName: String? = null
    private val matchSrv: MatchService = MatchService
    private lateinit var questionImageView: ImageView
    private lateinit var accountService: AccountService
    private val matchService: MatchService = MatchService
    private var shouldNotifyOnFirstChange: Boolean = false
    private lateinit var timerText: TextView
    private lateinit var questionPointsText: TextView
    private lateinit var timerProgressBar: ProgressBar
    private lateinit var quitButton: Button
    private lateinit var sendButton: Button
    private lateinit var playerScore : TextView
    private lateinit var questionTextView: TextView
    private lateinit var answersContainer: LinearLayout  // Container pour les réponses

    private var isPanicModeEnabled = false
    private var timeRemaining: Long? = null
    private val selectedButtons = mutableListOf<Button>()


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player_in_match)
        userId = AuthUtils.getUserId(this)

//        commonHeader = findViewById(R.id.commonHeader)
        // commonHeader.setListener(this)
        userName = AuthUtils.getUserName(this)
        chat =  findViewById(R.id.chatButton)
        this.chatService = ChatSocketService
        accountService = AccountService(this)
        playerScore = findViewById(R.id.playerScore)
        timerText = findViewById(R.id.timerText)
        questionPointsText = findViewById(R.id.questionPoints)
        timerProgressBar = findViewById(R.id.timerProgressBar)
        quitButton = findViewById(R.id.quitButton)
        sendButton = findViewById(R.id.sendButton)
        questionTextView = findViewById(R.id.question)
        answersContainer = findViewById(R.id.answersContainer)
        questionImageView = findViewById(R.id.questionImageView)

        val qrlBox = layoutInflater.inflate(R.layout.qrl_box, answersContainer)

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
                        this@PlayerInMatchActivity.showNotification(
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

        quitButton.setOnClickListener {
            //goToHome()
            showCancelConfirmationDialog()
        }
        /*sendButton.setOnClickListener {
            showNextQuestionAndResetTimer()
        }*/

        sendButton.setOnClickListener {
            val qcmAnswers = mutableListOf<IChoice>()
            var qrlAnswer = ""
            var qreAnswer = 0.0F
            if (this.matchService.changeQuestion.value!!.type == "QCM") {
                for (button in selectedButtons) {
                    val firstChar = button.text.firstOrNull()
                    button.isEnabled = false
                    if (firstChar != null && firstChar.isDigit()) {
                        qcmAnswers.add(this.matchService.changeQuestion.value!!.choices[firstChar.digitToInt() - 1])
                    }
                }
            }
            if (this.matchService.changeQuestion.value!!.type == "QRL") {
                qrlAnswer = qrlBox.findViewById<EditText>(R.id.qrlEditText).text.toString()
                Log.d("PlayerInMatch", "QRL send Button with value : $qrlAnswer")

            }
            if (this.matchService.changeQuestion.value!!.type == "QRE") {
                Log.e("PlayerInMatch", "Missing QRE implementation")
                qreAnswer = (answersContainer.getChildAt(0) as Slider).value
            }

            // After collecting answers, set the final answer (you can also pass `answers` if needed)
            this.matchService.setFinalAnswer(qrlAnswer, qcmAnswers, qreAnswer, timeRemaining!!.toInt())
            this.timeService.stopTimer()
            if (this.matchService.changeQuestion.value!!.type !== "QRL") {
                this.showCorrectAnswers()
            }
            //sendButton.isEnabled = false
            disableAnswerInputs()
        }
        this.matchService.changeQuestion.observe(this) { question ->
            showQuestion(question)
            this.isPanicModeEnabled = false
            sendButton.isEnabled = true
            sendButton.alpha = 1.0f
            var timerDuration: Int;
            val currentQuestion = this.matchService.changeQuestion.value!!
            if (currentQuestion.type == QUESTION_TYPE.QRL) {
                timerDuration = 60
            } else {
                timerDuration = this.matchService.match!!.game.duration
            }
            timerProgressBar.max = timerDuration
            this.timeService.startTimer(timerDuration, this.matchService.match!!.accessCode) {
                Log.d("PlayerInMatch", "End of Timer.")
                val qcmAnswers = mutableListOf<IChoice>()
                var qrlAnswer = ""
                var qreAnswer = 0.0F
                if (this.matchService.changeQuestion.value!!.type == "QCM") {
                    for (button in selectedButtons) {
                        val firstChar = button.text.firstOrNull()
                        button.isEnabled = false
                        if (firstChar != null && firstChar.isDigit()) {
                            qcmAnswers.add(this.matchService.changeQuestion.value!!.choices[firstChar.digitToInt() - 1])
                        }
                    }
                }
                if (this.matchService.changeQuestion.value!!.type == "QRL") {
                    qrlAnswer = qrlBox.findViewById<EditText>(R.id.qrlEditText).text.toString()
                }
                if (this.matchService.changeQuestion.value!!.type == "QRE") {
                    qreAnswer = (answersContainer.getChildAt(0) as Slider).value
                }

                // After collecting answers, set the final answer (you can also pass `answers` if needed)
                this.matchService.setFinalAnswer(
                    qrlAnswer,
                    qcmAnswers,
                    qreAnswer,
                    timeRemaining!!.toInt()
                )
                this.timeService.stopTimer()
                if (this.matchService.changeQuestion.value!!.type !== "QRL") {
                    this.showCorrectAnswers()
                }
                disableAnswerInputs()
            }
            timerDuration = if (currentQuestion.type == QUESTION_TYPE.QRL) {
                60
            } else {
                this.matchService.match!!.game.duration
            }
            timeRemaining = timerDuration.toLong() * 1000
            updateQuestionPoints(question.points)
        }

        this.matchService.changeRoom.observe(this) { roomChange ->
            run { if (roomChange == "MainActivity") navigateToMatchPreview()
                if (roomChange == "ResultsActivity") navigateToResults()
            }}

        this.matchService.changeState.observe(this) { state -> run {
            if(state == "Panic") {
                Log.d("PlayerActivity", "Panic")
                this.isPanicModeEnabled = true
            }
            if (state == "Questions") {

            }
            if(state == "QCM") {
                this.highlightAnswers()
                this.updatePlayerScore(this.matchService.score)
            }
        }}

        this.timeService.newTime.observe(this) {newTime ->
            this.timeRemaining = newTime.toLong()
            timerText.text = newTime.toString()
            timerProgressBar.progress = newTime
        }


        //showQuestion(currentQuestionIndex)
        updateChatButtonIcon()
        createNotificationChannel()
    }

    private fun disableAnswerInputs() {
        runOnUiThread{
            val currentQuestion = matchService.changeQuestion.value ?: return@runOnUiThread
            when (currentQuestion.type) {
                "QCM" -> {
                    for (i in 0 until answersContainer.childCount) {
                        val child = answersContainer.getChildAt(i)
                        if (child is Button) {
                            child.isEnabled = false
                        }
                    }
                }
                "QRL" -> {
                    val editText = answersContainer.findViewById<EditText>(R.id.qrlEditText)
                    editText?.isEnabled = false
                }
                "QRE" -> {
                    val slider = answersContainer.getChildAt(0)
                    if (slider is Slider) {
                        slider.isEnabled = false
                    }
                }
            }
            sendButton.isEnabled = false
            sendButton.alpha = 0.5f
        }}


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
        if (this.matchService.changeRoom.value != "ResultsActivity")
            this.matchService.playerLeftAfterMatchBegun()
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

    private fun highlightAnswers() {

        val correctIndices = this.matchService.changeQuestion.value!!.choices.map{ choice -> return  }

        for (i in 0 until answersContainer.childCount) {
            val answerButton = answersContainer.getChildAt(i) as Button
            val isSelected = selectedButtons.contains(answerButton)
            val isCorrect = correctIndices.contains(i)

            when {
                isSelected && isCorrect -> {
                    answerButton.setBackgroundResource(R.drawable.correct_answer_border)
                    answerButton.setCompoundDrawablesWithIntrinsicBounds(0, 0, R.drawable.ic_correct, 0)
                }
                isSelected && !isCorrect -> {
                    answerButton.setBackgroundResource(R.drawable.incorrect_answer_border)
                    answerButton.setCompoundDrawablesWithIntrinsicBounds(0, 0, R.drawable.ic_incorrect, 0)
                }
                else -> {
                    answerButton.setBackgroundResource(if (isCorrect) R.drawable.green_stroke else R.drawable.red_stroke)
                    answerButton.setCompoundDrawablesWithIntrinsicBounds(
                        0, 0,
                        if (isCorrect) R.drawable.ic_correct else R.drawable.ic_incorrect,
                        0
                    )
                }
            }
        }
    }
    private fun updatePlayerScore(newScore: Float) {
        playerScore.text = getString(R.string.playerScore) + " : $newScore"
    }

    private fun updateQuestionPoints(points: Int) {
        questionPointsText.text = getString(R.string.qsScore) + points
    }
    /*private fun showQuestion(index: Int) {
        if (index in questionsAndAnswers.indices) {
            val (question, answers, type) = questionsAndAnswers[index]
            questionTextView.text = question
            answersContainer.removeAllViews()
            selectedButtons.clear()

            // Adapter l'interface en fonction du type de question
            when (type) {
                "QCM" -> setupQCMQuestion(answers)
                "QRL" -> setupQRLQuestion()  // Réponse libre
                "QRE" -> setupQREQuestion()  // Slider
            }
        }
    }*/

    private fun showQuestion(question : IQuestion) {
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
        selectedButtons.clear()

        // Adapter l'interface en fonction du type de question
        when (question.type) {
            "QCM" -> setupQCMQuestion(question.choices)
            "QRL" -> setupQRLQuestion()  // Réponse libre
            "QRE" -> setupQREQuestion()  // Slider
        }
    }

    /*private fun setupQCMQuestion(answers: List<String>) {
        answers.forEachIndexed { index, answer ->
            val answerButton = createQCMAnswerButton(answer, index) { button ->
                toggleAnswerSelection(button)
            }
            answersContainer.addView(answerButton)
        }
    }*/

    private fun setupQCMQuestion(answers: List<IChoice>) {
        answers.forEachIndexed { index, answer ->
            val answerButton = createQCMAnswerButton(answer.text!!, index) { button ->
                toggleAnswerSelection(button)
            }
            answerButton.isEnabled = true
            answersContainer.addView(answerButton)
        }
    }



    private fun setupQRLQuestion() {
        answersContainer.removeAllViews()
        answersContainer.addView(createQRLAnswerBox())
    }

    private fun setupQREQuestion() {
        val slider = Slider(this).apply {
            valueFrom = this@PlayerInMatchActivity.matchService.changeQuestion.value!!.lowerBound
            valueTo = this@PlayerInMatchActivity.matchService.changeQuestion.value!!.upperBound
            stepSize = 0.5f
            value = (valueFrom + valueTo)/2
            setBackgroundColor(Color.TRANSPARENT)
            setPadding(20, 20, 20, 20)
            addOnChangeListener { _, value, _ ->
                questionPointsText.text = "Valeur sélectionnée : ${value.toInt()}"
            }
        }
        answersContainer.addView(slider)
    }

    private fun toggleAnswerSelection(button: Button) {
        if (selectedButtons.contains(button)) {
            button.setBackgroundResource(R.drawable.rectangle_orange_box) // Réinitialiser le fond par défaut
            selectedButtons.remove(button)
        } else {
            button.setBackgroundResource(R.drawable.selected_answer_border) // Couleur pour les réponses sélectionnées
            selectedButtons.add(button)
        }
        val choiceIndices = this.selectedButtons.map { button.text.firstOrNull()!!.digitToInt() - 1 }
        val choiceList = this.matchService.changeQuestion.value!!.choices
        this.matchService.updateAnswer(choiceIndices.map { index -> choiceList[index] }, time = timeRemaining!!.toInt())
    }

    private fun createQCMAnswerButton(answerText: String, answerIndex: Int, onClick: (Button) -> Unit): Button {
        return Button(this).apply {
            text = "${answerIndex + 1}. $answerText" // Afficher le numéro avant la réponse
            setBackgroundResource(R.drawable.rectangle_orange_box) // Fond par défaut
            setTextColor(Color.BLACK)
            textSize = 20f
            isAllCaps = false
            gravity = android.view.Gravity.START
            typeface = ResourcesCompat.getFont(this@PlayerInMatchActivity, R.font.roboto_regular)
            setPadding(20, 20, 20, 20)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 8, 0, 8)
            }
            setOnClickListener { onClick(this) }
        }
    }

    private fun createQRLAnswerBox(): View {
        // Inflate qrl_box layout as a View and find required components
        val qrlBox = layoutInflater.inflate(R.layout.qrl_box, null)
        val answerEditText = qrlBox.findViewById<EditText>(R.id.qrlEditText)
        val characterCounter = qrlBox.findViewById<TextView>(R.id.characterCounter)

        // Set character limit for answerEditText and add TextWatcher
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
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            // If permission is not granted, request it
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        } else {
            // Permission is granted, proceed to send the notification
            notificationManager.notify(1, notificationBuilder.build())
        }
    }
    private fun goToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        startActivity(intent)
        finish()
    }

    private fun showCorrectAnswers() {
        if(hasCorrectAnswers()) {this.matchService.score += this.matchService.changeQuestion.value!!.points}
        this.matchService.updateScore()
    }

    private fun hasCorrectAnswers(): Boolean {
        var hasCorrect = true
        for (i in 0 until this.matchService.changeQuestion.value!!.choices.size)
        {
            hasCorrect = (this.selectedButtons.find { button -> (button.text.firstOrNull()!!.digitToInt() -1 == i) } != null) ==
                this.matchService.changeQuestion.value!!.choices[i].isCorrect && hasCorrect
            Log.d("PlayerMatchActivity", "Has correct : " + hasCorrect.toString())
        }
        return hasCorrect
    }

    private fun navigateToMatchPreview() {
        val intent = Intent(this, GamePreviewActivity::class.java)
        // Optionally, pass necessary extras
        startActivity(intent)
        finish()
    }

    private fun navigateToResults(){
        val intent = if(!this.matchService.match!!.isTeamMatch)
            Intent(this, ResultsPageSoloActivity::class.java)
        else
            Intent(this, ResultsPageTeamActivity::class.java)
        // Optionally, pass necessary extras
        startActivity(intent)
        finish()
    }


    /*private fun showNextQuestionAndResetTimer() {
        currentQuestionIndex = (currentQuestionIndex + 1) % questionsAndAnswers.size
        showQuestion(currentQuestionIndex)
        startTimer(1000) // Lancer le minuteur avec une mise à jour toutes les secondes
    }*/

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
}
