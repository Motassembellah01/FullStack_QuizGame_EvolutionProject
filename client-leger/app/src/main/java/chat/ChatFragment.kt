package com.auth0.androidlogin

import ChatMessage
import ChatRoomMessageData
import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.InputFilter
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.Observer
import com.services.ChatSocketService
import android.util.Log
import android.view.KeyEvent
import android.view.inputmethod.EditorInfo
import android.widget.ImageView
import androidx.lifecycle.lifecycleScope
import com.auth0.androidlogin.utils.AuthUtils
import com.bumptech.glide.Glide
import com.bumptech.glide.request.RequestOptions
import com.services.AccountService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ChatFragment : Fragment() {
    private lateinit var chatLinearLayout: LinearLayout
    private lateinit var newMessageEditText: EditText
    private lateinit var chatScrollView: ScrollView
    private var channelName: String? = null
    private lateinit var characterCounter: TextView
    val chatService: ChatSocketService = ChatSocketService
    private lateinit var accountService: AccountService
    var userName: String? = null
    private var myUserId: String? = null
    private val userCache = mutableMapOf<String, Pair<String?, String?>>()

    private var userBlocked: List<String> = emptyList()
    private var userBlockingMe: List<String> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        arguments?.let {
            channelName = it.getString("CHANNEL_NAME")
        }
        accountService = AccountService(requireContext())
        userName = AuthUtils.getUserName(requireContext())
        myUserId = AuthUtils.getUserId(requireContext())
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.chat, container, false)
        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Find the LinearLayout in the inflated view
        chatLinearLayout = view.findViewById(R.id.chatLinearLayout)
        newMessageEditText = view.findViewById(R.id.new_message)
        chatScrollView = view.findViewById(R.id.chatScrollView)
        characterCounter = view.findViewById(R.id.characterCounter)

        fetchBlockedUsers()

        chatService.newMessage.observe(viewLifecycleOwner, Observer { message ->
            // This block will be triggered when a new message is received
            Log.d("ChatFragment", "Before message with value '$message'")
            if (message != null && chatService.currentChatRoom?.chatRoomName == message.chatRoomName) {
                if (!userBlocked.contains(message.data.userId) && !userBlockingMe.contains(message.data.userId)) {
                    addMessage(message.data)
                    scrollToBottom()
                }
            }
        })
        characterCounter.text = "0/200"
        setupMessageInput()

        val channelTextView: TextView = view.findViewById(R.id.channelTextView)
        channelTextView.text = channelName

        val sendButton: ImageButton = view.findViewById(R.id.ic_send_button)
        sendButton.setOnClickListener {
            sendMessage()
        }

        newMessageEditText.setOnEditorActionListener { _, actionId, event ->
            if (actionId == EditorInfo.IME_ACTION_SEND || event?.keyCode == KeyEvent.KEYCODE_ENTER) {
                sendMessage()
                scrollToBottom()
                true
            } else {
                false
            }
        }

        view.viewTreeObserver.addOnGlobalLayoutListener {
            val rect = android.graphics.Rect()
            view.getWindowVisibleDisplayFrame(rect)
            val screenHeight = view.rootView.height
            val keypadHeight = screenHeight - rect.bottom

            if (keypadHeight > screenHeight * 0.15) {
                scrollToBottom()
            }
        }

        val exitButton: ImageButton = view.findViewById(R.id.exitButton)
        val backArrowButton: ImageButton = view.findViewById(R.id.backArrowButton)

        backArrowButton.setOnClickListener {
            this.chatService.backToChannels()
            requireActivity().supportFragmentManager.popBackStack()
        }

        exitButton.setOnClickListener {
            view.visibility = View.GONE
            chatService.toggleChat()
        }

        val messages = chatService.getMessages() ?: return
        for(i in 0 until messages.size)
        {
            val chatMessage = messages[i].message
            if (!userBlocked.contains(chatMessage.userId) && !userBlockingMe.contains(chatMessage.userId)) {
                addMessage(chatMessage)
                Log.d("ChatFragment", "Message précédent ajouté: ${chatMessage.userId}")
            }else {
                Log.d("ChatFragment", "Message précédent ignoré de l'utilisateur bloqué ou vous bloquant : ${chatMessage.userId}")
            }
        }

        scrollToBottom()
    }

    private fun fetchBlockedUsers() {
        lifecycleScope.launch {
            try {
                // Récupérer les utilisateurs bloqués et ceux qui bloquent
                val blocked = withContext(Dispatchers.IO) { accountService.getBlockedUsers() ?: emptyList() }
                val blockingMe = withContext(Dispatchers.IO) { accountService.getUsersBlockingMe() ?: emptyList() }

                userBlocked = blocked as List<String> // Assigner la liste récupérée
                userBlockingMe = blockingMe as List<String> // Assigner la liste récupérée

                Log.d("ChatFragment", "UsersBlocked: $userBlocked, UsersBlockingMe: $userBlockingMe")
            } catch (e: Exception) {
                Log.e("ChatFragment", "Erreur lors du chargement des utilisateurs bloqués: ${e.message}")
            }
        }
    }


    private fun loadAvatar(imageView: ImageView, resId: Int?, base64: String?, avatarUrl: String?) {
        when {
            resId != null && resId != 0 -> {
                // Load from resource ID
                Glide.with(this)
                    .load(resId)
                    .apply(
                        RequestOptions()
                            .placeholder(R.drawable.image_not_found)
                            .error(R.drawable.image_not_found)
                            .circleCrop()
                    )
                    .into(imageView)
            }
            !base64.isNullOrEmpty() -> {
                Glide.with(this)
                    .load(base64)
                    .apply(
                        RequestOptions()
                            .placeholder(R.drawable.image_not_found)
                            .error(R.drawable.image_not_found)
                            .circleCrop()
                    )
                    .into(imageView)
            }
            !avatarUrl.isNullOrEmpty() -> {
                when {
                    avatarUrl.startsWith("data:image") -> {
                        Glide.with(this)
                            .load(avatarUrl)
                            .apply(
                                RequestOptions()
                                    .placeholder(R.drawable.image_not_found)
                                    .error(R.drawable.image_not_found)
                                    .circleCrop()
                            )
                            .into(imageView)
                    }
                    else -> {
                        val resIdFromUrl = accountService.getResourceIdFromImageUrl(avatarUrl)
                        if (resIdFromUrl != null && resIdFromUrl != 0) {
                            // Load from resource ID
                            Glide.with(this)
                                .load(resIdFromUrl)
                                .apply(
                                    RequestOptions()
                                        .placeholder(R.drawable.image_not_found)
                                        .error(R.drawable.image_not_found)
                                        .circleCrop()
                                )
                                .into(imageView)
                        } else {
                            // Load from URL
                            Glide.with(this)
                                .load(avatarUrl)
                                .apply(
                                    RequestOptions()
                                        .placeholder(R.drawable.image_not_found)
                                        .error(R.drawable.image_not_found)
                                        .circleCrop()
                                )
                                .into(imageView)
                        }
                    }
                }
            }
            else -> {
                imageView.setImageResource(R.drawable.image_not_found)
            }
        }
    }

    private fun addMessage(message: ChatMessage) {
        if (userBlocked.contains(message.userId) || userBlockingMe.contains(message.userId)) {
            Log.d("ChatFragment", "Message ignoré de l'utilisateur bloqué ou vous bloquant: ${message.userId}")
            return // Ne pas afficher le message
        }
        scrollToBottom()
        val messageView: View
        if (message.userId == myUserId) {
            messageView = LayoutInflater.from(requireContext()).inflate(R.layout.message_display_right, chatLinearLayout, false)
            val avatarImageView = messageView.findViewById<ImageView>(R.id.userAvatar)
            val (resId, base64) = AuthUtils.getUserProfilePicture(requireContext())
            Log.d("ChatFragment", "Loading Avatar for ${message.userId}")
            loadAvatar(avatarImageView, resId, base64, null)
        } else {
            messageView = LayoutInflater.from(requireContext()).inflate(R.layout.message_display_left, chatLinearLayout, false)
            val avatarImageView = messageView.findViewById<ImageView>(R.id.userAvatar)

            if (avatarImageView != null) {
                val cachedData = userCache[message.userId]
                if (cachedData?.second != null) {
                    // Load from cache
                    loadAvatar(avatarImageView, null, null, cachedData.second)
                } else {
                    // Fetch avatar if not in cache
                    lifecycleScope.launch(Dispatchers.IO) {
                        try {
                            val avatarUrl = accountService.getAvatarByUserId(message.userId)
                            userCache[message.userId] = cachedData?.copy(second = avatarUrl) ?: (null to avatarUrl)
                            withContext(Dispatchers.Main) {
                                loadAvatar(avatarImageView, null, null, avatarUrl)
                            }
                        } catch (e: Exception) {
                            Log.e("ChatFragment", "Failed to fetch avatar for userId: ${message.userId}, error: ${e.message}")
                            withContext(Dispatchers.Main) {
                                avatarImageView.setImageResource(R.drawable.image_not_found)
                            }
                        }
                    }
                }
            } else {
                Log.e("ChatFragment", "avatarImageView is null for other user's avatar")
            }
        }

        val usernameTextView: TextView = messageView.findViewById(R.id.usernameTextView)
        val messageTextView: TextView = messageView.findViewById(R.id.messageTextView)
        val timestampTextView: TextView = messageView.findViewById(R.id.timestampTextView)

        messageTextView.text = message.data
        timestampTextView.text = message.time
        chatLinearLayout.addView(messageView)

        // Fetch or use cached username
        val cachedData = userCache[message.userId]
        if (cachedData?.first != null) {
            usernameTextView.text = cachedData.first
        } else {
            lifecycleScope.launch(Dispatchers.IO) {
                try {
                    val pseudonym = accountService.getPseudonymByUserId(message.userId) ?: "Unknown"
                    userCache[message.userId] = cachedData?.copy(first = pseudonym) ?: (pseudonym to null)
                    withContext(Dispatchers.Main) {
                        usernameTextView.text = pseudonym
                    }
                } catch (e: Exception) {
                    Log.e("ChatFragment", "Failed to fetch username for userId: ${message.userId}, error: ${e.message}")
                }
            }
        }
    }

    private fun setupMessageInput() {
        newMessageEditText.filters = arrayOf(InputFilter.LengthFilter(200))

        newMessageEditText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val messageLength = s?.length ?: 0
                characterCounter.text = "$messageLength/200"

                if (messageLength >= 200) {
                    characterCounter.setTextColor(Color.RED)
                } else {
                    characterCounter.setTextColor(Color.GRAY)
                }
            }

            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun sendMessage() {
        val message = newMessageEditText.text.toString().trim()
        if (message.isNotEmpty() && message.length <= 200 && this.userName != null) {
            val chatName = chatService.currentChatRoom?.chatRoomName ?: ""
            val dateFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
            val formattedDate = dateFormat.format(Date())
            Log.d("ChatFragment", "Sending message: $message to $chatName")

            val chatMessage = ChatMessage(
                userId = myUserId ?: "",
                time = formattedDate,
                data = message,
            )

            chatService.sendMessage(
                ChatRoomMessageData(
                    chatName,
                    chatMessage
                )
            )

            newMessageEditText.text.clear()
            characterCounter.setTextColor(Color.GRAY)
            characterCounter.text = "0/200"
            scrollToBottom()
        }
    }
    private fun scrollToBottom() {
        Log.d("ChatFragment", "scrollToBottom called")
        chatScrollView.postDelayed({
            chatScrollView.fullScroll(View.FOCUS_DOWN)
        }, 300)
    }
}
